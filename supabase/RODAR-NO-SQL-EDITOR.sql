-- Rodar no SQL Editor do Supabase (projeto duo-finance-br).
-- A tabela household_invites, a policy e criar_convite_household ja estao aplicadas.
-- Faltam as duas funcoes abaixo: o canal MCP bloqueia corpos com DELETE.

create or replace function public.aceitar_convite_household(p_token uuid)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_convite public.household_invites;
  v_eu uuid := auth.uid();
  v_meu_household uuid;
  v_meu_email text;
  v_membros int;
begin
  if v_eu is null then
    raise exception 'nao_autenticado' using errcode = '42501';
  end if;

  -- FOR UPDATE: trava a linha. Sem isso, dois aceites simultâneos passariam
  -- os dois pela checagem de "ainda não usado" antes de qualquer um gravar.
  select * into v_convite from public.household_invites
   where token = p_token for update;

  if v_convite.id is null
     or v_convite.usado_em is not null
     or v_convite.revogado_em is not null
     or v_convite.expira_em <= now() then
    raise exception 'convite_invalido' using errcode = '22023';
  end if;

  if v_convite.convidado_por = v_eu then
    raise exception 'convite_proprio' using errcode = '22023';
  end if;

  -- O vínculo com o e-mail convidado é o que impede entrar na parceria alheia
  -- por tentativa, mesmo que o token vaze.
  select lower(email) into v_meu_email from auth.users where id = v_eu;
  if v_meu_email is distinct from v_convite.convidado_email then
    raise exception 'convite_de_outro_email' using errcode = '42501';
  end if;

  select count(*) into v_membros
    from public.household_members where household_id = v_convite.household_id;
  if v_membros >= 2 then
    raise exception 'parceria_ja_ativa' using errcode = '23505';
  end if;

  select household_id into v_meu_household
    from public.household_members where user_id = v_eu;

  select count(*) into v_membros
    from public.household_members where household_id = v_meu_household;
  if v_membros > 1 then
    raise exception 'ja_tem_parceria' using errcode = '23505';
  end if;

  -- Os lançamentos de quem aceita vêm junto. Deixá-los para trás apagaria da
  -- vista o histórico da pessoa sem avisar; trazer preserva tudo.
  -- Orçamento tem unique (household_id, categoria): onde as duas pessoas já
  -- tinham a mesma categoria, prevalece o de quem convidou.
  delete from public.category_budgets
   where household_id = v_meu_household
     and categoria in (select categoria from public.category_budgets
                        where household_id = v_convite.household_id);

  update public.expenses                  set household_id = v_convite.household_id where household_id = v_meu_household;
  update public.incomes                   set household_id = v_convite.household_id where household_id = v_meu_household;
  update public.income_recurrence_configs set household_id = v_convite.household_id where household_id = v_meu_household;
  update public.monthly_goals             set household_id = v_convite.household_id where household_id = v_meu_household;
  update public.financial_goals           set household_id = v_convite.household_id where household_id = v_meu_household;
  update public.debts                     set household_id = v_convite.household_id where household_id = v_meu_household;
  update public.category_budgets          set household_id = v_convite.household_id where household_id = v_meu_household;

  delete from public.household_members where user_id = v_eu;
  insert into public.household_members (household_id, user_id, papel)
  values (v_convite.household_id, v_eu, 'partner');

  update public.profiles set household_id = v_convite.household_id where id = v_eu;

  -- O household antigo fica vazio; removê-lo evita lixo acumulado.
  delete from public.households where id = v_meu_household;

  update public.household_invites
     set usado_em = now(), usado_por = v_eu
   where id = v_convite.id;

  return v_convite.household_id;
end $$;

revoke execute on function public.aceitar_convite_household(uuid) from public, anon;
grant  execute on function public.aceitar_convite_household(uuid) to authenticated;

-- ------------------------------------------------------- desfazer parceria

-- Quem sai recomeça num household próprio e vazio. Os lançamentos ficam com o
-- household original: foram registrados como do casal, e dividi-los
-- automaticamente seria um palpite sobre de quem é o quê. Nada é apagado.
create or replace function public.sair_da_parceria()
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_eu uuid := auth.uid();
  v_antigo uuid;
  v_novo uuid;
begin
  if v_eu is null then
    raise exception 'nao_autenticado' using errcode = '42501';
  end if;

  select household_id into v_antigo
    from public.household_members where user_id = v_eu;
  if v_antigo is null then
    raise exception 'sem_household' using errcode = '42501';
  end if;

  insert into public.households default values returning id into v_novo;

  delete from public.household_members where user_id = v_eu;
  insert into public.household_members (household_id, user_id, papel)
  values (v_novo, v_eu, 'owner');

  update public.profiles set household_id = v_novo where id = v_eu;

  update public.household_invites set revogado_em = now()
   where household_id = v_antigo and usado_em is null and revogado_em is null;

  return v_novo;
end $$;

revoke execute on function public.sair_da_parceria() from public, anon;
grant  execute on function public.sair_da_parceria() to authenticated;
