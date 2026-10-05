-- 0001_schema.sql — estrutura de dados do Duo Finance
--
-- Atende aos passos 1 e 3 do roteiro do parecer técnico:
--   1. criar o backend;
--   3. dados em banco, cada registro com household_id, toda query filtrada
--      pelo usuário autenticado.
--
-- Também atende ao ponto "validação só no front": as regras que protegem
-- passam a existir no servidor, como NOT NULL, CHECK e tipos reais (date em
-- vez de texto). Nenhuma delas depende do cliente se comportar bem.
--
-- Convenção: colunas em snake_case, nomes de domínio em português. A tradução
-- para os tipos camelCase de src/types.ts fica em src/lib/mappers.ts, para que
-- nenhum componente precise mudar.

-- ---------------------------------------------------------------- identidade

-- O app nunca teve a entidade household: o agrupamento do casal existia só
-- como getHouseholdUserIds() filtrando arrays em memória. Aqui ela vira linha
-- de banco, que é o que torna o isolamento verificável.
create table public.households (
  id            uuid primary key default gen_random_uuid(),
  divisao_regra text not null default 'proportional'
                check (divisao_regra in ('equal', 'proportional')),
  created_at    timestamptz not null default now()
);

-- 1:1 com auth.users. Sem coluna de senha, hoje e sempre: a senha vive em
-- auth.users, com bcrypt no servidor (passo 2 do roteiro).
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  nome         text not null check (length(trim(nome)) > 0),
  email        text,
  avatar       text,
  cor_avatar   text not null default '#8B5CF6',
  salario      numeric(14,2) not null default 0 check (salario >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  papel        text not null default 'partner' check (papel in ('owner', 'partner')),
  created_at   timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- Um household por pessoa. É o invariante que faz current_household_id()
-- nunca ser ambíguo e, por consequência, as policies de RLS serem simples.
create unique index household_members_um_por_usuario
  on public.household_members (user_id);

-- -------------------------------------------------------------- dados do app

create table public.expenses (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references public.households (id) on delete cascade,
  registrado_por uuid not null references public.profiles (id) on delete restrict,
  descricao      text not null check (length(trim(descricao)) > 0),
  valor          numeric(14,2) not null check (valor >= 0),
  categoria      text not null check (categoria in (
                   'Moradia', 'Família', 'Assinaturas/Serviços', 'Cartões/Dívidas',
                   'Pessoal/Saúde', 'Alimentação', 'Outros')),
  pago           boolean not null default false,
  data           date not null,
  observacao     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index expenses_household_data_idx on public.expenses (household_id, data desc);

create table public.incomes (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references public.households (id) on delete cascade,
  registrado_por uuid not null references public.profiles (id) on delete restrict,
  descricao      text not null check (length(trim(descricao)) > 0),
  valor          numeric(14,2) not null check (valor >= 0),
  fonte          text not null,
  data           date not null,
  observacao     text,
  tipo           text check (tipo in ('salario', 'ferias', 'decimo_terceiro', 'renda_extra')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index incomes_household_data_idx on public.incomes (household_id, data desc);
-- syncRecurrentIncomesForUser apaga e regera um ano de receitas de uma pessoa.
create index incomes_sync_idx on public.incomes (registrado_por, tipo, data);

create table public.income_recurrence_configs (
  id                    uuid primary key default gen_random_uuid(),
  household_id          uuid not null references public.households (id) on delete cascade,
  dono_id               uuid not null references public.profiles (id) on delete cascade,
  tipo                  text not null check (tipo in ('salario', 'ferias', 'decimo_terceiro')),
  ativo                 boolean not null default true,
  dia_recebimento       smallint check (dia_recebimento between 1 and 31),
  periodos_ferias       jsonb,
  forma_decimo_terceiro text check (forma_decimo_terceiro in ('padrao', 'antecipado_ferias')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  -- saveIncomeRecurrenceConfig faz upsert por (dono, tipo).
  unique (dono_id, tipo)
);

create table public.monthly_goals (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  dono_id      uuid references public.profiles (id) on delete set null,
  nome         text not null check (length(trim(nome)) > 0),
  descricao    text,
  valor_alvo   numeric(14,2) not null check (valor_alvo > 0),
  valor_atual  numeric(14,2) not null default 0 check (valor_atual >= 0),
  mes          text not null,                       -- "Julho/2026", formato do app
  status       text not null default 'em_andamento'
               check (status in ('em_andamento', 'concluida')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index monthly_goals_household_idx on public.monthly_goals (household_id);

create table public.financial_goals (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  dono_id      uuid references public.profiles (id) on delete set null,
  nome         text not null check (length(trim(nome)) > 0),
  descricao    text,
  valor_alvo   numeric(14,2) not null check (valor_alvo > 0),
  valor_atual  numeric(14,2) not null default 0 check (valor_atual >= 0),
  categoria    text not null check (categoria in
               ('casa', 'carro', 'viagem', 'aposentadoria', 'outros')),
  -- O tipo aceita 'YYYY-MM-DD' ou 'YYYY-MM' (types.ts:73), então fica texto
  -- com formato validado — uma coluna date rejeitaria a forma curta.
  prazo        text not null check (prazo ~ '^\d{4}-\d{2}(-\d{2})?$'),
  prioridade   text not null check (prioridade in ('alta', 'media', 'baixa')),
  meta_mensal  numeric(14,2) not null default 0 check (meta_mensal >= 0),
  status       text not null default 'em_andamento'
               check (status in ('em_andamento', 'concluida')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index financial_goals_household_idx on public.financial_goals (household_id);

create table public.debts (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references public.households (id) on delete cascade,
  registrado_por uuid not null references public.profiles (id) on delete restrict,
  nome           text not null check (length(trim(nome)) > 0),
  valor_total    numeric(14,2) not null check (valor_total >= 0),
  valor_pago     numeric(14,2) not null default 0 check (valor_pago >= 0),
  juros          numeric(6,3) not null default 0,
  -- Formato "pagas/total". A tela divide valor_total pelo denominador para
  -- achar a parcela: sem o formato, o total colapsa para 1 e um clique quita
  -- a dívida inteira. A mesma regra do modal, agora também no servidor.
  parcelas       text not null default '1/1' check (parcelas ~ '^\d+\s*/\s*\d+$'),
  dono           text not null default 'individual' check (dono in ('individual', 'casal')),
  vencimento     date not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint debts_pago_nao_excede_total check (valor_pago <= valor_total)
);
create index debts_household_idx on public.debts (household_id);

create table public.category_budgets (
  id           uuid primary key default gen_random_uuid(),   -- o tipo em TS não tem id
  household_id uuid not null references public.households (id) on delete cascade,
  dono_id      uuid references public.profiles (id) on delete set null,
  categoria    text not null check (categoria in (
                 'Moradia', 'Família', 'Assinaturas/Serviços', 'Cartões/Dívidas',
                 'Pessoal/Saúde', 'Alimentação', 'Outros')),
  limite       numeric(14,2) not null check (limite >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- Um orçamento por categoria por casal: é o que BudgetView renderiza.
  unique (household_id, categoria)
);

create table public.subscriptions (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  plano      text not null default 'free'   check (plano  in ('free', 'duo')),
  status     text not null default 'active' check (status in ('active', 'cancelled')),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------- updated_at

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_touch                  before update on public.profiles                  for each row execute function public.touch_updated_at();
create trigger expenses_touch                  before update on public.expenses                  for each row execute function public.touch_updated_at();
create trigger incomes_touch                   before update on public.incomes                   for each row execute function public.touch_updated_at();
create trigger income_recurrence_configs_touch before update on public.income_recurrence_configs for each row execute function public.touch_updated_at();
create trigger monthly_goals_touch             before update on public.monthly_goals             for each row execute function public.touch_updated_at();
create trigger financial_goals_touch           before update on public.financial_goals           for each row execute function public.touch_updated_at();
create trigger debts_touch                     before update on public.debts                     for each row execute function public.touch_updated_at();
create trigger category_budgets_touch          before update on public.category_budgets          for each row execute function public.touch_updated_at();
create trigger subscriptions_touch             before update on public.subscriptions             for each row execute function public.touch_updated_at();

-- ------------------------------------------- criação de conta (passo 2 do roteiro)

-- Cadastro cria household, profile, associação e assinatura numa transação só.
-- O cliente nunca escreve dado de identidade — e e-mail duplicado passa a ser
-- erro do Supabase Auth, o que elimina a tomada de conta por cadastro que
-- existia em AppContext.signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_household uuid;
begin
  insert into public.households default values returning id into v_household;

  insert into public.profiles (id, household_id, nome, email, salario, cor_avatar, avatar)
  values (
    new.id,
    v_household,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), 'Novo Usuário'),
    lower(new.email),
    coalesce((new.raw_user_meta_data ->> 'salario')::numeric, 0),
    coalesce(new.raw_user_meta_data ->> 'cor_avatar', '#8B5CF6'),
    new.raw_user_meta_data ->> 'avatar'
  );

  insert into public.household_members (household_id, user_id, papel)
  values (v_household, new.id, 'owner');

  insert into public.subscriptions (user_id, plano) values (new.id, 'free');

  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
