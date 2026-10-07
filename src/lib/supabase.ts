import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Sem configuração, o app não fica em branco: ele avisa e segue. Um throw no
 * topo do módulo derrubaria a página inteira assim que qualquer import o
 * alcançasse — inclusive no modo demo, que existe justamente para rodar sem
 * backend. Quem depende da sessão checa `supabaseConfigurado` antes.
 */
export const supabaseConfigurado = Boolean(url && publishableKey);

if (!supabaseConfigurado) {
  console.warn(
    '[duo-finance] VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY não estão ' +
    'definidas. Copie .env.example para .env.local e preencha. Recursos que ' +
    'dependem de conta ficarão indisponíveis.'
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
const opcoes = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'duo_finance_auth',
  },
};

/**
 * Sem configuração, o cliente é criado apontando para um endereço inerte.
 * `createClient('', '')` lança "supabaseUrl is required" já na avaliação do
 * módulo — ou seja, antes de qualquer guarda poder rodar — e a aplicação
 * inteira iria a tela branca. Com o cliente inerte, quem depende de sessão
 * checa `supabaseConfigurado` e o resto do app continua de pé.
 */
export const supabase = supabaseConfigurado
  ? createClient(url as string, publishableKey as string, opcoes)
  : createClient('http://localhost:54321', 'sem-chave-configurada', opcoes);
