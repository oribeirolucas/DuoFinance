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
import { avatarDeIniciais } from '../utils/avatar';
import {
  paraExpense, deExpense, paraIncome, deIncome,
  paraRecorrencia, deRecorrencia, paraMonthlyGoal, deMonthlyGoal,
  paraFinancialGoal, deFinancialGoal, paraDebt, deDebt,
  paraBudget, deBudget, paraSubscription
} from '../lib/mappers';
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
  /** true enquanto os dados do household chegam do banco. */
  carregandoDados: boolean;
  authScreen: AuthScreen;
  setAuthScreen: (screen: AuthScreen) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (nome: string, email: string, salario?: number, password?: string) => Promise<boolean>;
  signup: (nome: string, email: string, salario?: number, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  recuperarSenha: (email: string) => Promise<boolean>;

  // Conta do usuário
  atualizarPerfil: (dados: { nome?: string; salario?: number; avatar?: string }) => Promise<boolean>;
  enviarFotoPerfil: (arquivo: File) => Promise<string | null>;
  trocarSenha: (senhaAtual: string, novaSenha: string) => Promise<boolean>;
  trocarEmail: (novoEmail: string) => Promise<boolean>;

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

  addFinancialGoal: (
    goal: Omit<FinancialGoal, 'id' | 'valorAtual' | 'status'>
      & { valorAtual?: number; status?: FinancialGoal['status'] }
  ) => void;
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
  sendInvite: (email: string) => Promise<string | null>;
  acceptInvite: (token: string) => Promise<boolean>;
  endPartnership: () => Promise<boolean>;
  setSubscriptionPlan: (plano: 'free' | 'duo') => void;

  // Helpers & Toast
  toasts: ToastState[];
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
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

    // Sem o catch, uma rejeição aqui deixaria authLoading eternamente true e o
    // app giraria o spinner para sempre, sem formulário e sem explicação.
    supabase.auth.getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => showToast('Não foi possível verificar a sessão.', 'error'))
      .finally(() => setAuthLoading(false));

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
  // Os dados vivem no Postgres. Estes estados são apenas a cópia local que a
  // interface renderiza; a hidratação acontece no efeito logo abaixo, depois
  // que existe sessão, e cada escrita vai ao banco. Antes disto o localStorage
  // era a base de dados — o que o parecer resume como "o cliente nunca é fonte
  // de verdade".
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>([]);
  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [incomeRecurrenceConfigs, setIncomeRecurrenceConfigs] = useState<IncomeRecurrenceConfig[]>([]);
  const [partnership, setPartnership] = useState<Partnership>({
    id: '', user1Id: '', status: 'none', inviteToken: ''
  });
  const [subscription, setSubscription] = useState<Subscription>({
    userId: '', plano: 'free', status: 'active'
  });
  const [householdId, setHouseholdId] = useState<string>('');
  const [carregandoDados, setCarregandoDados] = useState(true);

  const [divisionRule, setDivisionRuleEstado] = useState<DivisionRule>('proportional');

  // A regra de divisão era estado de tela, perdido a cada recarga e diferente
  // para cada pessoa do casal. Agora é do household: os dois veem a mesma.
  const setDivisionRule = (regra: DivisionRule) => {
    const anterior = divisionRule;
    if (!householdId) { setDivisionRuleEstado(regra); return; }
    gravar(
      () => { setDivisionRuleEstado(regra); return () => setDivisionRuleEstado(anterior); },
      () => supabase.from('households').update({ divisao_regra: regra }).eq('id', householdId)
    );
  };
  const [toasts, setToasts] = useState<ToastState[]>([]);

  /**
   * Escrita otimista com desfazer.
   *
   * O contexto expõe ~60 funções síncronas que 14 componentes chamam. Torná-las
   * assíncronas obrigaria a tratar carregamento em cada um deles. Então a
   * mudança aparece na tela no mesmo instante, a gravação segue em paralelo e,
   * se o banco recusar, o estado volta ao que era e o erro aparece. Quem decide
   * se a escrita vale continua sendo o servidor.
   */
  const gravar = (
    aplicar: () => () => void,
    escrever: () => PromiseLike<{ error: unknown }>,
    mensagemOk?: string
  ) => {
    const desfazer = aplicar();
    void Promise.resolve(escrever()).then(({ error }) => {
      if (error) {
        desfazer();
        showToast('Não foi possível salvar. Tente novamente.', 'error');
        return;
      }
      if (mensagemOk) showToast(mensagemOk);
    });
  };

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

  /**
   * Relê os perfis do household e o household de quem está logado. Também é
   * chamada depois de aceitar ou encerrar uma parceria, quando a associação
   * muda e, com ela, tudo o que o RLS passa a devolver.
   */
  const recarregarPerfil = async (): Promise<boolean> => {
    const usuario = session?.user;
    if (!usuario) { setPerfis([]); setHouseholdId(''); return false; }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, email, avatar, salario, cor_avatar, household_id');

    if (error || !data) {
      showToast('Não foi possível carregar o perfil.', 'error');
      setCarregandoDados(false);
      return false;
    }

    setHouseholdId(data.find(l => l.id === usuario.id)?.household_id ?? '');
    setPerfis(data.map(linha => ({
      id: linha.id,
      nome: linha.nome,
      email: linha.email ?? '',
      avatar: linha.avatar || avatarDeIniciais(linha.nome, linha.cor_avatar),
      salario: Number(linha.salario) || 0,
      corAvatar: linha.cor_avatar
    })));
    return true;
  };

  useEffect(() => {
    if (!session) { setPerfis([]); setHouseholdId(''); return; }
    void recarregarPerfil();
  }, [session?.user.id]);

  // Carrega os dados do household. O RLS já restringe o que volta, então não
  // há filtro por usuário na consulta: pedir "todas as despesas" devolve
  // exatamente as do casal de quem está logado.
  useEffect(() => {
    if (!session) { setCarregandoDados(false); return; }
    if (!householdId) return;

    let cancelado = false;
    setCarregandoDados(true);

    Promise.all([
      supabase.from('expenses').select('*').order('data', { ascending: false }),
      supabase.from('incomes').select('*').order('data', { ascending: false }),
      supabase.from('income_recurrence_configs').select('*'),
      supabase.from('monthly_goals').select('*'),
      supabase.from('financial_goals').select('*'),
      supabase.from('debts').select('*'),
      supabase.from('category_budgets').select('*'),
      supabase.from('subscriptions').select('*').eq('user_id', session.user.id).maybeSingle(),
      supabase.from('households').select('divisao_regra').eq('id', householdId).maybeSingle(),
      supabase.from('household_members').select('user_id, papel'),
    ]).then(([ex, inc, rec, mg, fg, dv, orc, assin, casa, membros]) => {
      if (cancelado) return;

      const falhou = [ex, inc, rec, mg, fg, dv, orc, assin, casa, membros].find(r => r.error);
      if (falhou) {
        showToast('Não foi possível carregar seus dados.', 'error');
        setCarregandoDados(false);
        return;
      }

      setExpenses((ex.data ?? []).map(paraExpense));
      setIncomes((inc.data ?? []).map(paraIncome));
      setIncomeRecurrenceConfigs((rec.data ?? []).map(paraRecorrencia));
      setMonthlyGoals((mg.data ?? []).map(paraMonthlyGoal));
      setFinancialGoals((fg.data ?? []).map(paraFinancialGoal));
      setDebts((dv.data ?? []).map(paraDebt));
      setBudgets((orc.data ?? []).map(paraBudget));
      if (assin.data) setSubscription(paraSubscription(assin.data));
      if (casa.data?.divisao_regra) setDivisionRuleEstado(casa.data.divisao_regra as DivisionRule);

      // A parceria deixa de ser um objeto guardado e passa a ser derivada de
      // quem está no household. Antes ela vinha do localStorage, onde podia
      // dizer qualquer coisa; agora reflete a associação real no banco, que é
      // a mesma que o RLS consulta para decidir o que cada um enxerga.
      const linhasMembros = membros.data ?? [];
      const dono = linhasMembros.find(m => m.papel === 'owner')?.user_id ?? session.user.id;
      const outro = linhasMembros.find(m => m.user_id !== dono)?.user_id;
      setPartnership({
        id: householdId,
        user1Id: dono,
        user2Id: outro,
        status: linhasMembros.length >= 2 ? 'active' : 'none',
        inviteToken: ''
      });
      setCarregandoDados(false);
    }).catch(() => {
      // Sem isto, uma consulta rejeitada deixaria a tela de carregamento presa
      // para sempre, sem erro e sem app.
      if (cancelado) return;
      showToast('Não foi possível carregar seus dados.', 'error');
      setCarregandoDados(false);
    });

    return () => { cancelado = true; };
  }, [session?.user.id, householdId]);

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

  // Os perfis do household são a lista completa de usuários visíveis: o RLS
  // não deixa consultar mais do que isso.
  const todosUsuarios: User[] = perfis;

  const partner: User | null = (() => {
    if (!isAuthenticated) return null;
    if (partnership.status !== 'active') return null;

    if (currentUser.id === partnership.user1Id && partnership.user2Id) {
      return todosUsuarios.find(u => u.id === partnership.user2Id) || null;
    }
    if (currentUser.id === partnership.user2Id && partnership.user1Id) {
      return todosUsuarios.find(u => u.id === partnership.user1Id) || null;
    }

    return null;
  })();

  // ---- conta do usuário ----

  const atualizarPerfil = async (dados: { nome?: string; salario?: number; avatar?: string }): Promise<boolean> => {
    if (!session) return false;

    const linha: Record<string, unknown> = {};
    if (dados.nome !== undefined) linha.nome = dados.nome.trim();
    if (dados.salario !== undefined) linha.salario = dados.salario;
    if (dados.avatar !== undefined) linha.avatar = dados.avatar;
    if (Object.keys(linha).length === 0) return true;

    const { error } = await supabase.from('profiles').update(linha).eq('id', session.user.id);
    if (error) {
      showToast('Não foi possível salvar as alterações.', 'error');
      return false;
    }

    setPerfis(prev => prev.map(p => (p.id === session.user.id
      ? {
          ...p,
          nome: dados.nome?.trim() ?? p.nome,
          salario: dados.salario ?? p.salario,
          avatar: dados.avatar ?? p.avatar
        }
      : p)));
    showToast('Perfil atualizado.', 'success');
    return true;
  };

  const enviarFotoPerfil = async (arquivo: File): Promise<string | null> => {
    if (!session) return null;

    // As mesmas regras valem no servidor (bucket com limite de 2 MB e lista de
    // tipos). Checar aqui é só para dar erro imediato em vez de esperar o
    // upload inteiro subir para ser recusado.
    const tiposAceitos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!tiposAceitos.includes(arquivo.type)) {
      showToast('Use uma imagem JPG, PNG, WEBP ou GIF.', 'error');
      return null;
    }
    if (arquivo.size > 2 * 1024 * 1024) {
      showToast('A imagem precisa ter no máximo 2 MB.', 'error');
      return null;
    }

    // Caminho começa pelo uuid do dono: é o que a policy do bucket exige, e
    // impede sobrescrever a foto da outra pessoa.
    const extensao = arquivo.name.split('.').pop()?.toLowerCase() || 'jpg';
    const caminho = `${session.user.id}/${crypto.randomUUID()}.${extensao}`;

    const { error } = await supabase.storage.from('avatares').upload(caminho, arquivo, {
      cacheControl: '3600',
      upsert: false
    });
    if (error) {
      showToast('Não foi possível enviar a imagem.', 'error');
      return null;
    }

    const { data } = supabase.storage.from('avatares').getPublicUrl(caminho);
    return data.publicUrl;
  };

  const trocarSenha = async (senhaAtual: string, novaSenha: string): Promise<boolean> => {
    const email = session?.user.email;
    if (!email) return false;

    // O Supabase troca a senha sem pedir a atual. Exigi-la aqui é o que impede
    // que uma sessão esquecida aberta num computador alheio vire uma troca de
    // senha — e, com ela, a perda da conta.
    const { error: erroAuth } = await supabase.auth.signInWithPassword({ email, password: senhaAtual });
    if (erroAuth) {
      showToast('Senha atual incorreta.', 'error');
      return false;
    }

    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    if (error) {
      showToast(error.message || 'Não foi possível alterar a senha.', 'error');
      return false;
    }

    showToast('Senha alterada com sucesso.', 'success');
    return true;
  };

  const trocarEmail = async (novoEmail: string): Promise<boolean> => {
    const { error } = await supabase.auth.updateUser({ email: novoEmail.trim().toLowerCase() });
    if (error) {
      showToast(error.message || 'Não foi possível alterar o e-mail.', 'error');
      return false;
    }
    // O e-mail só muda de fato depois da confirmação no endereço novo.
    showToast('Confirme a troca pelo link enviado ao novo e-mail.', 'info');
    return true;
  };

  // setCurrentUserId foi removido. Ele assumia a identidade de outra pessoa e
  // carimbava o id dela em tudo que fosse criado depois. Com RLS no banco a
  // troca não teria efeito nenhum sobre o que é visível, então manter o botão
  // seria mentira de interface.

  const updateUserSalario = (novoValor: number, userId?: string) => {
    const targetId = userId || currentUser.id;
    if (!targetId) return;

    // Perfil real: grava no banco pela função que valida a associação ao
    // household (set_member_salario), e atualiza a cópia local.
    const anterior = perfis;
    gravar(
      () => { setPerfis(prev => prev.map(p => (p.id === targetId ? { ...p, salario: novoValor } : p)));
              return () => setPerfis(anterior); },
      () => supabase.rpc('set_member_salario', { p_user: targetId, p_valor: novoValor })
    );
  };

  /**
   * Continua existindo como conveniência para as telas, mas deixou de ser
   * fronteira de segurança: o que chega aqui já veio filtrado pelo RLS, que
   * não entrega linha de outro household por mais que o cliente peça. Filtrar
   * de novo no front é só para agrupar por pessoa dentro do casal.
   */
  const getHouseholdUserIds = (): string[] => {
    if (!currentUser || !currentUser.id) return [];
    return partner && partner.id ? [currentUser.id, partner.id] : [currentUser.id];
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
    // "funciona" mas devolve identities vazio. O retorno e a mensagem precisam
    // ser idênticos aos do cadastro legítimo sem sessão: se um caminho
    // mostrasse erro e o outro não, bastaria tentar cadastrar um e-mail para
    // descobrir se ele tem conta — a enumeração que isto deveria impedir.
    const jaExistia = data.user?.identities?.length === 0;

    if (jaExistia || !data.session) {
      showToast('Verifique seu e-mail para confirmar a conta.', 'info');
      return true;
    }

    showToast('Conta criada com sucesso! 🚀', 'success');
    return true;
  };

  const register = signup;

  const logout = async () => {
    await supabase.auth.signOut();
    // Sem limpar, um segundo login na mesma aba renderiza os dados da conta
    // anterior até a nova carga chegar.
    setExpenses([]); setIncomes([]); setMonthlyGoals([]); setFinancialGoals([]);
    setDebts([]); setBudgets([]); setIncomeRecurrenceConfigs([]); setPerfis([]);
    setHouseholdId('');
    setAuthScreen('login');
    showToast('Sessão encerrada com sucesso.', 'info');
  };

  // Antes isto só exibia "E-mail enviado!" sem fazer nada.
  const recuperarSenha = async (email: string): Promise<boolean> => {
    if (!supabaseConfigurado) {
      showToast('Aplicação sem backend configurado.', 'error');
      return false;
    }

    // O Supabase responde com sucesso mesmo para e-mail sem conta, então um
    // erro aqui é falha real de envio (rede, limite de taxa) — vale informar,
    // sem revelar nada sobre a existência da conta.
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/` }
    );

    return !error;
  };

  // CRUD EXPENSES
  const addExpense = (newExp: Omit<Expense, 'id'>) => {
    // Id gerado no cliente: assim a linha otimista já nasce com o id final, e
    // um update ou um desfazer logo em seguida não erram o alvo.
    const created: Expense = { registradoPor: currentUser.id, ...newExp, id: crypto.randomUUID() };
    gravar(
      () => { setExpenses(prev => [created, ...prev]);
              return () => setExpenses(prev => prev.filter(e => e.id !== created.id)); },
      () => supabase.from('expenses').insert(deExpense(created, householdId)),
      'Despesa registrada com sucesso!'
    );
  };

  const updateExpense = (id: string, data: Partial<Expense>) => {
    const anterior = expenses.find(e => e.id === id);
    gravar(
      () => { setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
              return () => setExpenses(prev => prev.map(e => e.id === id && anterior ? anterior : e)); },
      () => supabase.from('expenses').update(deExpense(data)).eq('id', id),
      'Despesa atualizada!'
    );
  };

  const deleteExpense = (id: string) => {
    const indice = expenses.findIndex(e => e.id === id);
    const removida = expenses[indice];
    gravar(
      () => { setExpenses(prev => prev.filter(e => e.id !== id));
              return () => setExpenses(prev => { if (!removida) return prev;
                const prox = [...prev]; prox.splice(Math.max(0, indice), 0, removida); return prox; }); },
      () => supabase.from('expenses').delete().eq('id', id)
    );
  };

  const toggleExpensePaid = (id: string) => {
    const alvo = expenses.find(e => e.id === id);
    if (!alvo) return;
    const pago = !alvo.pago;
    gravar(
      () => { setExpenses(prev => prev.map(e => e.id === id ? { ...e, pago } : e));
              return () => setExpenses(prev => prev.map(e => e.id === id ? { ...e, pago: !pago } : e)); },
      () => supabase.from('expenses').update({ pago }).eq('id', id)
    );
  };

  // CRUD INCOMES
  const addIncome = (newInc: Omit<Income, 'id'>) => {
    const created: Income = { registradoPor: currentUser.id, ...newInc, id: crypto.randomUUID() };
    gravar(
      () => { setIncomes(prev => [created, ...prev]);
              return () => setIncomes(prev => prev.filter(i => i.id !== created.id)); },
      () => supabase.from('incomes').insert(deIncome(created, householdId)),
      'Receita adicionada com sucesso! 💰'
    );
  };

  const updateIncome = (id: string, data: Partial<Income>) => {
    const anterior = incomes.find(i => i.id === id);
    gravar(
      () => { setIncomes(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
              return () => setIncomes(prev => prev.map(i => i.id === id && anterior ? anterior : i)); },
      () => supabase.from('incomes').update(deIncome(data)).eq('id', id),
      'Receita atualizada!'
    );
  };

  const deleteIncome = (id: string) => {
    const indice = incomes.findIndex(i => i.id === id);
    const removida = incomes[indice];
    gravar(
      () => { setIncomes(prev => prev.filter(i => i.id !== id));
              return () => setIncomes(prev => { if (!removida) return prev;
                const prox = [...prev]; prox.splice(Math.max(0, indice), 0, removida); return prox; }); },
      () => supabase.from('incomes').delete().eq('id', id)
    );
  };

  // INCOME RECURRENCE CONFIGS
  const getIncomeRecurrenceConfig = (userId?: string): IncomeRecurrenceConfig[] => {
    const targetId = userId || currentUser.id;
    return incomeRecurrenceConfigs.filter(c => c.donoId === targetId);
  };

  const saveIncomeRecurrenceConfig = (config: IncomeRecurrenceConfig) => {
    const anterior = incomeRecurrenceConfigs;
    // A tabela tem unique (dono_id, tipo): upsert por essa chave evita criar
    // uma segunda configuração do mesmo tipo para a mesma pessoa.
    // A tela monta ids legíveis como "irc-<usuario>-salario", que não cabem
    // numa coluna uuid. O id real vem da linha já gravada, ou é novo.
    const existente = incomeRecurrenceConfigs.find(c => c.donoId === config.donoId && c.tipo === config.tipo);
    const comId = { ...config, id: existente?.id ?? crypto.randomUUID() };
    gravar(
      () => {
        setIncomeRecurrenceConfigs(prev => {
          const i = prev.findIndex(c => c.donoId === comId.donoId && c.tipo === comId.tipo);
          if (i >= 0) { const prox = [...prev]; prox[i] = comId; return prox; }
          return [...prev, comId];
        });
        return () => setIncomeRecurrenceConfigs(anterior);
      },
      () => supabase.from('income_recurrence_configs')
        .upsert(deRecorrencia(comId, householdId), { onConflict: 'dono_id,tipo' }),
      'Configuração de recorrência salva!'
    );
  };

  const syncRecurrentIncomesForUser = (userId: string, year?: number, overrideSalary?: number) => {
    const targetYear = year || new Date().getFullYear();
    const userToSync = todosUsuarios.find(u => u.id === userId);
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

    const novasReceitas: Income[] = generatedIncomes.map(inc => ({ ...inc, id: crypto.randomUUID() }));
    const prefixoAno = `${targetYear}-`;
    const anterior = incomes;

    const mantidas = incomes.filter(i => {
      if (i.registradoPor !== userId) return true;
      if (!i.data.startsWith(prefixoAno)) return true;
      return i.tipo === 'renda_extra' || !i.tipo;
    });

    // Apaga e regera o ano inteiro em duas chamadas, não ~16 escritas soltas.
    // A operação é idempotente — rodar de novo converge para o mesmo estado —
    // então, se a segunda etapa falhar, repetir resolve. O guarda abaixo evita
    // o caso ruim: inserir sem ter apagado, que duplicaria o ano.
    setIncomes([...novasReceitas, ...mantidas]);

    void supabase.from('incomes').delete()
      .eq('registrado_por', userId)
      .in('tipo', ['salario', 'ferias', 'decimo_terceiro'])
      .gte('data', `${targetYear}-01-01`)
      .lte('data', `${targetYear}-12-31`)
      .then(({ error }) => {
        if (error) {
          setIncomes(anterior);
          showToast('Não foi possível sincronizar as receitas.', 'error');
          return;
        }
        return supabase.from('incomes')
          .insert(novasReceitas.map(i => deIncome(i, householdId)))
          .then(({ error: erroInsert }) => {
            if (erroInsert) {
              // A exclusão já foi confirmada pelo banco. Voltar ao estado
              // anterior exibiria um ano de receitas que não existem mais —
              // pior que mostrar o vazio real. A tela passa a refletir o que
              // de fato está gravado, e a mensagem pede a repetição, que é
              // segura: a operação converge para o mesmo resultado.
              setIncomes(mantidas);
              showToast('As receitas foram limpas, mas não recriadas. Sincronize novamente.', 'error');
              return;
            }
            showToast(`Receitas recorrentes sincronizadas para ${userToSync.nome}! 💰`, 'success');
          });
      });
  };

  // MONTHLY GOALS
  const addMonthlyGoal = (goal: Omit<MonthlyGoal, 'id' | 'valorAtual' | 'status'>) => {
    const created: MonthlyGoal = {
      donoId: currentUser.id, ...goal, id: crypto.randomUUID(),
      valorAtual: 0, status: 'em_andamento'
    };
    gravar(
      () => { setMonthlyGoals(prev => [created, ...prev]);
              return () => setMonthlyGoals(prev => prev.filter(g => g.id !== created.id)); },
      () => supabase.from('monthly_goals').insert(deMonthlyGoal(created, householdId)),
      'Nova meta de economia criada! 🎯'
    );
  };

  const updateMonthlyGoal = (id: string, data: Partial<MonthlyGoal>) => {
    const anterior = monthlyGoals.find(g => g.id === id);
    gravar(
      () => { setMonthlyGoals(prev => prev.map(g => g.id === id ? { ...g, ...data } : g));
              return () => setMonthlyGoals(prev => prev.map(g => g.id === id && anterior ? anterior : g)); },
      () => supabase.from('monthly_goals').update(deMonthlyGoal(data)).eq('id', id),
      'Meta atualizada!'
    );
  };

  const deleteMonthlyGoal = (id: string) => {
    const indice = monthlyGoals.findIndex(g => g.id === id);
    const removida = monthlyGoals[indice];
    gravar(
      () => { setMonthlyGoals(prev => prev.filter(g => g.id !== id));
              return () => setMonthlyGoals(prev => { if (!removida) return prev;
                const prox = [...prev]; prox.splice(Math.max(0, indice), 0, removida); return prox; }); },
      () => supabase.from('monthly_goals').delete().eq('id', id)
    );
  };

  const addGoalContribution = (goalId: string, amount: number) => {
    const alvo = monthlyGoals.find(g => g.id === goalId);
    if (!alvo) return;
    const valorAtual = alvo.valorAtual + amount;
    const concluida = valorAtual >= alvo.valorAlvo;
    const status: MonthlyGoal['status'] = concluida ? 'concluida' : 'em_andamento';
    gravar(
      () => { setMonthlyGoals(prev => prev.map(g => g.id === goalId ? { ...g, valorAtual, status } : g));
              return () => setMonthlyGoals(prev => prev.map(g => g.id === goalId ? alvo : g)); },
      () => supabase.from('monthly_goals').update({ valor_atual: valorAtual, status }).eq('id', goalId),
      concluida
        ? `Parabéns! Meta "${alvo.nome}" concluída com sucesso! 🎉`
        : `Aporte de R$ ${amount.toFixed(2)} adicionado à meta!`
    );
  };

  // FINANCIAL GOALS (LONG TERM)
  const addFinancialGoal = (
    goal: Omit<FinancialGoal, 'id' | 'valorAtual' | 'status'>
      & { valorAtual?: number; status?: FinancialGoal['status'] }
  ) => {
    // O formulário tem campo de valor já guardado. Antes ele era descartado em
    // silêncio, porque os padrões vinham depois do espalhamento.
    const created: FinancialGoal = {
      donoId: currentUser.id,
      ...goal,
      id: crypto.randomUUID(),
      valorAtual: goal.valorAtual ?? 0,
      status: goal.status ?? 'em_andamento'
    };
    gravar(
      () => { setFinancialGoals(prev => [created, ...prev]);
              return () => setFinancialGoals(prev => prev.filter(f => f.id !== created.id)); },
      () => supabase.from('financial_goals').insert(deFinancialGoal(created, householdId)),
      'Sonho adicionado! Que o planejamento comece 🚀'
    );
  };

  const updateFinancialGoal = (id: string, data: Partial<FinancialGoal>) => {
    const anterior = financialGoals.find(f => f.id === id);
    gravar(
      () => { setFinancialGoals(prev => prev.map(f => f.id === id ? { ...f, ...data } : f));
              return () => setFinancialGoals(prev => prev.map(f => f.id === id && anterior ? anterior : f)); },
      () => supabase.from('financial_goals').update(deFinancialGoal(data)).eq('id', id),
      'Meta de longo prazo atualizada!'
    );
  };

  const deleteFinancialGoal = (id: string) => {
    const indice = financialGoals.findIndex(f => f.id === id);
    const removida = financialGoals[indice];
    gravar(
      () => { setFinancialGoals(prev => prev.filter(f => f.id !== id));
              return () => setFinancialGoals(prev => { if (!removida) return prev;
                const prox = [...prev]; prox.splice(Math.max(0, indice), 0, removida); return prox; }); },
      () => supabase.from('financial_goals').delete().eq('id', id)
    );
  };

  const addFinancialGoalContribution = (goalId: string, amount: number) => {
    const alvo = financialGoals.find(f => f.id === goalId);
    if (!alvo) return;
    const valorAtual = alvo.valorAtual + amount;
    const concluida = valorAtual >= alvo.valorAlvo;
    const status: FinancialGoal['status'] = concluida ? 'concluida' : 'em_andamento';
    gravar(
      () => { setFinancialGoals(prev => prev.map(f => f.id === goalId ? { ...f, valorAtual, status } : f));
              return () => setFinancialGoals(prev => prev.map(f => f.id === goalId ? alvo : f)); },
      () => supabase.from('financial_goals').update({ valor_atual: valorAtual, status }).eq('id', goalId),
      concluida
        ? `Incrível! Vocês atingiram o objetivo "${alvo.nome}"! 🥂💜`
        : `R$ ${amount.toFixed(2)} depositados para "${alvo.nome}"!`
    );
  };

  // DEBTS
  const addDebt = (debt: Omit<Debt, 'id'>) => {
    const created: Debt = { registradoPor: currentUser.id, ...debt, id: crypto.randomUUID() };
    gravar(
      () => { setDebts(prev => [created, ...prev]);
              return () => setDebts(prev => prev.filter(d => d.id !== created.id)); },
      () => supabase.from('debts').insert(deDebt(created, householdId)),
      'Dívida cadastrada com sucesso!'
    );
  };

  const updateDebt = (id: string, data: Partial<Debt>) => {
    const anterior = debts.find(d => d.id === id);
    gravar(
      () => { setDebts(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
              return () => setDebts(prev => prev.map(d => d.id === id && anterior ? anterior : d)); },
      () => supabase.from('debts').update(deDebt(data)).eq('id', id),
      'Dívida atualizada!'
    );
  };

  const deleteDebt = (id: string) => {
    const indice = debts.findIndex(d => d.id === id);
    const removida = debts[indice];
    gravar(
      () => { setDebts(prev => prev.filter(d => d.id !== id));
              return () => setDebts(prev => { if (!removida) return prev;
                const prox = [...prev]; prox.splice(Math.max(0, indice), 0, removida); return prox; }); },
      () => supabase.from('debts').delete().eq('id', id)
    );
  };

  const payDebtInstallment = (id: string, amount: number) => {
    const alvo = debts.find(d => d.id === id);
    if (!alvo) return;
    // O banco recusa valor_pago acima do total; o clamp aqui evita o erro cru.
    const valorPago = Math.min(alvo.valorTotal, alvo.valorPago + amount);
    const quitada = valorPago >= alvo.valorTotal;
    gravar(
      () => { setDebts(prev => prev.map(d => d.id === id ? { ...d, valorPago } : d));
              return () => setDebts(prev => prev.map(d => d.id === id ? alvo : d)); },
      () => supabase.from('debts').update({ valor_pago: valorPago }).eq('id', id),
      quitada
        ? `Uhuuul! Dívida "${alvo.nome}" quitada integralmente! 🥳`
        : `Pagamento de R$ ${amount.toFixed(2)} registrado!`
    );
  };

  // BUDGET
  const updateBudget = (categoria: ExpenseCategory, limite: number) => {
    const anterior = budgets;
    // A tabela tem unique (household_id, categoria): um orçamento por
    // categoria por casal, que é o que a tela de fato mostra.
    gravar(
      () => {
        setBudgets(prev => prev.some(b => b.categoria === categoria)
          ? prev.map(b => b.categoria === categoria ? { ...b, limite, donoId: currentUser.id } : b)
          : [...prev, { categoria, limite, donoId: currentUser.id }]);
        return () => setBudgets(anterior);
      },
      () => supabase.from('category_budgets')
        .upsert(deBudget({ categoria, limite, donoId: currentUser.id }, householdId),
                { onConflict: 'household_id,categoria' }),
      `Orçamento de ${categoria} atualizado para R$ ${limite.toFixed(2)}`
    );
  };

  // PARTNERSHIP & SUBSCRIPTION
  const updatePartnershipStatus = (status: 'none' | 'pending' | 'active', partnerEmail?: string) => {
    setPartnership(prev => {
      const emailToFind = partnerEmail || prev.partnerEmail;
      const partnerUser = emailToFind ? todosUsuarios.find(u => u.email.toLowerCase() === emailToFind.toLowerCase()) : null;
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

  /**
   * Convite de parceria.
   *
   * O que havia aqui gerava `DUO-NNNN-LOVE` com Math.random e, do outro lado,
   * aceitava qualquer string de 4 caracteres sem comparar com coisa alguma.
   * Agora o token é um uuid criado pelo servidor, com validade de 7 dias, uso
   * único e verificação de que o e-mail convidado é o de quem está aceitando.
   * Nada disso pode morar no cliente: quem aceita precisa ler uma linha de um
   * household do qual ainda não faz parte.
   */
  const sendInvite = async (email: string): Promise<string | null> => {
    const { data, error } = await supabase.rpc('criar_convite_household', {
      p_email: email.trim().toLowerCase()
    });

    if (error) {
      const mensagens: Record<string, string> = {
        parceria_ja_ativa: 'Você já tem uma parceria ativa.',
        convite_para_si_mesmo: 'Use o e-mail da outra pessoa.',
        sem_household: 'Não foi possível identificar sua conta.'
      };
      showToast(mensagens[error.message] ?? 'Não foi possível gerar o convite.', 'error');
      return null;
    }

    const convite = Array.isArray(data) ? data[0] : data;
    if (!convite?.token) {
      showToast('O servidor não devolveu o código do convite.', 'error');
      return null;
    }
    setPartnership(prev => ({
      ...prev,
      status: 'pending',
      inviteToken: convite.token,
      partnerEmail: convite.convidado_email
    }));
    showToast(`Convite criado para ${convite.convidado_email}. Envie o código.`, 'info');
    return convite.token as string;
  };

  const acceptInvite = async (token: string): Promise<boolean> => {
    // Formato conferido antes de ir à rede, só para dar erro imediato: a
    // validação que vale é a do servidor.
    const limpo = token.trim();
    const ehUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(limpo);
    if (!ehUuid) {
      showToast('Código de convite inválido.', 'error');
      return false;
    }

    const { error } = await supabase.rpc('aceitar_convite_household', { p_token: limpo });
    if (error) {
      const mensagens: Record<string, string> = {
        convite_invalido: 'Convite inválido, já usado ou expirado.',
        convite_proprio: 'Você não pode aceitar o próprio convite.',
        convite_de_outro_email: 'Este convite foi emitido para outro e-mail.',
        parceria_ja_ativa: 'Essa parceria já tem duas pessoas.',
        ja_tem_parceria: 'Você já tem uma parceria ativa.'
      };
      showToast(mensagens[error.message] ?? 'Não foi possível aceitar o convite.', 'error');
      return false;
    }

    // A associação mudou: recarregar traz os dados do casal e a nova composição
    // do household. A recarga vem ANTES do aviso de sucesso: anunciar primeiro
    // deixaria a tela exibindo o household antigo enquanto toda escrita falha.
    const recarregou = await recarregarPerfil();
    if (!recarregou) {
      showToast('Parceria criada, mas a tela não atualizou. Recarregue a página.', 'error');
      return true;
    }
    showToast('Parceria iniciada! 💜', 'success');
    return true;
  };

  const endPartnership = async (): Promise<boolean> => {
    const { error } = await supabase.rpc('sair_da_parceria');
    if (error) {
      showToast('Não foi possível encerrar a parceria.', 'error');
      return false;
    }
    const recarregou = await recarregarPerfil();
    if (!recarregou) {
      showToast('Parceria encerrada, mas a tela não atualizou. Recarregue a página.', 'error');
      return true;
    }
    showToast('Parceria encerrada. Os lançamentos ficaram com a conta que permaneceu.', 'info');
    return true;
  };

  /**
   * O plano deixou de ser editável pelo cliente: a policy de escrita em
   * subscriptions foi removida justamente porque qualquer pessoa se dava o
   * plano duo com um PATCH. Trocar de plano passa a depender de cobrança, que
   * é o item 6 do roteiro e ainda não existe. A função fica, para não quebrar
   * as telas, mas diz a verdade em vez de fingir que mudou algo.
   */
  const setSubscriptionPlan = (_plano: 'free' | 'duo') => {
    showToast('A troca de plano ainda não está disponível.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        authLoading,
        carregandoDados,
        authScreen,
        setAuthScreen,
        login,
        register,
        signup,
        logout,
        recuperarSenha,
        atualizarPerfil,
        enviarFotoPerfil,
        trocarSenha,
        trocarEmail,
        currentUser,
        partner,
        users: todosUsuarios,
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
