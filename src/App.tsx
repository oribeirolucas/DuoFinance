import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AuthView } from './components/Auth/AuthView';
import { ToastContainer } from './components/ToastContainer';
import { Debt } from './types';

// Views e modais entram sob demanda.
//
// Antes, abrir o app baixava as onze telas e os cinco modais de uma vez,
// inclusive o Recharts inteiro que só o Dashboard e o Comparativo usam. Quem
// entrava para ver o saldo pagava pelo que não ia abrir. Cada lazy() vira um
// arquivo próprio no build, buscado no primeiro uso e cacheado depois.
const DashboardView      = lazy(() => import('./components/Views/DashboardView').then(m => ({ default: m.DashboardView })));
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

/** Placeholder enquanto o arquivo da tela é buscado. Some em milissegundos
 *  na segunda visita, porque o navegador já tem o pedaço em cache. */
const CarregandoTela: React.FC = () => (
  <div className="flex items-center justify-center py-24">
    <div className="w-7 h-7 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin" />
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
          <Suspense fallback={<CarregandoTela />}>
            {renderActiveTab()}
          </Suspense>
        </main>
      </div>

      {/* Modais. A montagem condicional é o que faz o code-splitting valer:
          montado sempre, o lazy baixaria o arquivo mesmo com o modal fechado. */}
      <Suspense fallback={null}>
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
