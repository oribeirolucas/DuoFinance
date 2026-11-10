-- 0008_direitos_do_titular.sql — exclusão de conta pelo próprio titular
--
-- LGPD, art. 18: o titular pode pedir acesso aos dados (exportação, feita no
-- cliente com as mesmas policies de RLS) e a eliminação deles. Até aqui o app
-- não tinha nenhum dos dois: para sair, a pessoa dependia de alguém mexer no
-- banco.
--
-- A exclusão não pode ser um `delete` do cliente. Apagar uma linha de
-- auth.users exige privilégio que o usuário não tem — e não deve ter, porque
-- a mesma permissão apagaria a conta alheia. Daí a função definer.

-- ============================================================ exclusão

create or replace function public.excluir_minha_conta(p_senha text)
returns jsonb
language plpgsql security definer set search_path = public, auth, extensions, pg_temp as $$
declare
  v_eu        uuid := auth.uid();
  v_household uuid;
  v_membros   int;
  v_restante  uuid;
  v_confere   boolean;
  v_apagou_household boolean := false;
begin
  if v_eu is null then
    raise exception 'nao_autenticado' using errcode = '42501';
  end if;

  -- Reautenticação no servidor, não no cliente. Conferir a senha só no front
  -- deixaria a exclusão a um POST de distância para quem tivesse o JWT —
  -- numa ação irreversível, isso não serve.
  select u.encrypted_password = extensions.crypt(p_senha, u.encrypted_password)
    into v_confere
    from auth.users u where u.id = v_eu;

  if v_confere is not true then
    raise exception 'senha_incorreta' using errcode = '42501';
  end if;

  select household_id into v_household
    from public.household_members where user_id = v_eu;

  if v_household is not null then
    select count(*) into v_membros
      from public.household_members where household_id = v_household;

    if v_membros > 1 then
      -- Há parceiro. Os lançamentos são do casal: apagá-los levaria junto o
      -- histórico de quem fica, que não pediu nada. Ficam com quem permanece,
      -- e a autoria vira nula pelas FKs `on delete set null` da 0007.
      select user_id into v_restante
        from public.household_members
       where household_id = v_household and user_id <> v_eu
       limit 1;

      update public.household_members set papel = 'owner'
       where household_id = v_household and user_id = v_restante;
    else
      -- Sozinha: o household inteiro sai. Sem isto, as linhas sobreviveriam
      -- num household sem nenhum membro — inalcançáveis por qualquer policy
      -- de RLS, e portanto impossíveis de apagar depois. Seria "exclusão"
      -- que não exclui.
      v_apagou_household := true;
    end if;
  end if;

  -- Convites emitidos por mim deixam de valer antes de eu sumir.
  update public.household_invites set revogado_em = now()
   where convidado_por = v_eu and usado_em is null and revogado_em is null;

  -- A foto de perfil vive no Storage e NÃO sai daqui: o Supabase recusa
  -- `delete from storage.objects` mesmo numa função definer ("Direct deletion
  -- from storage tables is not allowed"), e a recusa derruba a transação
  -- inteira. Quem apaga é o cliente, pela Storage API, logo ANTES de chamar
  -- esta função — nessa ordem porque o pior caso vira "a pessoa reenvia a
  -- foto", em vez de "sobrou um retrato num bucket público para sempre".

  if v_apagou_household then
    delete from public.households where id = v_household;
  end if;

  -- Último passo: some a identidade. O cascade de auth.users leva profiles,
  -- e o de profiles leva household_members, subscriptions e a configuração de
  -- recorrência. Metas, orçamento e lançamentos do casal ficam com dono nulo.
  delete from auth.users where id = v_eu;

  return jsonb_build_object(
    'excluido', true,
    'household_apagado', v_apagou_household,
    'parceiro_promovido', v_restante
  );
end $$;

revoke execute on function public.excluir_minha_conta(text) from public, anon;
grant  execute on function public.excluir_minha_conta(text) to authenticated;

comment on function public.excluir_minha_conta(text) is
  'LGPD art. 18, VI. Exige a senha da conta. Com parceiro, os lançamentos do '
  'casal ficam com quem permanece e a autoria é anonimizada; sozinho, o '
  'household inteiro é apagado.';
