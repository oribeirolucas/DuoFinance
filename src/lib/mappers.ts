/**
 * Tradução entre os tipos do app (camelCase, em português) e as colunas do
 * Postgres (snake_case).
 *
 * Fica num lugar só de propósito: assim os 14 componentes que consomem o
 * contexto não precisam saber que o banco existe, e `src/types.ts` continua
 * sendo a descrição do domínio, não do schema.
 *
 * As funções são explícitas, uma por entidade, em vez de um conversor genérico
 * de maiúsculas. Um conversor genérico seria menor e invisível ao type-checker;
 * estas quebram o build quando uma coluna muda de nome.
 */
import type {
  Expense, Income, IncomeRecurrenceConfig, MonthlyGoal,
  FinancialGoal, Debt, CategoryBudget, Subscription, ExpenseCategory
} from '../types';

type Linha = Record<string, any>;

/** PostgREST devolve `numeric` como número, mas pode devolver string em
 *  algumas versões. Normalizar aqui evita `"1200.00" + 5 === "1200.005"`. */
const num = (v: unknown): number => Number(v) || 0;

// ---------------------------------------------------------------- despesas

export const paraExpense = (l: Linha): Expense => ({
  id: l.id,
  descricao: l.descricao,
  valor: num(l.valor),
  categoria: l.categoria as ExpenseCategory,
  pago: Boolean(l.pago),
  registradoPor: l.registrado_por ?? '',
  data: l.data,
  observacao: l.observacao ?? undefined,
});

export const deExpense = (e: Partial<Expense>, householdId?: string): Linha => ({
  ...(e.id !== undefined && { id: e.id }),
  ...(householdId !== undefined && { household_id: householdId }),
  ...(e.descricao !== undefined && { descricao: e.descricao }),
  ...(e.valor !== undefined && { valor: e.valor }),
  ...(e.categoria !== undefined && { categoria: e.categoria }),
  ...(e.pago !== undefined && { pago: e.pago }),
  ...(e.registradoPor !== undefined && { registrado_por: e.registradoPor }),
  ...(e.data !== undefined && { data: e.data }),
  ...(e.observacao !== undefined && { observacao: e.observacao }),
});

// ---------------------------------------------------------------- receitas

export const paraIncome = (l: Linha): Income => ({
  id: l.id,
  descricao: l.descricao,
  valor: num(l.valor),
  fonte: l.fonte,
  registradoPor: l.registrado_por ?? '',
  data: l.data,
  observacao: l.observacao ?? undefined,
  tipo: l.tipo ?? undefined,
});

export const deIncome = (i: Partial<Income>, householdId?: string): Linha => ({
  ...(i.id !== undefined && { id: i.id }),
  ...(householdId !== undefined && { household_id: householdId }),
  ...(i.descricao !== undefined && { descricao: i.descricao }),
  ...(i.valor !== undefined && { valor: i.valor }),
  ...(i.fonte !== undefined && { fonte: i.fonte }),
  ...(i.registradoPor !== undefined && { registrado_por: i.registradoPor }),
  ...(i.data !== undefined && { data: i.data }),
  ...(i.observacao !== undefined && { observacao: i.observacao }),
  ...(i.tipo !== undefined && { tipo: i.tipo }),
});

// ------------------------------------------------- recorrência de receitas

export const paraRecorrencia = (l: Linha): IncomeRecurrenceConfig => ({
  id: l.id,
  donoId: l.dono_id,
  tipo: l.tipo,
  ativo: Boolean(l.ativo),
  diaRecebimento: l.dia_recebimento ?? undefined,
  periodosFerias: l.periodos_ferias ?? undefined,
  formaDecimoTerceiro: l.forma_decimo_terceiro ?? undefined,
});

export const deRecorrencia = (c: Partial<IncomeRecurrenceConfig>, householdId?: string): Linha => ({
  ...(c.id !== undefined && { id: c.id }),
  ...(householdId !== undefined && { household_id: householdId }),
  ...(c.donoId !== undefined && { dono_id: c.donoId }),
  ...(c.tipo !== undefined && { tipo: c.tipo }),
  ...(c.ativo !== undefined && { ativo: c.ativo }),
  ...(c.diaRecebimento !== undefined && { dia_recebimento: c.diaRecebimento }),
  ...(c.periodosFerias !== undefined && { periodos_ferias: c.periodosFerias }),
  ...(c.formaDecimoTerceiro !== undefined && { forma_decimo_terceiro: c.formaDecimoTerceiro }),
});

// ------------------------------------------------------------ metas do mês

