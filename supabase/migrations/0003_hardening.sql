-- 0003_hardening.sql — correções apontadas pelo advisor de segurança do Supabase
-- após 0001 e 0002.

-- 1. touch_updated_at ficou sem search_path fixo. Função de trigger sem
--    search_path pode ser induzida a resolver um nome para um objeto plantado
--    por quem dispara o trigger. As demais funções já declaravam.
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- 2. handle_new_user é função de trigger, mas o PostgREST a expunha como
--    /rest/v1/rpc/handle_new_user para anon e authenticated. Chamá-la
--    diretamente falharia (função de trigger exige contexto de trigger), mas
--    endpoint que não deveria existir não fica aberto.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Nota sobre o que o advisor ainda aponta e é intencional:
-- current_household_id, is_in_my_household e set_member_salario continuam
-- executáveis por authenticated. As duas primeiras são obrigatórias — as
-- policies de RLS as chamam no contexto do usuário, então sem o GRANT toda
-- query falha. Nenhuma das três vaza nada: as duas primeiras só respondem
-- sobre o household de quem pergunta, e a terceira valida a associação antes
-- de escrever.
