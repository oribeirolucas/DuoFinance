import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AuthView } from './components/Auth/AuthView';

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

const MainLayout: React.FC = () => {
  const { isAuthenticated, activeTab } = useApp();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('duo_finance_sidebar_collapsed') === 'true';
  });
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [incomeRecurrenceModalOpen, setIncomeRecurrenceModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('duo_finance_sidebar_collapsed', String(collapsed));
  }, [collapsed]);

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
        return <DebtsView onOpenExpenseModal={() => setExpenseModalOpen(true)} />;
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
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
