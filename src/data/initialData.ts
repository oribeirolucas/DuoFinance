import { User, Expense, Income, MonthlyGoal, FinancialGoal, Debt, CategoryBudget, Partnership, Subscription, IncomeRecurrenceConfig } from '../types';
import { hashPassword } from '../utils/hash';

// Senha padrão de demonstração para usuários de exemplo: "Demo123"
const DEFAULT_DEMO_PASSWORD_HASH = hashPassword('Demo123');

export const mockIncomeRecurrenceConfigs: IncomeRecurrenceConfig[] = [
  {
    id: 'irc-lucas-salario',
    donoId: 'user-lucas',
    tipo: 'salario',
    ativo: true,
    diaRecebimento: 5
  },
  {
    id: 'irc-lucas-ferias',
    donoId: 'user-lucas',
    tipo: 'ferias',
    ativo: true,
    periodosFerias: [{ mes: 7 }]
  },
  {
    id: 'irc-lucas-13',
    donoId: 'user-lucas',
    tipo: 'decimo_terceiro',
    ativo: true,
    formaDecimoTerceiro: 'padrao'
  },
  {
    id: 'irc-marina-salario',
    donoId: 'user-marina',
    tipo: 'salario',
    ativo: true,
    diaRecebimento: 5
  },
  {
    id: 'irc-marina-ferias',
    donoId: 'user-marina',
    tipo: 'ferias',
    ativo: false,
    periodosFerias: []
  },
  {
    id: 'irc-marina-13',
    donoId: 'user-marina',
    tipo: 'decimo_terceiro',
    ativo: true,
    formaDecimoTerceiro: 'padrao'
  }
];

export const mockUsers: User[] = [
  {
    id: 'user-lucas',
    nome: 'Lucas Silva',
    email: 'lucas@duofinance.com.br',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    salario: 7500,
    corAvatar: '#6C63FF',
    senha: DEFAULT_DEMO_PASSWORD_HASH,
  },
  {
    id: 'user-marina',
    nome: 'Sibéli Santos',
    email: 'sibeli@duofinance.com.br',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    salario: 5000,
    corAvatar: '#FF6584',
    senha: DEFAULT_DEMO_PASSWORD_HASH,
  }
];

