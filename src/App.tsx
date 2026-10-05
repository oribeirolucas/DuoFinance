import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AuthView } from './components/Auth/AuthView';
import { ToastContainer } from './components/ToastContainer';
import { Debt } from './types';

// Views
import { DashboardView } from './components/Views/DashboardView';
import { ComparisonView } from './components/Views/ComparisonView';
import { ExpensesView } from './components/Views/ExpensesView';
import { IncomesView } from './components/Views/IncomesView';
import { BudgetView } from './components/Views/BudgetView';
import { DebtsView } from './components/Views/DebtsView';
import { GoalsView } from './components/Views/GoalsView';
import { FinancialGoalsView } from './components/Views/FinancialGoalsView';
import { SpreadsheetView } from './components/Views/SpreadsheetView';
import { PartnerView } from './components/Views/PartnerView';

// Modals
import { ExpenseModal } from './components/Modals/ExpenseModal';
import { IncomeModal } from './components/Modals/IncomeModal';
import { IncomeRecurrenceModal } from './components/Modals/IncomeRecurrenceModal';
import { PartnerInviteModal } from './components/Modals/PartnerInviteModal';
import { DebtModal } from './components/Modals/DebtModal';

const MainLayout: React.FC = () => {
  const { isAuthenticated, authLoading, activeTab } = useApp();

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
          {renderActiveTab()}
        </main>
      </div>

      {/* Action Modals */}
      <ExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
      />

      <IncomeModal
        isOpen={incomeModalOpen}
        onClose={() => setIncomeModalOpen(false)}
      />

      <IncomeRecurrenceModal
        isOpen={incomeRecurrenceModalOpen}
        onClose={() => setIncomeRecurrenceModalOpen(false)}
      />

      <PartnerInviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />

      <DebtModal
        isOpen={debtModalOpen}
        onClose={() => setDebtModalOpen(false)}
        initialDebt={debtToEdit}
      />
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
