import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AuthView } from './components/Auth/AuthView';
import { ToastContainer } from './components/ToastContainer';
import { Debt } from './types';
// Estático de propósito: o app sempre abre no Dashboard, então adiá-lo não
// pouparia download nenhum no primeiro acesso e só acrescentaria uma ida e
// volta antes do primeiro desenho. O ganho do code-splitting vem das outras
// dez telas e dos cinco modais, que a maioria das visitas não abre.
import { DashboardView } from './components/Views/DashboardView';

// As demais telas e os modais entram sob demanda: cada lazy() vira um arquivo
// próprio no build, buscado no primeiro uso e cacheado depois.
const ComparisonView     = lazy(() => import('./components/Views/ComparisonView').then(m => ({ default: m.ComparisonView })));
const ExpensesView       = lazy(() => import('./components/Views/ExpensesView').then(m => ({ default: m.ExpensesView })));
const IncomesView        = lazy(() => import('./components/Views/IncomesView').then(m => ({ default: m.IncomesView })));
const BudgetView         = lazy(() => import('./components/Views/BudgetView').then(m => ({ default: m.BudgetView })));
const DebtsView          = lazy(() => import('./components/Views/DebtsView').then(m => ({ default: m.DebtsView })));
const GoalsView          = lazy(() => import('./components/Views/GoalsView').then(m => ({ default: m.GoalsView })));
const FinancialGoalsView = lazy(() => import('./components/Views/FinancialGoalsView').then(m => ({ default: m.FinancialGoalsView })));
const SpreadsheetView    = lazy(() => import('./components/Views/SpreadsheetView').then(m => ({ default: m.SpreadsheetView })));
const PartnerView        = lazy(() => import('./components/Views/PartnerView').then(m => ({ default: m.PartnerView })));
const SettingsView       = lazy(() => import('./components/Views/SettingsView').then(m => ({ default: m.SettingsView })));

const ExpenseModal           = lazy(() => import('./components/Modals/ExpenseModal').then(m => ({ default: m.ExpenseModal })));
const IncomeModal            = lazy(() => import('./components/Modals/IncomeModal').then(m => ({ default: m.IncomeModal })));
const IncomeRecurrenceModal  = lazy(() => import('./components/Modals/IncomeRecurrenceModal').then(m => ({ default: m.IncomeRecurrenceModal })));
const PartnerInviteModal     = lazy(() => import('./components/Modals/PartnerInviteModal').then(m => ({ default: m.PartnerInviteModal })));
const DebtModal              = lazy(() => import('./components/Modals/DebtModal').then(m => ({ default: m.DebtModal })));

/**
 * Um import() rejeitado tem a cara acima: o navegador pede um arquivo com hash
 * que deixou de existir. É o caso que a fronteira abaixo sabe explicar.
 * Qualquer outro erro de render é bug nosso, e dizer "saiu uma versão nova"
 * para um TypeError esconderia o defeito atrás de uma desculpa.
 */
const ehFalhaDeChunk = (erro: unknown): boolean => {
  const texto = erro instanceof Error ? `${erro.name} ${erro.message}` : String(erro);
  return /dynamically imported module|Importing a module script failed|ChunkLoadError|error loading dynamically imported module/i.test(
    texto
  );
};

/**
 * Fronteira de erro para o carregamento sob demanda.
 *
 * Um import() rejeitado — hash de arquivo invalidado por um deploy novo
 * enquanto a aba estava aberta, ou queda de rede — subia até a raiz e deixava
 * a tela em branco. Antes do code-splitting isso não podia acontecer: tudo já
 * estava carregado desde o início.
 *
 * `variante="modal"` existe porque o aviso precisa aparecer onde o usuário
 * está olhando: no fluxo da página, para uma tela; sobre a página, para um
 * modal que ele acabou de mandar abrir.
 */
