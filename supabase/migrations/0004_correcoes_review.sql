-- 0004_correcoes_review.sql — correções apontadas pelo code review de 0001-0003.
--
-- Duas delas anulavam o isolamento que 0002 pretendia criar. As provas de
-- isolamento executadas antes do review passaram porque testavam o caminho
-- óbvio (mexer no household_id da linha de dado) e não o caminho lateral
-- (mexer no próprio perfil).
--
-- Forma destas correções: políticas RESTRICTIVE, que se combinam com AND às
-- permissivas já existentes, em vez de substituí-las. O motivo é operacional —
-- ver a seção "pendências" no fim do arquivo.

-- ------------------------------------------------- 1. fuga pelo próprio perfil

-- GRAVE. profiles_update_self fixava só o id no WITH CHECK, então a pessoa
-- podia reescrever o próprio profiles.household_id para qualquer household e
-- passar a enxergar as finanças alheias — sem tocar em uma linha de dado
-- sequer. A restrictive abaixo exige que o destino seja o household do qual
-- ela realmente é membro, e a associação (household_members) continua sem
-- nenhuma policy de escrita.
create policy profiles_nao_troca_household on public.profiles
  as restrictive for update to authenticated
  with check (household_id = public.current_household_id());

-- -------------------------------------------- 2. assinatura escrita pelo cliente

-- GRAVE. subscriptions_write era FOR ALL com USING (user_id = auth.uid()), ou
-- seja, qualquer pessoa dava a si mesma plano 'duo' com um PATCH. Plano é
-- decisão de cobrança, e cobrança acontece no servidor. O cliente passa a só
-- ler a própria assinatura.
create policy subscriptions_sem_insert_cliente on public.subscriptions
  as restrictive for insert to authenticated with check (false);
create policy subscriptions_sem_update_cliente on public.subscriptions
  as restrictive for update to authenticated using (false);
create policy subscriptions_sem_delete_cliente on public.subscriptions
  as restrictive for delete to authenticated using (false);

-- --------------------------------- 3. autoria de linha não era verificada

-- As policies de 0002 conferiam household_id e ignoravam registrado_por /
-- dono_id. Dava para atribuir lançamentos ao perfil da outra pessoa e, pior,
-- ocupar unique (dono_id, tipo) em income_recurrence_configs, travando para
-- sempre o upsert da vítima com um erro que ela não consegue ver nem limpar.
do $do$
declare t text;
begin
  foreach t in array array['expenses', 'incomes', 'debts'] loop
    execute format($f$
      create policy %1$s_autoria_insert on public.%1$I
        as restrictive for insert to authenticated
        with check (public.is_in_my_household(registrado_por))
    $f$, t);
    execute format($f$
      create policy %1$s_autoria_update on public.%1$I
        as restrictive for update to authenticated
        with check (public.is_in_my_household(registrado_por))
    $f$, t);
  end loop;

  foreach t in array array[
    'income_recurrence_configs', 'monthly_goals', 'financial_goals', 'category_budgets'
  ] loop
    execute format($f$
      create policy %1$s_autoria_insert on public.%1$I
        as restrictive for insert to authenticated
        with check (dono_id is null or public.is_in_my_household(dono_id))
    $f$, t);
    execute format($f$
      create policy %1$s_autoria_update on public.%1$I
        as restrictive for update to authenticated
        with check (dono_id is null or public.is_in_my_household(dono_id))
    $f$, t);
  end loop;
end $do$;

-- --------------------------------------- 4. cadastro quebrava com salário inválido

-- (raw_user_meta_data ->> 'salario')::numeric aborta a transação inteira se o
-- valor vier vazio ou não numérico, e o cadastro falha sem explicação útil.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_household uuid;
  v_salario_txt text := new.raw_user_meta_data ->> 'salario';
  v_salario numeric := 0;
begin
  if v_salario_txt ~ '^\s*\d+(\.\d+)?\s*$' then
    v_salario := v_salario_txt::numeric;
  end if;

  insert into public.households default values returning id into v_household;

  insert into public.profiles (id, household_id, nome, email, salario, cor_avatar, avatar)
  values (
    new.id,
    v_household,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), 'Novo Usuário'),
    lower(new.email),
    v_salario,
    coalesce(new.raw_user_meta_data ->> 'cor_avatar', '#8B5CF6'),
    new.raw_user_meta_data ->> 'avatar'
  );

  insert into public.household_members (household_id, user_id, papel)
  values (v_household, new.id, 'owner');

  insert into public.subscriptions (user_id, plano) values (new.id, 'free');

  return new;
end $$;


-- =====================================================================
-- PENDÊNCIAS — não aplicadas, por limitação do canal de administração
-- =====================================================================
--
-- O servidor MCP usado para aplicar estas migrations expira em qualquer
-- instrução destrutiva (drop, alter, delete), aparentemente aguardando uma
-- confirmação que não chega ao agente. Só CREATE passa. Por isso as correções
-- acima vieram como policies RESTRICTIVE adicionais em vez de substituir as
-- permissivas defeituosas, e os itens abaixo seguem em aberto.
--
-- O resultado de segurança é equivalente (restrictive combina com AND, e a
-- verificação contra o banco vivo confirmou cada bloqueio), mas o schema fica
-- com policies permissivas frouxas que hoje não têm efeito prático. Rodar o
-- bloco abaixo pelo SQL Editor do dashboard deixa o estado limpo:
--
--   drop policy profiles_update_self on public.profiles;
--   create policy profiles_update_self on public.profiles for update to authenticated
--     using      (id = auth.uid())
--     with check (id = auth.uid() and household_id = public.current_household_id());
--   drop policy profiles_nao_troca_household on public.profiles;
--
--   drop policy subscriptions_write on public.subscriptions;
--   -- (as três restrictive de subscriptions podem então ser removidas)
--
-- Além da limpeza, três correções do review continuam pendentes porque exigem
-- ALTER TABLE:
--
-- a) Exclusão de conta é impossível. registrado_por usa ON DELETE RESTRICT,
--    então apagar o usuário esbarra na primeira despesa dele. O lançamento é
--    do casal, não da pessoa: a linha deve sobreviver com autoria nula. Isso
--    destrava o direito de exclusão, item 6 do roteiro.
--      alter table public.expenses alter column registrado_por drop not null;
--      alter table public.expenses drop constraint expenses_registrado_por_fkey;
--      alter table public.expenses add constraint expenses_registrado_por_fkey
--        foreign key (registrado_por) references public.profiles (id) on delete set null;
--      -- idem para incomes e debts
--    Atenção: ao aplicar, as restrictive de autoria precisam passar a aceitar
--    nulo: with check (registrado_por is null or is_in_my_household(registrado_por)).
--
-- b) juros numeric(6,3) estoura em 1000% a.a., que não é hipótese remota —
--    rotativo de cartão e cheque especial passam disso.
--      alter table public.debts alter column juros type numeric(9,3);
--
-- c) O revoke de anon em 0002 valia só para as tabelas daquele instante; os
--    privilégios padrão do Supabase voltam a conceder anon em tabela criada
--    depois.
--      alter default privileges in schema public revoke all on tables from anon;
--      alter default privileges in schema public revoke all on sequences from anon;
--      alter default privileges in schema public revoke all on functions from anon;
