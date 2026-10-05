-- 0007_correcoes_pre_deploy.sql
--
-- Reúne tudo o que o canal MCP não consegue aplicar (ele recusa DELETE, DROP e
-- ALTER sem uma confirmação que não chega ao agente) e que precisa estar no ar
-- antes do deploy. Rodar inteiro no SQL Editor.

-- ====================================================================
-- 1. GRAVE — sair da parceria podia deixar dados inalcançáveis
-- ====================================================================
--
-- A versão anterior sempre tirava quem chamou, sem conferir mais nada. Dois
-- problemas reais:
--
--   a) Se o último membro saísse, todas as linhas ficavam num household sem
--      ninguém. Nenhuma policy de RLS alcança um household do qual você não é
--      membro, então aquilo virava dado inacessível para sempre.
--   b) Se quem saísse fosse quem criou a parceria, ela entregava o próprio
--      histórico ao ex-parceiro — o contrário do que a tela prometia.
--
-- Agora: só sai quem tem com quem deixar os dados, e quem fica herda o papel
-- de dono. A regra passa a ser a mesma para os dois lados, e a tela diz isso.
create or replace function public.sair_da_parceria()
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_eu uuid := auth.uid();
  v_antigo uuid;
  v_novo uuid;
  v_restante uuid;
  v_membros int;
begin
  if v_eu is null then
    raise exception 'nao_autenticado' using errcode = '42501';
  end if;

  select household_id into v_antigo
    from public.household_members where user_id = v_eu;
  if v_antigo is null then
    raise exception 'sem_household' using errcode = '42501';
  end if;

  select count(*) into v_membros
    from public.household_members where household_id = v_antigo;

  -- Sem parceria não há o que encerrar, e sair sozinho abandonaria os dados.
  if v_membros < 2 then
    raise exception 'sem_parceria' using errcode = '22023';
  end if;

  select user_id into v_restante
    from public.household_members
   where household_id = v_antigo and user_id <> v_eu
   limit 1;

  insert into public.households default values returning id into v_novo;

  delete from public.household_members where user_id = v_eu;
  insert into public.household_members (household_id, user_id, papel)
  values (v_novo, v_eu, 'owner');

  update public.profiles set household_id = v_novo where id = v_eu;

  -- Quem fica vira dono, mesmo que tenha entrado como parceiro. Sem isto o
  -- household poderia ficar sem nenhum 'owner'.
  update public.household_members set papel = 'owner'
   where household_id = v_antigo and user_id = v_restante;

  update public.household_invites set revogado_em = now()
   where household_id = v_antigo and usado_em is null and revogado_em is null;

  return v_novo;
end $$;

revoke execute on function public.sair_da_parceria() from public, anon;
grant  execute on function public.sair_da_parceria() to authenticated;


-- ====================================================================
-- 2. Exclusão de conta — destravar
-- ====================================================================
--
-- registrado_por usa ON DELETE RESTRICT: apagar um usuário esbarra na primeira
-- despesa dele, o que torna a exclusão de conta impossível. O lançamento é do
-- casal, não da pessoa: a linha sobrevive e a autoria fica nula. Isso é
-- pré-requisito do direito de exclusão (item 6 do roteiro).
alter table public.expenses alter column registrado_por drop not null;
alter table public.expenses drop constraint expenses_registrado_por_fkey;
alter table public.expenses add constraint expenses_registrado_por_fkey
  foreign key (registrado_por) references public.profiles (id) on delete set null;

alter table public.incomes alter column registrado_por drop not null;
alter table public.incomes drop constraint incomes_registrado_por_fkey;
alter table public.incomes add constraint incomes_registrado_por_fkey
  foreign key (registrado_por) references public.profiles (id) on delete set null;

alter table public.debts alter column registrado_por drop not null;
alter table public.debts drop constraint debts_registrado_por_fkey;
alter table public.debts add constraint debts_registrado_por_fkey
  foreign key (registrado_por) references public.profiles (id) on delete set null;

-- Mesmo motivo: o convite usado guarda quem o aceitou e bloquearia a exclusão.
alter table public.household_invites drop constraint household_invites_usado_por_fkey;
alter table public.household_invites add constraint household_invites_usado_por_fkey
  foreign key (usado_por) references public.profiles (id) on delete set null;

-- As restritivas de autoria passam a aceitar autoria nula.
do $do$
declare t text;
begin
  foreach t in array array['expenses', 'incomes', 'debts'] loop
    execute format('drop policy if exists %1$s_autoria_insert on public.%1$I', t);
    execute format('drop policy if exists %1$s_autoria_update on public.%1$I', t);
    execute format($f$
      create policy %1$s_autoria_insert on public.%1$I
        as restrictive for insert to authenticated
        with check (registrado_por is null or public.is_in_my_household(registrado_por))
    $f$, t);
    execute format($f$
      create policy %1$s_autoria_update on public.%1$I
        as restrictive for update to authenticated
        with check (registrado_por is null or public.is_in_my_household(registrado_por))
    $f$, t);
  end loop;
end $do$;


-- ====================================================================
-- 3. Limpeza das policies permissivas frouxas
-- ====================================================================
--
-- A 0004 fechou duas brechas com policies RESTRICTIVE adicionais, porque não
-- dava para substituir as defeituosas pelo canal automatizado. O efeito já é
-- o correto; isto deixa o schema honesto, sem regras frouxas convivendo com
-- as restritivas que as anulam.
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
  using      (id = auth.uid())
  with check (id = auth.uid() and household_id = public.current_household_id());
drop policy if exists profiles_nao_troca_household on public.profiles;

drop policy if exists subscriptions_write on public.subscriptions;
drop policy if exists subscriptions_sem_insert_cliente on public.subscriptions;
drop policy if exists subscriptions_sem_update_cliente on public.subscriptions;
drop policy if exists subscriptions_sem_delete_cliente on public.subscriptions;


-- ====================================================================
-- 4. Juros acima de 1000% ao ano
-- ====================================================================
-- numeric(6,3) estoura em 1000%, que não é hipótese remota: rotativo de cartão
-- e cheque especial passam disso.
alter table public.debts alter column juros type numeric(9,3);


-- ====================================================================
-- 5. anon em tabelas futuras
-- ====================================================================
-- O revoke da 0002 valia para as tabelas daquele instante; os privilégios
-- padrão do Supabase voltam a conceder anon em tabela criada depois.
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on functions from anon;