class FronteiraDeCarregamento extends React.Component<
  {
    children: React.ReactNode;
    variante?: 'tela' | 'modal';
    /** Fecha o que estava sendo aberto, para o app seguir usável sem recarregar. */
    onDispensar?: () => void;
  },
  { falhou: boolean; deChunk: boolean }
> {
  state = { falhou: false, deChunk: false };

  static getDerivedStateFromError(erro: unknown) {
    return { falhou: true, deChunk: ehFalhaDeChunk(erro) };
  }

  componentDidCatch(erro: unknown, info: React.ErrorInfo) {
    // Sem isto um bug de render virava só uma mensagem amigável e sumia.
    console.error('[DuoFinance] falha ao renderizar', erro, info.componentStack);
  }

  private dispensar = () => {
    this.setState({ falhou: false, deChunk: false });
    this.props.onDispensar?.();
  };

  render() {
    if (!this.state.falhou) return this.props.children;

    const ehModal = this.props.variante === 'modal';
    const titulo = ehModal ? 'Não foi possível abrir.' : 'Não foi possível carregar esta tela.';
    const detalhe = this.state.deChunk
      ? 'Pode ter saído uma versão nova enquanto esta aba estava aberta.'
      : 'Algo deu errado por aqui. Recarregar costuma resolver.';

    const aviso = (
      <div role="alert" className="flex flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{titulo}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">{detalhe}</p>
        <div className="flex items-center gap-2">
          {this.props.onDispensar && (
            <button
              onClick={this.dispensar}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs"
            >
              Fechar
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-gradient-duo text-white font-bold text-xs"
          >
            Recarregar
          </button>
        </div>
      </div>
    );

    if (!ehModal) return <div className="py-24">{aviso}</div>;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl">{aviso}</div>
      </div>
    );
  }
}

/** Placeholder enquanto o arquivo da tela é buscado. Some em milissegundos
 *  na segunda visita, porque o navegador já tem o pedaço em cache. */
const CarregandoTela: React.FC = () => (
  <div className="flex items-center justify-center py-24" role="status" aria-label="Carregando">
    <div className="w-7 h-7 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin" />
  </div>
);

/** O mesmo spinner, mas como overlay: montado no fluxo normal, o placeholder
 *  do modal virava uma faixa de 28 px na borda da página — longe do botão que
 *  o usuário clicou, e empurrando o conteúdo para o lado. */
const CarregandoModal: React.FC = () => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    role="status"
    aria-label="Carregando"
  >
    <div className="w-8 h-8 rounded-full border-2 border-white/40 border-t-white animate-spin" />
  </div>
);