export const paraMonthlyGoal = (l: Linha): MonthlyGoal => ({
  id: l.id,
  nome: l.nome,
  descricao: l.descricao ?? '',
  valorAlvo: num(l.valor_alvo),
  valorAtual: num(l.valor_atual),
  mes: l.mes,
  status: l.status,
  donoId: l.dono_id ?? undefined,
});

export const deMonthlyGoal = (g: Partial<MonthlyGoal>, householdId?: string): Linha => ({
  ...(g.id !== undefined && { id: g.id }),
  ...(householdId !== undefined && { household_id: householdId }),
  ...(g.nome !== undefined && { nome: g.nome }),
  ...(g.descricao !== undefined && { descricao: g.descricao }),
  ...(g.valorAlvo !== undefined && { valor_alvo: g.valorAlvo }),
  ...(g.valorAtual !== undefined && { valor_atual: g.valorAtual }),
  ...(g.mes !== undefined && { mes: g.mes }),
  ...(g.status !== undefined && { status: g.status }),
  ...(g.donoId !== undefined && { dono_id: g.donoId }),
});

// ------------------------------------------------------- metas financeiras

export const paraFinancialGoal = (l: Linha): FinancialGoal => ({
  id: l.id,
  nome: l.nome,
  descricao: l.descricao ?? '',
  valorAlvo: num(l.valor_alvo),
  valorAtual: num(l.valor_atual),
  categoria: l.categoria,
  prazo: l.prazo,
  prioridade: l.prioridade,
  metaMensal: num(l.meta_mensal),
  status: l.status,
  donoId: l.dono_id ?? undefined,
});

export const deFinancialGoal = (g: Partial<FinancialGoal>, householdId?: string): Linha => ({
  ...(g.id !== undefined && { id: g.id }),
  ...(householdId !== undefined && { household_id: householdId }),
  ...(g.nome !== undefined && { nome: g.nome }),
  ...(g.descricao !== undefined && { descricao: g.descricao }),
  ...(g.valorAlvo !== undefined && { valor_alvo: g.valorAlvo }),
  ...(g.valorAtual !== undefined && { valor_atual: g.valorAtual }),
  ...(g.categoria !== undefined && { categoria: g.categoria }),
  ...(g.prazo !== undefined && { prazo: g.prazo }),
  ...(g.prioridade !== undefined && { prioridade: g.prioridade }),
  ...(g.metaMensal !== undefined && { meta_mensal: g.metaMensal }),
  ...(g.status !== undefined && { status: g.status }),
  ...(g.donoId !== undefined && { dono_id: g.donoId }),
});

// ----------------------------------------------------------------- dívidas

export const paraDebt = (l: Linha): Debt => ({
  id: l.id,
  nome: l.nome,
  valorTotal: num(l.valor_total),
  valorPago: num(l.valor_pago),
  juros: num(l.juros),
  parcelas: l.parcelas,
  dono: l.dono,
  registradoPor: l.registrado_por ?? '',
  vencimento: l.vencimento,
});

export const deDebt = (d: Partial<Debt>, householdId?: string): Linha => ({
  ...(d.id !== undefined && { id: d.id }),
  ...(householdId !== undefined && { household_id: householdId }),
  ...(d.nome !== undefined && { nome: d.nome }),
  ...(d.valorTotal !== undefined && { valor_total: d.valorTotal }),
  ...(d.valorPago !== undefined && { valor_pago: d.valorPago }),
  ...(d.juros !== undefined && { juros: d.juros }),
  ...(d.parcelas !== undefined && { parcelas: d.parcelas }),
  ...(d.dono !== undefined && { dono: d.dono }),
  ...(d.registradoPor !== undefined && { registrado_por: d.registradoPor }),
  ...(d.vencimento !== undefined && { vencimento: d.vencimento }),
});

// --------------------------------------------------------------- orçamento

export const paraBudget = (l: Linha): CategoryBudget => ({
  categoria: l.categoria as ExpenseCategory,
  limite: num(l.limite),
  donoId: l.dono_id ?? undefined,
});

export const deBudget = (b: Partial<CategoryBudget>, householdId?: string): Linha => ({
  ...(householdId !== undefined && { household_id: householdId }),
  ...(b.categoria !== undefined && { categoria: b.categoria }),
  ...(b.limite !== undefined && { limite: b.limite }),
  ...(b.donoId !== undefined && { dono_id: b.donoId }),
});

// -------------------------------------------------------------- assinatura

export const paraSubscription = (l: Linha): Subscription => ({
  userId: l.user_id,
  plano: l.plano,
  status: l.status,
});
