-- 0002_rls.sql — isolamento real entre casais
--
-- Passo 3 do roteiro do parecer: "toda query filtrada pelo usuário
-- autenticado. É isso que cria o isolamento real entre casais."
--
-- O filtro deixa de ser o getHouseholdUserIds() do front, que o DevTools
-- contorna, e passa a ser política de banco: o Postgres não entrega a linha,
-- independentemente do que o cliente peça.

-- ------------------------------------------------------------------ helpers

-- SECURITY DEFINER aqui não é conveniência, é necessidade: household_members
-- também tem RLS, e uma policy de expenses que consultasse household_members
-- — cuja própria policy consulta household_members — resultaria em
-- "42P17 infinite recursion detected in policy". A função definer corta o ciclo.
--
-- stable: o planner avalia uma vez por query, não por linha.
-- set search_path: fecha o sequestro de resolução de nomes em função definer.
create or replace function public.current_household_id()
returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  select household_id from public.household_members where user_id = auth.uid() limit 1
$$;

create or replace function public.is_in_my_household(p_user uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.household_members
     where user_id = p_user
       and household_id = public.current_household_id()
  )
$$;

revoke execute on function public.current_household_id()      from public, anon;
revoke execute on function public.is_in_my_household(uuid)    from public, anon;
grant  execute on function public.current_household_id()      to authenticated;
grant  execute on function public.is_in_my_household(uuid)    to authenticated;

-- Decisão: subquery, não claim no JWT.
-- Um claim customizado seria mais barato por query, mas fica obsoleto até o
-- token renovar. Na prática: ao desfazer a parceria, a pessoa que saiu
-- continuaria com leitura e escrita nas finanças da ex-parceira pelo resto da
-- validade do token. Isso é brecha, não lentidão. A subquery custa um index
-- scan em household_members_um_por_usuario e está sempre correta.

-- ------------------------------------------------------- tabelas de dados

-- O mesmo par de predicados se repete nas 7 tabelas de dados. O WITH CHECK no
-- UPDATE é o que costuma faltar: sem ele, um update de household_id MOVE a
-- linha para outro casal — exfiltração por escrita, não por leitura.
do $$
declare t text;
begin
  foreach t in array array[
    'expenses', 'incomes', 'income_recurrence_configs',
    'monthly_goals', 'financial_goals', 'debts', 'category_budgets'
  ] loop
    execute format('alter table public.%I enable row level security', t);

    execute format($f$
      create policy %1$s_select on public.%1$I for select to authenticated
        using (household_id = public.current_household_id())
    $f$, t);

    execute format($f$
      create policy %1$s_insert on public.%1$I for insert to authenticated
        with check (household_id = public.current_household_id())
    $f$, t);

    execute format($f$
      create policy %1$s_update on public.%1$I for update to authenticated
        using      (household_id = public.current_household_id())
        with check (household_id = public.current_household_id())
    $f$, t);

    execute format($f$
      create policy %1$s_delete on public.%1$I for delete to authenticated
        using (household_id = public.current_household_id())
    $f$, t);
  end loop;
end $$;

-- ------------------------------------------------------------- identidade

alter table public.profiles enable row level security;

-- Vejo a mim e a quem divide o household comigo. Mais ninguém.
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_in_my_household(id));

-- Edito só o meu perfil. Alterar o salário da parceira passa pela função
-- abaixo, para que o acesso não se estenda a nome, avatar e household_id.
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Sem policy de INSERT: profiles nascem no trigger de auth.users, que é
-- definer e passa por cima do RLS. Nenhum cliente cria perfil.

alter table public.households enable row level security;
create policy households_select on public.households for select to authenticated
  using (id = public.current_household_id());
create policy households_update on public.households for update to authenticated
  using      (id = public.current_household_id())
  with check (id = public.current_household_id());

alter table public.household_members enable row level security;
create policy household_members_select on public.household_members for select to authenticated
  using (household_id = public.current_household_id());
-- Nenhuma policy de insert/update/delete: negação total para escrita.
-- É isto que impede "adicionar a mim mesmo no household dos outros" pelo
-- cliente JS. Entrar num household só acontece por convite validado no
-- servidor (migration 0003).

alter table public.subscriptions enable row level security;
create policy subscriptions_select on public.subscriptions for select to authenticated
  using (user_id = auth.uid() or public.is_in_my_household(user_id));
create policy subscriptions_write on public.subscriptions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- -------------------------------------------- salário da parceira (escopo estreito)

-- updateUserSalario(valor, userId) edita o salário da outra pessoa pelo
-- seletor do IncomeRecurrenceModal. Em vez de afrouxar profiles_update_self,
-- que daria acesso a nome e avatar junto, uma função que só toca o salário.
create or replace function public.set_member_salario(p_user uuid, p_valor numeric)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_valor is null or p_valor < 0 then
    raise exception 'salario_invalido' using errcode = '22023';
  end if;
  if not (p_user = auth.uid() or public.is_in_my_household(p_user)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.profiles set salario = p_valor where id = p_user;
end $$;

revoke execute on function public.set_member_salario(uuid, numeric) from public, anon;
grant  execute on function public.set_member_salario(uuid, numeric) to authenticated;

-- ------------------------------------------------------------------ anon

-- Sem sessão, nada. A chave anon publicada no bundle não dá acesso a linha
-- nenhuma: autoridade vem do JWT do usuário, não da chave.
revoke all on all tables in schema public from anon;
