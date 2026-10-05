import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  Expense,
  Income,
  MonthlyGoal,
  FinancialGoal,
  Debt,
  CategoryBudget,
  Partnership,
  Subscription,
  DivisionRule,
  NavigationTab,
  AuthScreen,
  ExpenseCategory,
  IncomeRecurrenceConfig
} from '../types';
import {
  mockUsers,
  mockExpenses,
  mockIncomes,
  mockMonthlyGoals,
  mockFinancialGoals,
  mockDebts,
  mockBudgets,
  mockPartnership,
  mockSubscription,
  mockIncomeRecurrenceConfigs
} from '../data/initialData';
import { avatarDeIniciais } from '../utils/avatar';
import { supabase, supabaseConfigurado } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface AppContextType {
  // Auth & Navigation
  isAuthenticated: boolean;
  /** true até a sessão existente ser resolvida; evita piscar a tela de login. */
  authLoading: boolean;
  authScreen: AuthScreen;
  setAuthScreen: (screen: AuthScreen) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (nome: string, email: string, salario?: number, password?: string) => Promise<boolean>;
  signup: (nome: string, email: string, salario?: number, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  recuperarSenha: (email: string) => Promise<boolean>;

  // Users & Active Partner Context
  currentUser: User;
  partner: User | null;
  users: User[];
  getHouseholdUserIds: () => string[];

  // Active View Tab
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;

  // Theme State
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Data Collections
  expenses: Expense[];
  incomes: Income[];
  incomeRecurrenceConfigs: IncomeRecurrenceConfig[];
  monthlyGoals: MonthlyGoal[];
  financialGoals: FinancialGoal[];
  debts: Debt[];
  budgets: CategoryBudget[];
  partnership: Partnership;
  subscription: Subscription;
  divisionRule: DivisionRule;
  setDivisionRule: (rule: DivisionRule) => void;

  // CRUD Operations
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  toggleExpensePaid: (id: string) => void;

  addIncome: (income: Omit<Income, 'id'>) => void;
  updateIncome: (id: string, income: Partial<Income>) => void;
  deleteIncome: (id: string) => void;
  updateUserSalario: (novoValor: number, userId?: string) => void;
  getIncomeRecurrenceConfig: (userId?: string) => IncomeRecurrenceConfig[];
  saveIncomeRecurrenceConfig: (config: IncomeRecurrenceConfig) => void;
  syncRecurrentIncomesForUser: (userId: string, year?: number, overrideSalary?: number) => void;

  addMonthlyGoal: (goal: Omit<MonthlyGoal, 'id' | 'valorAtual' | 'status'>) => void;
  updateMonthlyGoal: (id: string, goal: Partial<MonthlyGoal>) => void;
  deleteMonthlyGoal: (id: string) => void;
  addGoalContribution: (goalId: string, amount: number) => void;

  addFinancialGoal: (goal: Omit<FinancialGoal, 'id' | 'valorAtual' | 'status'>) => void;
  updateFinancialGoal: (id: string, goal: Partial<FinancialGoal>) => void;
  deleteFinancialGoal: (id: string) => void;
  addFinancialGoalContribution: (goalId: string, amount: number) => void;

  addDebt: (debt: Omit<Debt, 'id'>) => void;
  updateDebt: (id: string, debt: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  payDebtInstallment: (id: string, amount: number) => void;

  updateBudget: (categoria: ExpenseCategory, limite: number) => void;

  // Partnership & Subscription Actions
  updatePartnershipStatus: (status: 'none' | 'pending' | 'active', partnerEmail?: string) => void;
  sendInvite: (email: string) => string; // returns token
  acceptInvite: (token: string) => boolean;
  endPartnership: () => void;
  setSubscriptionPlan: (plano: 'free' | 'duo') => void;

  // Helpers & Toast
  toasts: ToastState[];
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  resetToDefaultData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'duo_finance_v1_data';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // A sessão é a fonte da verdade da autenticação. Ela vem do Supabase, que
  // valida o JWT no servidor — o localStorage deixa de decidir quem está
  // logado, e o campo `_is_authenticated` some junto.
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');

  const isAuthenticated = session !== null;
  const currentUserId = session?.user.id ?? '';

  useEffect(() => {
    if (!supabaseConfigurado) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSession(novaSessao);
      setAuthLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  // Theme State
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('duo_finance_theme');
    return savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'light';
  });

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem('duo_finance_theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  // Core Data
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_users`);
    return saved ? JSON.parse(saved) : mockUsers;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_expenses`);
    return saved ? JSON.parse(saved) : mockExpenses;
  });

  const [incomes, setIncomes] = useState<Income[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_incomes`);
    return saved ? JSON.parse(saved) : mockIncomes;
  });

  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_mgoals`);
    return saved ? JSON.parse(saved) : mockMonthlyGoals;
  });

  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_fgoals`);
    return saved ? JSON.parse(saved) : mockFinancialGoals;
  });

  const [debts, setDebts] = useState<Debt[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_debts`);
    return saved ? JSON.parse(saved) : mockDebts;
  });

  const [budgets, setBudgets] = useState<CategoryBudget[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_budgets`);
    return saved ? JSON.parse(saved) : mockBudgets;
  });

  const [partnership, setPartnership] = useState<Partnership>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_partnership`);
    return saved ? JSON.parse(saved) : mockPartnership;
  });

  const [subscription, setSubscription] = useState<Subscription>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_subscription`);
    return saved ? JSON.parse(saved) : mockSubscription;
  });

  const [incomeRecurrenceConfigs, setIncomeRecurrenceConfigs] = useState<IncomeRecurrenceConfig[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_income_recurrence_configs`);
    return saved ? JSON.parse(saved) : mockIncomeRecurrenceConfigs;
  });

  const [divisionRule, setDivisionRule] = useState<DivisionRule>('proportional');
  const [toasts, setToasts] = useState<ToastState[]>([]);

  // Persist to localStorage
  // A sessão NÃO entra aqui: quem a guarda é o cliente Supabase, sob chave
  // própria, como token de curta duração. Os dados abaixo saem na fase
  // seguinte, quando a leitura passar a vir do Postgres.
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_users`, JSON.stringify(users));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_expenses`, JSON.stringify(expenses));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_incomes`, JSON.stringify(incomes));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_mgoals`, JSON.stringify(monthlyGoals));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_fgoals`, JSON.stringify(financialGoals));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_debts`, JSON.stringify(debts));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_budgets`, JSON.stringify(budgets));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_partnership`, JSON.stringify(partnership));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_subscription`, JSON.stringify(subscription));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_income_recurrence_configs`, JSON.stringify(incomeRecurrenceConfigs));
  }, [users, expenses, incomes, monthlyGoals, financialGoals, debts, budgets, partnership, subscription, incomeRecurrenceConfigs]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const emptyUser: User = {
    id: '',
    nome: '',
    email: '',
    avatar: '',
    salario: 0,
    corAvatar: '#6C63FF'
  };

  // Perfis do household, vindos do Postgres. O RLS garante que esta consulta
  // só devolve quem divide o household — não há como pedir "todos os usuários".
  const [perfis, setPerfis] = useState<User[]>([]);

  useEffect(() => {
    if (!session) {
      setPerfis([]);
      return;
    }

    let cancelado = false;
    supabase
      .from('profiles')
      .select('id, nome, email, avatar, salario, cor_avatar')
      .then(({ data, error }) => {
        if (cancelado) return;
        if (error || !data) {
          showToast('Não foi possível carregar o perfil.', 'error');
          return;
        }
        setPerfis(data.map(linha => ({
          id: linha.id,
          nome: linha.nome,
          email: linha.email ?? '',
          avatar: linha.avatar || avatarDeIniciais(linha.nome, linha.cor_avatar),
          salario: Number(linha.salario) || 0,
          corAvatar: linha.cor_avatar
        })));
      });

    return () => { cancelado = true; };
  }, [session?.user.id]);

  // Entre o login e a chegada do perfil há alguns quadros em que só se conhece
  // o e-mail. O avatar precisa ser preenchido mesmo aí: src="" faz o navegador
  // rebaixar o documento inteiro.
  const currentUser: User =
    perfis.find(u => u.id === currentUserId)
    ?? (isAuthenticated
      ? (() => {
          const email = session?.user.email ?? '';
          const nome = email.split('@')[0] || 'Você';
          return {
            ...emptyUser,
            id: currentUserId,
            nome,
            email,
            avatar: avatarDeIniciais(nome, emptyUser.corAvatar)
          };
        })()
      : emptyUser);

  const partner: User | null = (() => {
    if (!isAuthenticated) return null;
    if (partnership.status !== 'active') return null;

    if (currentUser.id === partnership.user1Id && partnership.user2Id) {
      return users.find(u => u.id === partnership.user2Id) || null;
    }
    if (currentUser.id === partnership.user2Id && partnership.user1Id) {
      return users.find(u => u.id === partnership.user1Id) || null;
    }

    return null;
  })();

  // setCurrentUserId foi removido. Ele assumia a identidade de outra pessoa e
  // carimbava o id dela em tudo que fosse criado depois. Com RLS no banco a
  // troca não teria efeito nenhum sobre o que é visível, então manter o botão
  // seria mentira de interface.

  const updateUserSalario = (novoValor: number, userId?: string) => {
    const targetId = userId || currentUser.id;
    if (!targetId) return;

    setUsers(prevUsers =>
      prevUsers.map(u => (u.id === targetId ? { ...u, salario: novoValor } : u))
    );
  };

  const getHouseholdUserIds = (): string[] => {
    if (!currentUser || !currentUser.id) return [];
    if (partner && partner.id) {
      return [currentUser.id, partner.id];
    }
    return [currentUser.id];
  };

  const householdUserIds = getHouseholdUserIds();

  const filteredExpenses = expenses.filter(e => {
    const id = e.registradoPor || currentUser?.id || '';
    return householdUserIds.includes(id);
  });

  const filteredIncomes = incomes.filter(i => {
    const id = i.registradoPor || currentUser?.id || '';
    return householdUserIds.includes(id);
  });

  const filteredMonthlyGoals = monthlyGoals.filter(m => {
    const id = m.donoId || currentUser?.id || '';
    return householdUserIds.includes(id);
  });

  const filteredFinancialGoals = financialGoals.filter(f => {
    const id = f.donoId || currentUser?.id || '';
    return householdUserIds.includes(id);
  });

  const filteredDebts = debts.filter(d => {
    const id = d.registradoPor || currentUser?.id || '';
    return householdUserIds.includes(id);
  });

  const filteredBudgets = budgets.filter(b => {
    const id = b.donoId || currentUser?.id || '';
    return householdUserIds.includes(id);
  });

  // A verificação de senha acontece no servidor, contra o hash bcrypt guardado
  // em auth.users. O cliente nunca vê hash nenhum, e mensagem de erro não
  // distingue "e-mail não existe" de "senha errada" — isso evita confirmar
  // para um estranho quais e-mails têm conta.
  const login = async (email: string, password: string): Promise<boolean> => {
    if (!supabaseConfigurado) {
      showToast('Aplicação sem backend configurado.', 'error');
      return false;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });

    if (error) {
      showToast('E-mail ou senha incorretos', 'error');
      return false;
    }

    showToast('Bem-vindo(a) de volta! 💜', 'success');
    return true;
  };

  // E-mail já cadastrado passa a ser erro do servidor. Antes, o cadastro
  // sobrescrevia o usuário existente e iniciava a sessão como ele — tomada de
  // conta sem sequer pedir a senha.
  const signup = async (
    nome: string,
    email: string,
    salario: number = 6500,
    password?: string
  ): Promise<boolean> => {
    if (!supabaseConfigurado) {
      showToast('Aplicação sem backend configurado.', 'error');
      return false;
    }
    if (!password) {
      showToast('Informe uma senha para criar a conta.', 'error');
      return false;
    }

    const avatarList = [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80'
    ];

    // Estes dados vão para raw_user_meta_data e são lidos pelo trigger
    // handle_new_user, que cria household, perfil e associação numa transação.
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          nome: nome.trim() || 'Novo Usuário',
          salario: String(Number(salario) || 0),
          cor_avatar: '#8B5CF6',
          avatar: avatarList[Math.floor(Math.random() * avatarList.length)]
        }
      }
    });

    if (error) {
      showToast(error.message || 'Não foi possível concluir o cadastro.', 'error');
      return false;
    }

    // Com proteção contra enumeração ligada, cadastrar e-mail já existente
    // "funciona" mas devolve identities vazio. Não é conta nova.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      showToast('Se esse e-mail ainda não tiver conta, enviaremos a confirmação.', 'info');
      return false;
    }

    // Sem sessão imediata significa que o projeto exige confirmação por e-mail.
    if (!data.session) {
      showToast('Conta criada! Confirme o e-mail para entrar.', 'info');
      return true;
    }

    showToast('Conta criada com sucesso! 🚀', 'success');
    return true;
  };

  const register = signup;

  const logout = async () => {
    await supabase.auth.signOut();
    setAuthScreen('login');
    showToast('Sessão encerrada com sucesso.', 'info');
  };

  // Antes isto só exibia "E-mail enviado!" sem fazer nada.
  const recuperarSenha = async (email: string): Promise<boolean> => {
    if (!supabaseConfigurado) {
      showToast('Aplicação sem backend configurado.', 'error');
      return false;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/` }
    );

    if (error) {
      showToast('Não foi possível enviar o e-mail de redefinição.', 'error');
      return false;
    }
    return true;
  };

  // CRUD EXPENSES
  const addExpense = (newExp: Omit<Expense, 'id'>) => {
    const created: Expense = {
      registradoPor: currentUser.id,
      ...newExp,
      id: `exp-${Date.now()}`
    };
    setExpenses(prev => [created, ...prev]);
    showToast('Despesa registrada com sucesso!');
  };

  const updateExpense = (id: string, data: Partial<Expense>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    showToast('Despesa atualizada!');
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    showToast('Despesa removida', 'info');
  };

  const toggleExpensePaid = (id: string) => {
    setExpenses(prev => prev.map(e => {
      if (e.id === id) {
        const nextPaid = !e.pago;
        showToast(nextPaid ? 'Despesa marcada como Paga! ✓' : 'Despesa marcada como Pendente', 'info');
        return { ...e, pago: nextPaid };
      }
      return e;
    }));
  };

  // CRUD INCOMES
  const addIncome = (newInc: Omit<Income, 'id'>) => {
    const created: Income = {
      registradoPor: currentUser.id,
      ...newInc,
      id: `inc-${Date.now()}`
    };
    setIncomes(prev => [created, ...prev]);
    showToast('Receita adicionada com sucesso! 💰');
  };

  const updateIncome = (id: string, data: Partial<Income>) => {
    setIncomes(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
    showToast('Receita atualizada!');
  };

  const deleteIncome = (id: string) => {
    setIncomes(prev => prev.filter(i => i.id !== id));
    showToast('Receita removida', 'info');
  };

  // INCOME RECURRENCE CONFIGS
  const getIncomeRecurrenceConfig = (userId?: string): IncomeRecurrenceConfig[] => {
    const targetId = userId || currentUser.id;
    return incomeRecurrenceConfigs.filter(c => c.donoId === targetId);
  };

  const saveIncomeRecurrenceConfig = (config: IncomeRecurrenceConfig) => {
    setIncomeRecurrenceConfigs(prev => {
      const index = prev.findIndex(c => c.donoId === config.donoId && c.tipo === config.tipo);
      if (index >= 0) {
        const next = [...prev];
        next[index] = config;
        return next;
      }
      return [...prev, config];
    });
    showToast('Configuração de recorrência salva!', 'success');
  };

  const syncRecurrentIncomesForUser = (userId: string, year?: number, overrideSalary?: number) => {
    const targetYear = year || new Date().getFullYear();
    const userToSync = users.find(u => u.id === userId);
    if (!userToSync) return;

    const userSalary = overrideSalary !== undefined ? overrideSalary : (userToSync.salario || 0);
    const userConfigs = incomeRecurrenceConfigs.filter(c => c.donoId === userId && c.ativo);
    
    const vacationConfig = userConfigs.find(c => c.tipo === 'ferias');

    const generatedIncomes: Omit<Income, 'id'>[] = [];

    userConfigs.forEach(config => {
      if (config.tipo === 'salario') {
        const day = Math.min(Math.max(config.diaRecebimento || 5, 1), 28);
        const dayStr = String(day).padStart(2, '0');
        for (let m = 1; m <= 12; m++) {
          const monthStr = String(m).padStart(2, '0');
          generatedIncomes.push({
            descricao: `Salário Mensal - ${userToSync.nome.split(' ')[0]}`,
            valor: userSalary,
            fonte: 'CLT / Trabalho',
            tipo: 'salario',
            registradoPor: userId,
            data: `${targetYear}-${monthStr}-${dayStr}`,
            observacao: 'Gerado por recorrência automática'
          });
        }
      } else if (config.tipo === 'ferias') {
        const periodos = config.periodosFerias || [];
        if (periodos.length > 0) {
          const numPeriodos = periodos.length;
          const valorFerias = Math.round(((userSalary * (4 / 3)) / numPeriodos) * 100) / 100;
          periodos.forEach((p, idx) => {
            const monthStr = String(p.mes).padStart(2, '0');
            generatedIncomes.push({
              descricao: `Adicional Férias (${idx + 1}/${numPeriodos}) - ${userToSync.nome.split(' ')[0]}`,
              valor: valorFerias,
              fonte: 'CLT / Trabalho',
              tipo: 'ferias',
              registradoPor: userId,
              data: `${targetYear}-${monthStr}-10`,
              observacao: 'Inclusão de férias com 1/3 constitucional'
            });
          });
        }
      } else if (config.tipo === 'decimo_terceiro') {
        const parcela1Valor = Math.round((userSalary / 2) * 100) / 100;
        const parcela2Valor = Math.round((userSalary / 2) * 100) / 100;

        let mes1aParcela = 11;
        if (config.formaDecimoTerceiro === 'antecipado_ferias' && vacationConfig?.periodosFerias?.[0]?.mes) {
          mes1aParcela = vacationConfig.periodosFerias[0].mes;
        }

        generatedIncomes.push({
          descricao: `13º Salário (1ª Parcela) - ${userToSync.nome.split(' ')[0]}`,
          valor: parcela1Valor,
          fonte: 'CLT / Trabalho',
          tipo: 'decimo_terceiro',
          registradoPor: userId,
          data: `${targetYear}-${String(mes1aParcela).padStart(2, '0')}-30`,
          observacao: config.formaDecimoTerceiro === 'antecipado_ferias' ? '1ª Parcela do 13º antecipada nas férias' : '1ª Parcela do 13º Salário'
        });

        generatedIncomes.push({
          descricao: `13º Salário (2ª Parcela) - ${userToSync.nome.split(' ')[0]}`,
          valor: parcela2Valor,
          fonte: 'CLT / Trabalho',
          tipo: 'decimo_terceiro',
          registradoPor: userId,
          data: `${targetYear}-12-20`,
          observacao: '2ª Parcela do 13º Salário'
        });
      }
    });

    setIncomes(prev => {
      const yearPrefix = `${targetYear}-`;
      const nonRecurrentOrOtherUser = prev.filter(i => {
        if (i.registradoPor !== userId) return true;
        if (!i.data.startsWith(yearPrefix)) return true;
        return i.tipo === 'renda_extra' || !i.tipo;
      });

      const newIncomesList: Income[] = generatedIncomes.map((inc, idx) => ({
        ...inc,
        id: `inc-rec-${userId}-${targetYear}-${inc.tipo}-${idx}-${Date.now()}`
      }));

      return [...newIncomesList, ...nonRecurrentOrOtherUser];
    });

    showToast(`Receitas recorrentes sincronizadas para ${userToSync.nome}! 💰`, 'success');
  };

  // MONTHLY GOALS
  const addMonthlyGoal = (goal: Omit<MonthlyGoal, 'id' | 'valorAtual' | 'status'>) => {
    const created: MonthlyGoal = {
      donoId: currentUser.id,
      ...goal,
      id: `mgoal-${Date.now()}`,
      valorAtual: 0,
      status: 'em_andamento'
    };
    setMonthlyGoals(prev => [created, ...prev]);
    showToast('Nova meta de economia criada! 🎯');
  };

  const updateMonthlyGoal = (id: string, data: Partial<MonthlyGoal>) => {
    setMonthlyGoals(prev => prev.map(g => g.id === id ? { ...g, ...data } : g));
    showToast('Meta atualizada!');
  };

  const deleteMonthlyGoal = (id: string) => {
    setMonthlyGoals(prev => prev.filter(g => g.id !== id));
    showToast('Meta excluída', 'info');
  };

  const addGoalContribution = (goalId: string, amount: number) => {
    setMonthlyGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        const nextVal = g.valorAtual + amount;
        const isDone = nextVal >= g.valorAlvo;
        if (isDone) {
          showToast(`Parabéns! Meta "${g.nome}" concluída com sucesso! 🎉`, 'success');
        } else {
          showToast(`Aporte de R$ ${amount.toFixed(2)} adicionado à meta!`, 'success');
        }
        return {
          ...g,
          valorAtual: nextVal,
          status: isDone ? 'concluida' : 'em_andamento'
        };
      }
      return g;
    }));
  };

  // FINANCIAL GOALS (LONG TERM)
  const addFinancialGoal = (goal: Omit<FinancialGoal, 'id' | 'valorAtual' | 'status'>) => {
    const created: FinancialGoal = {
      donoId: currentUser.id,
      ...goal,
      id: `fgoal-${Date.now()}`,
      valorAtual: 0,
      status: 'em_andamento'
    };
    setFinancialGoals(prev => [created, ...prev]);
    showToast('Sonho adicionado! Que the planejamento comece 🚀');
  };

  const updateFinancialGoal = (id: string, data: Partial<FinancialGoal>) => {
    setFinancialGoals(prev => prev.map(f => f.id === id ? { ...f, ...data } : f));
    showToast('Meta de longo prazo atualizada!');
  };

  const deleteFinancialGoal = (id: string) => {
    setFinancialGoals(prev => prev.filter(f => f.id !== id));
    showToast('Objetivo removido', 'info');
  };

  const addFinancialGoalContribution = (goalId: string, amount: number) => {
    setFinancialGoals(prev => prev.map(f => {
      if (f.id === goalId) {
        const nextVal = f.valorAtual + amount;
        const isDone = nextVal >= f.valorAlvo;
        if (isDone) {
          showToast(`Incrível! Vocês atingiram o objetivo "${f.nome}"! 🥂💜`, 'success');
        } else {
          showToast(`R$ ${amount.toFixed(2)} depositados para "${f.nome}"!`, 'success');
        }
        return {
          ...f,
          valorAtual: nextVal,
          status: isDone ? 'concluida' : 'em_andamento'
        };
      }
      return f;
    }));
  };

  // DEBTS
  const addDebt = (debt: Omit<Debt, 'id'>) => {
    const created: Debt = {
      registradoPor: currentUser.id,
      ...debt,
      id: `debt-${Date.now()}`
    };
    setDebts(prev => [created, ...prev]);
    showToast('Dívida cadastrada com sucesso!');
  };

  const updateDebt = (id: string, data: Partial<Debt>) => {
    setDebts(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
    showToast('Dívida atualizada!');
  };

  const deleteDebt = (id: string) => {
    setDebts(prev => prev.filter(d => d.id !== id));
    showToast('Dívida removida', 'info');
  };

  const payDebtInstallment = (id: string, amount: number) => {
    setDebts(prev => prev.map(d => {
      if (d.id === id) {
        const nextPaid = Math.min(d.valorTotal, d.valorPago + amount);
        const fullyPaid = nextPaid >= d.valorTotal;
        if (fullyPaid) {
          showToast(`Uhuuul! Dívida "${d.nome}" quitada integralmente! 🥳`, 'success');
        } else {
          showToast(`Pagamento de R$ ${amount.toFixed(2)} registrado!`, 'success');
        }
        return {
          ...d,
          valorPago: nextPaid
        };
      }
      return d;
    }));
  };

  // BUDGET
  const updateBudget = (categoria: ExpenseCategory, limite: number) => {
    setBudgets(prev => {
      const activeOwnerId = currentUser.id;
      const householdIds = getHouseholdUserIds();
      const exists = prev.some(b => b.categoria === categoria && (!b.donoId || householdIds.includes(b.donoId)));
      if (exists) {
        return prev.map(b => (b.categoria === categoria && (!b.donoId || householdIds.includes(b.donoId))) ? { ...b, limite, donoId: b.donoId || activeOwnerId } : b);
      }
      return [...prev, { categoria, limite, donoId: activeOwnerId }];
    });
    showToast(`Orçamento de ${categoria} atualizado para R$ ${limite.toFixed(2)}`);
  };

  // PARTNERSHIP & SUBSCRIPTION
  const updatePartnershipStatus = (status: 'none' | 'pending' | 'active', partnerEmail?: string) => {
    setPartnership(prev => {
      const emailToFind = partnerEmail || prev.partnerEmail;
      const partnerUser = emailToFind ? users.find(u => u.email.toLowerCase() === emailToFind.toLowerCase()) : null;
      return {
        ...prev,
        status,
        partnerEmail: emailToFind,
        partnerName: partnerUser ? partnerUser.nome : (status === 'active' ? prev.partnerName : undefined)
      };
    });
    if (status === 'active') {
      showToast('Vocês agora compartilham o planejamento financeiro juntos! 💜');
    } else if (status === 'pending') {
      showToast('Convite enviado para o parceiro! Aguardando aceite.', 'info');
    } else {
      showToast('Parceria encerrada.', 'info');
    }
  };

  const sendInvite = (email: string) => {
    const token = `DUO-${Math.floor(1000 + Math.random() * 9000)}-LOVE`;
    setPartnership({
      id: `part-${Date.now()}`,
      user1Id: currentUser.id,
      status: 'pending',
      inviteToken: token,
      partnerEmail: email
    });
    showToast(`Convite gerado para ${email}! Código: ${token}`, 'info');
    return token;
  };

  const acceptInvite = (token: string) => {
    if (token.trim().length >= 4) {
      const inviterId = (partnership.user1Id && partnership.user1Id !== currentUser.id)
        ? partnership.user1Id
        : (partnership.partnerEmail ? users.find(u => u.email.toLowerCase() === partnership.partnerEmail?.toLowerCase())?.id : undefined)
        || partnership.user1Id
        || users.find(u => u.id !== currentUser.id)?.id
        || currentUser.id;

      const inviterUser = users.find(u => u.id === inviterId);

      setPartnership(prev => ({
        id: prev.id || `part-${Date.now()}`,
        user1Id: inviterId,
        user2Id: currentUser.id,
        status: 'active',
        inviteToken: token,
        partnerName: inviterUser?.nome || prev.partnerName,
        partnerEmail: inviterUser?.email || prev.partnerEmail || partnership.partnerEmail
      }));
      setSubscription({
        userId: currentUser.id,
        plano: 'duo',
        status: 'active'
      });
      showToast('Convite aceito! Parceria Ativa iniciada com sucesso! 💜', 'success');
      return true;
    } else {
      showToast('Código de convite inválido', 'error');
      return false;
    }
  };

  const endPartnership = () => {
    setPartnership({
      id: `part-${Date.now()}`,
      user1Id: currentUser.id,
      status: 'none',
      inviteToken: ''
    });
    showToast('Parceria encerrada com sucesso.', 'info');
  };

  const setSubscriptionPlan = (plano: 'free' | 'duo') => {
    setSubscription({
      userId: currentUser.id,
      plano,
      status: 'active'
    });
    if (plano === 'free') {
      setPartnership(prev => ({ ...prev, status: 'none' }));
    }
    showToast(`Plano alterado para ${plano.toUpperCase()}!`, 'info');
  };

  const resetToDefaultData = () => {
    setExpenses(mockExpenses);
    setIncomes(mockIncomes);
    setMonthlyGoals(mockMonthlyGoals);
    setFinancialGoals(mockFinancialGoals);
    setDebts(mockDebts);
    setBudgets(mockBudgets);
    setPartnership(mockPartnership);
    setSubscription(mockSubscription);
    setIncomeRecurrenceConfigs(mockIncomeRecurrenceConfigs);
    showToast('Dados restaurados para os dados padrão de demonstração!', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        authLoading,
        authScreen,
        setAuthScreen,
        login,
        register,
        signup,
        logout,
        recuperarSenha,
        currentUser,
        partner,
        // Durante a transição convivem os perfis reais (do Postgres) e os
        // usuários de demonstração, porque os lançamentos ainda são mock e
        // referenciam ids como 'user-lucas'. A fase seguinte, que move os
        // dados para o banco, elimina a segunda metade desta lista.
        users: [...perfis, ...users.filter(m => !perfis.some(p => p.id === m.id))],
        activeTab,
        setActiveTab,
        theme,
        setTheme,
        toggleTheme,
        expenses: filteredExpenses,
        incomes: filteredIncomes,
        incomeRecurrenceConfigs,
        getIncomeRecurrenceConfig,
        saveIncomeRecurrenceConfig,
        syncRecurrentIncomesForUser,
        updateUserSalario,
        monthlyGoals: filteredMonthlyGoals,
        financialGoals: filteredFinancialGoals,
        debts: filteredDebts,
        budgets: filteredBudgets,
        getHouseholdUserIds,
        partnership,
        subscription,
        divisionRule,
        setDivisionRule,
        addExpense,
        updateExpense,
        deleteExpense,
        toggleExpensePaid,
        addIncome,
        updateIncome,
        deleteIncome,
        addMonthlyGoal,
        updateMonthlyGoal,
        deleteMonthlyGoal,
        addGoalContribution,
        addFinancialGoal,
        updateFinancialGoal,
        deleteFinancialGoal,
        addFinancialGoalContribution,
        addDebt,
        updateDebt,
        deleteDebt,
        payDebtInstallment,
        updateBudget,
        updatePartnershipStatus,
        sendInvite,
        acceptInvite,
        endPartnership,
        setSubscriptionPlan,
        toasts,
        showToast,
        resetToDefaultData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
