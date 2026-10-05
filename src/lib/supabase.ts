import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    'VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY precisam estar definidas. ' +
    'Copie .env.example para .env.local e preencha.'
  );
}

/**
 * A chave publicável vai para o bundle por projeto — ela identifica, não
 * autoriza. Quem autoriza é o JWT do usuário, e o que ele alcança é decidido
 * pelas policies de RLS no Postgres. Sem sessão, esta chave não lê uma linha
 * sequer (verificado: `permission denied for table expenses`).
 *
 * A chave service_role nunca entra aqui, nem em qualquer arquivo que o Vite
 * empacote: ela ignora RLS por definição.
 */
export const supabase = createClient(url, publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'duo_finance_auth',
  },
});