export const mockExpenses: Expense[] = [
  // Julho 2026
  {
    id: 'exp-1',
    descricao: 'Aluguel do Apê - Julho',
    valor: 2800,
    categoria: 'Moradia',
    pago: true,
    registradoPor: 'user-lucas',
    data: '2026-07-05',
    observacao: 'Condomínio e IPTU inclusos'
  },
  {
    id: 'exp-2',
    descricao: 'Supermercado Carrefour',
    valor: 1450.80,
    categoria: 'Alimentação',
    pago: true,
    registradoPor: 'user-marina',
    data: '2026-07-10',
    observacao: 'Compras do mês'
  },
  {
    id: 'exp-3',
    descricao: 'Fatura Cartão Nubank',
    valor: 1200.00,
    categoria: 'Cartões/Dívidas',
    pago: true,
    registradoPor: 'user-lucas',
    data: '2026-07-15'
  },
  {
    id: 'exp-4',
    descricao: 'Netflix + Spotify + HBO',
    valor: 119.90,
    categoria: 'Assinaturas/Serviços',
    pago: true,
    registradoPor: 'user-marina',
    data: '2026-07-02'
  },
  {
    id: 'exp-5',
    descricao: 'Consulta Pediatra Theo',
    valor: 350.00,
    categoria: 'Família',
    pago: true,
    registradoPor: 'user-marina',
    data: '2026-07-18'
  },
  {
    id: 'exp-6',
    descricao: 'Academia SmartFit (Casal)',
    valor: 239.80,
    categoria: 'Pessoal/Saúde',
    pago: true,
    registradoPor: 'user-lucas',
    data: '2026-07-01'
  },
  {
    id: 'exp-7',
    descricao: 'Jantar de Aniversário de Namoro',
    valor: 320.00,
    categoria: 'Outros',
    pago: true,
    registradoPor: 'user-lucas',
    data: '2026-07-20'
  },
  {
    id: 'exp-8',
    descricao: 'Conta de Luz & Água',
    valor: 380.50,
    categoria: 'Moradia',
    pago: false,
    registradoPor: 'user-marina',
    data: '2026-07-28'
  },
  {
    id: 'exp-9',
    descricao: 'Feira Orgânica do Bairro',
    valor: 180.00,
    categoria: 'Alimentação',
    pago: false,
    registradoPor: 'user-marina',
    data: '2026-07-29'
  },

  // Junho 2026
  {
    id: 'exp-jun-1',
    descricao: 'Aluguel do Apê - Junho',
    valor: 2800,
    categoria: 'Moradia',
    pago: true,
    registradoPor: 'user-lucas',
    data: '2026-06-05'
  },
  {
    id: 'exp-jun-2',
    descricao: 'Mercado Mensal',
    valor: 1620.00,
    categoria: 'Alimentação',
    pago: true,
    registradoPor: 'user-marina',
    data: '2026-06-12'
  },
  {
    id: 'exp-jun-3',
    descricao: 'Revisão do Carro',
    valor: 850.00,
    categoria: 'Outros',
    pago: true,
    registradoPor: 'user-lucas',
    data: '2026-06-18'
  },

  // Maio 2026
  {
    id: 'exp-mai-1',
    descricao: 'Aluguel Maio',
    valor: 2800,
    categoria: 'Moradia',
    pago: true,
    registradoPor: 'user-lucas',
    data: '2026-05-05'
  },
  {
    id: 'exp-mai-2',
    descricao: 'Supermercado Maio',
    valor: 1380.00,
    categoria: 'Alimentação',
    pago: true,
    registradoPor: 'user-marina',
    data: '2026-05-14'
  },

  // Abril 2026
  {
    id: 'exp-abr-1',
    descricao: 'Aluguel Abril',
    valor: 2800,
    categoria: 'Moradia',
    pago: true,
    registradoPor: 'user-lucas',
    data: '2026-04-05'
  },
  {
    id: 'exp-abr-2',
    descricao: 'Supermercado Abril',
    valor: 1510.00,
    categoria: 'Alimentação',
    pago: true,
    registradoPor: 'user-marina',
    data: '2026-04-10'
  },

  // Março 2026
  {
    id: 'exp-mar-1',
    descricao: 'Aluguel Março',
    valor: 2800,
    categoria: 'Moradia',
    pago: true,
    registradoPor: 'user-lucas',
    data: '2026-03-05'
  },
  {
    id: 'exp-mar-2',
    descricao: 'Supermercado Março',
    valor: 1420.00,
    categoria: 'Alimentação',
    pago: true,
    registradoPor: 'user-marina',
    data: '2026-03-12'
  },

  // Fevereiro 2026
  {
    id: 'exp-fev-1',
    descricao: 'Aluguel Fevereiro',
    valor: 2800,
    categoria: 'Moradia',
    pago: true,
    registradoPor: 'user-lucas',
    data: '2026-02-05'
  },
  {
    id: 'exp-fev-2',
    descricao: 'Supermercado Fevereiro',
    valor: 1390.00,
    categoria: 'Alimentação',
    pago: true,
    registradoPor: 'user-marina',
    data: '2026-02-11'
  }
];

export const mockIncomes: Income[] = [
  {
    id: 'inc-1',
    descricao: 'Salário TechCorp - Lucas',
    valor: 7500.00,
    fonte: 'CLT / Trabalho',
    registradoPor: 'user-lucas',
    data: '2026-07-01',
    observacao: 'Pagamento mensal fixo'
  },
  {
    id: 'inc-2',
    descricao: 'Salário Agência Design - Sibéli',
    valor: 5000.00,
    fonte: 'CLT / Trabalho',
    registradoPor: 'user-marina',
    data: '2026-07-01',
    observacao: 'Pagamento mensal fixo'
  },
  {
    id: 'inc-3',
    descricao: 'Freelance Identity Design',
    valor: 1800.00,
    fonte: 'Freelance',
    registradoPor: 'user-marina',
    data: '2026-07-12',
    observacao: 'Projeto de branding para cliente externo'
  },
  {
    id: 'inc-4',
    descricao: 'Rendimento Investimentos',
    valor: 420.50,
    fonte: 'Investimentos',
    registradoPor: 'user-lucas',
    data: '2026-07-15'
  }
];