const MainLayout: React.FC = () => {
  const { isAuthenticated, authLoading, carregandoDados, activeTab } = useApp();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('duo_finance_sidebar_collapsed') === 'true';
  });
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [incomeRecurrenceModalOpen, setIncomeRecurrenceModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const [debtToEdit, setDebtToEdit] = useState<Debt | null>(null);

  const openDebtModal = (debt?: Debt) => {
    setDebtToEdit(debt ?? null);
    setDebtModalOpen(true);
  };

  /** Usado quando o arquivo de um modal não carrega: fecha o que estava sendo
   *  aberto para o app seguir usável sem exigir recarregar a página. */
  const fecharModais = () => {
    setExpenseModalOpen(false);
    setIncomeModalOpen(false);
    setIncomeRecurrenceModalOpen(false);
    setInviteModalOpen(false);
    setDebtModalOpen(false);
  };

  useEffect(() => {
    localStorage.setItem('duo_finance_sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  // Enquanto a sessão existente não é resolvida, não decidimos nada: mostrar
  // a tela de login aqui faria o app piscar o formulário a cada recarga de
  // quem já está logado.
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FF] dark:bg-slate-950">
        <div className="w-8 h-8 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthView />;
  }

  // Sem isto, logo após o login a tela mostra R$ 0,00 em tudo enquanto os
  // dados chegam do banco — o que parece perda de dados, não carregamento.
  if (carregandoDados) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#F8F9FF] dark:bg-slate-950">
        <div className="w-8 h-8 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin" />
        <p className="text-xs text-slate-500 dark:text-slate-400">Carregando suas finanças...</p>
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            onOpenExpenseModal={() => setExpenseModalOpen(true)}
            onOpenIncomeModal={() => setIncomeModalOpen(true)}
          />
        );
      case 'comparacao':
        return <ComparisonView />;
      case 'despesas':
        return <ExpensesView onOpenExpenseModal={() => setExpenseModalOpen(true)} />;
      case 'receitas':
        return (
          <IncomesView
            onOpenIncomeModal={() => setIncomeModalOpen(true)}
            onOpenRecurrenceModal={() => setIncomeRecurrenceModalOpen(true)}
          />
        );
      case 'orcamento':
        return <BudgetView />;
      case 'dividas':
        return <DebtsView onOpenDebtModal={openDebtModal} />;
      case 'metas':
        return <GoalsView />;
      case 'metas-financeiras':
        return <FinancialGoalsView />;
      case 'planilha':
        return <SpreadsheetView />;
      case 'parceiro':
        return <PartnerView onOpenInviteModal={() => setInviteModalOpen(true)} />;
      case 'configuracoes':
        return <SettingsView />;
      default:
        return (
          <DashboardView
            onOpenExpenseModal={() => setExpenseModalOpen(true)}
            onOpenIncomeModal={() => setIncomeModalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FF] dark:bg-slate-950 font-sans text-[#1A1A2E] dark:text-slate-100 antialiased flex transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(prev => !prev)}
      />

      {/* Main Content Area */}
      <div className={`flex-1 ${collapsed ? 'lg:pl-20' : 'lg:pl-72'} flex flex-col min-w-0 transition-all duration-300 ease-in-out`}>
        <Header
          setMobileOpen={setMobileOpen}
          onOpenExpenseModal={() => setExpenseModalOpen(true)}
          onOpenIncomeModal={() => setIncomeModalOpen(true)}
        />

        <main className="flex-1 px-4 lg:px-8 py-6 max-w-7xl mx-auto w-full">
          {/* key por aba: sem isso, uma falha ao abrir a Planilha mantinha o
              aviso de erro no lugar mesmo depois de clicar em outra aba. */}
          <FronteiraDeCarregamento key={activeTab}>
            <Suspense fallback={<CarregandoTela />}>
              {renderActiveTab()}
            </Suspense>
          </FronteiraDeCarregamento>
        </main>
      </div>

      {/* Modais. A montagem condicional é o que faz o code-splitting valer:
          montado sempre, o lazy baixaria o arquivo mesmo com o modal fechado.
          Fronteira própria: eram cinco pontos de import() fora de qualquer
          boundary, e um chunk 404 ali apagava o app inteiro. Separada da das
          telas de propósito, para a falha de um modal não derrubar a view. */}
      <FronteiraDeCarregamento variante="modal" onDispensar={fecharModais}>
        <Suspense fallback={<CarregandoModal />}>
          {expenseModalOpen && (
            <ExpenseModal isOpen onClose={() => setExpenseModalOpen(false)} />
          )}
          {incomeModalOpen && (
            <IncomeModal isOpen onClose={() => setIncomeModalOpen(false)} />
          )}
          {incomeRecurrenceModalOpen && (
            <IncomeRecurrenceModal isOpen onClose={() => setIncomeRecurrenceModalOpen(false)} />
          )}
          {inviteModalOpen && (
            <PartnerInviteModal isOpen onClose={() => setInviteModalOpen(false)} />
          )}
          {debtModalOpen && (
            <DebtModal isOpen onClose={() => setDebtModalOpen(false)} initialDebt={debtToEdit} />
          )}
        </Suspense>
      </FronteiraDeCarregamento>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
      {/* Fora do MainLayout: AuthView retorna cedo, e os toasts de login precisam aparecer. */}
      <ToastContainer />
    </AppProvider>
  );
}
