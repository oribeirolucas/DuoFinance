export type ExpenseCategory = 
  | 'Moradia'
  | 'Família'
  | 'Assinaturas/Serviços'
  | 'Cartões/Dívidas'
  | 'Pessoal/Saúde'
  | 'Alimentação'
  | 'Outros';

export interface User {
  id: string;
  nome: string;
  email: string;
  avatar: string;
  salario: number;
  corAvatar: string;
  // Sem campo de senha, por princípio: a senha vive em auth.users, hasheada
  // com bcrypt pelo servidor, e nunca chega ao cliente em forma alguma.
}

export interface Expense {
  id: string;
  descricao: string;
  valor: number;
  categoria: ExpenseCategory;
  pago: boolean;
  registradoPor: string; // userId
  data: string; // YYYY-MM-DD
  observacao?: string;
}

export interface Income {
  id: string;
  descricao: string;
  valor: number;
  fonte: string;
  registradoPor: string; // userId
  data: string; // YYYY-MM-DD
  observacao?: string;
  tipo?: 'salario' | 'ferias' | 'decimo_terceiro' | 'renda_extra';
}

export interface IncomeRecurrenceConfig {
  id: string;
  donoId: string; // userId dono da configuração
  tipo: 'salario' | 'ferias' | 'decimo_terceiro';
  ativo: boolean;
  // Para tipo 'salario':
  diaRecebimento?: number; // dia do mês, 1-31
  // Para tipo 'ferias':
  periodosFerias?: { mes: number }[]; // até 3 objetos, mes de 1 a 12
  // Para tipo 'decimo_terceiro':
  formaDecimoTerceiro?: 'padrao' | 'antecipado_ferias'; // padrao = parcelas em nov e dez; antecipado_ferias = 1a parcela no mês do primeiro período de férias configurado, 2a parcela em dezembro
}

export interface MonthlyGoal {
  id: string;
  nome: string;
  descricao: string;
  valorAlvo: number;
  valorAtual: number;
  mes: string; // e.g. "Julho/2026"
  status: 'em_andamento' | 'concluida';
  donoId?: string;
}

export interface FinancialGoal {
  id: string;
  nome: string;
  descricao: string;
  valorAlvo: number;
  valorAtual: number;
  categoria: 'casa' | 'carro' | 'viagem' | 'aposentadoria' | 'outros';
  prazo: string; // YYYY-MM-DD or YYYY-MM
  prioridade: 'alta' | 'media' | 'baixa';
  metaMensal: number;
  status: 'em_andamento' | 'concluida';
  donoId?: string;
}

export interface Debt {
  id: string;
  nome: string;
  valorTotal: number;
  valorPago: number;
  juros: number; // percentage % ao ano ou ao mês
  parcelas: string; // e.g. "12/24"
  dono: 'individual' | 'casal';
  registradoPor: string; // userId
  vencimento: string; // YYYY-MM-DD
}

export interface CategoryBudget {
  categoria: ExpenseCategory;
  limite: number;
  donoId?: string;
}

export interface Partnership {
  id: string;
  user1Id: string;
  user2Id?: string;
  status: 'none' | 'pending' | 'active';
  inviteToken: string;
  partnerName?: string;
  partnerEmail?: string;
}

export interface Subscription {
  userId: string;
  plano: 'free' | 'duo';
  status: 'active' | 'cancelled';
}

export type DivisionRule = 'equal' | 'proportional';

export type NavigationTab = 
  | 'dashboard'
  | 'comparacao'
  | 'despesas'
  | 'receitas'
  | 'orcamento'
  | 'dividas'
  | 'metas'
  | 'metas-financeiras'
  | 'planilha'
  | 'parceiro';

export type AuthScreen = 'login' | 'cadastro' | 'esqueci-senha';