export const mockMonthlyGoals: MonthlyGoal[] = [
  {
    id: 'mgoal-1',
    nome: 'Aporte Reserva de Emergência',
    descricao: 'Guardar pelo menos 15% da renda mensal conjunta',
    valorAlvo: 2000,
    valorAtual: 1650,
    mes: 'Julho/2026',
    status: 'em_andamento',
    donoId: 'user-lucas'
  },
  {
    id: 'mgoal-2',
    nome: 'Fundo da Viagem de Fim de Ano',
    descricao: 'Poupança direcionada para passagens de Natal',
    valorAlvo: 1000,
    valorAtual: 1000,
    mes: 'Julho/2026',
    status: 'concluida',
    donoId: 'user-lucas'
  },
  {
    id: 'mgoal-3',
    nome: 'Redução de Gastos com Delivery',
    descricao: 'Economizar no iFood limitando a 3 pedidos no mês',
    valorAlvo: 400,
    valorAtual: 280,
    mes: 'Julho/2026',
    status: 'em_andamento',
    donoId: 'user-lucas'
  }
];

export const mockFinancialGoals: FinancialGoal[] = [
  {
    id: 'fgoal-1',
    nome: 'Entrada da Casa Própria',
    descricao: 'Apartamento de 3 quartos na zona sul com varanda gourmet',
    valorAlvo: 120000,
    valorAtual: 68500,
    categoria: 'casa',
    prazo: '2027-12-31',
    prioridade: 'alta',
    metaMensal: 3000,
    status: 'em_andamento',
    donoId: 'user-lucas'
  },
  {
    id: 'fgoal-2',
    nome: 'Viagem dos Sonhos pela Itália',
    descricao: '15 dias conhecendo Roma, Florença, Veneza e Costa Amalfitana',
    valorAlvo: 25000,
    valorAtual: 18200,
    categoria: 'viagem',
    prazo: '2027-05-15',
    prioridade: 'alta',
    metaMensal: 1200,
    status: 'em_andamento',
    donoId: 'user-lucas'
  },
  {
    id: 'fgoal-3',
    nome: 'Troca do Carro por SUV Híbrido',
    descricao: 'Veículo mais espaçoso e econômico para viagens em família',
    valorAlvo: 60000,
    valorAtual: 22000,
    categoria: 'carro',
    prazo: '2028-06-30',
    prioridade: 'media',
    metaMensal: 1500,
    status: 'em_andamento',
    donoId: 'user-lucas'
  },
  {
    id: 'fgoal-4',
    nome: 'Aposentadoria & Independência',
    descricao: 'Carteira de investimentos focada em dividendos de longo prazo',
    valorAlvo: 500000,
    valorAtual: 115000,
    categoria: 'aposentadoria',
    prazo: '2040-12-31',
    prioridade: 'media',
    metaMensal: 2500,
    status: 'em_andamento',
    donoId: 'user-lucas'
  }
];

export const mockDebts: Debt[] = [
  {
    id: 'debt-1',
    nome: 'Financiamento do Veículo HB20',
    valorTotal: 42000,
    valorPago: 28000,
    juros: 12.5,
    parcelas: '32/48',
    dono: 'casal',
    registradoPor: 'user-lucas',
    vencimento: '2026-08-10'
  },
  {
    id: 'debt-2',
    nome: 'Parcelado Notebook Trabalhos Sibéli',
    valorTotal: 6500,
    valorPago: 4800,
    juros: 0,
    parcelas: '8/10',
    dono: 'individual',
    registradoPor: 'user-marina',
    vencimento: '2026-08-15'
  },
  {
    id: 'debt-3',
    nome: 'Empréstimo Reforma da Cozinha',
    valorTotal: 15000,
    valorPago: 9000,
    juros: 14.2,
    parcelas: '12/20',
    dono: 'casal',
    registradoPor: 'user-lucas',
    vencimento: '2026-08-05'
  }
];

export const mockBudgets: CategoryBudget[] = [
  { categoria: 'Moradia', limite: 3500, donoId: 'user-lucas' },
  { categoria: 'Alimentação', limite: 2000, donoId: 'user-lucas' },
  { categoria: 'Cartões/Dívidas', limite: 1500, donoId: 'user-lucas' },
  { categoria: 'Assinaturas/Serviços', limite: 300, donoId: 'user-lucas' },
  { categoria: 'Família', limite: 800, donoId: 'user-lucas' },
  { categoria: 'Pessoal/Saúde', limite: 600, donoId: 'user-lucas' },
  { categoria: 'Outros', limite: 800, donoId: 'user-lucas' }
];

export const mockPartnership: Partnership = {
  id: 'part-123',
  user1Id: 'user-lucas',
  user2Id: 'user-marina',
  status: 'active',
  inviteToken: 'DUO-7892-LOVE',
  partnerName: 'Sibéli Santos',
  partnerEmail: 'sibeli@duofinance.com.br'
};

export const mockSubscription: Subscription = {
  userId: 'user-lucas',
  plano: 'duo',
  status: 'active'
};
