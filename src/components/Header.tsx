import React from 'react';
import { useApp } from '../context/AppContext';
import { NavigationTab } from '../types';
import {
  Menu,
  Plus,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';

interface HeaderProps {
  setMobileOpen: (open: boolean) => void;
  onOpenExpenseModal: () => void;
  onOpenIncomeModal: () => void;
}

const TAB_TITLES: Record<NavigationTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Visão Geral do Casal',
    subtitle: 'Resumo consolidado das finanças compartilhadas'
  },
  comparacao: {
    title: 'Comparação de Períodos',
    subtitle: 'Análise evolutiva entre meses e trimestres'
  },
  despesas: {
    title: 'Gestão de Despesas',
    subtitle: 'Acompanhe todos os gastos e saiba quem pagou o quê'
  },
  receitas: {
    title: 'Gestão de Receitas',
    subtitle: 'Entradas combinadas e fontes de renda do casal'
  },
  orcamento: {
    title: 'Orçamento do Casal',
    subtitle: 'Limites de gastos por categoria em tempo real'
  },
  dividas: {
    title: 'Controle de Dívidas',
    subtitle: 'Estratégias de quitação acelerada e parcelamentos'
  },
  metas: {
    title: 'Metas Mensais de Economia',
    subtitle: 'Desafios mensais de poupança conjunta'
  },
  'metas-financeiras': {
    title: 'Metas e Sonhos de Longo Prazo',
    subtitle: 'Plano para conquistas maiores (casa, viagens, aposentadoria)'
  },
  planilha: {
    title: 'Visão Tabular / Planilha',
    subtitle: 'Extrato completo filtrável e exportável de movimentações'
  },
  parceiro: {
    title: 'Meu Parceiro(a) & Parceria',
    subtitle: 'Conecte sua conta com seu parceiro(a) e sincronize finanças'
  }
};

export const Header: React.FC<HeaderProps> = ({
  setMobileOpen,
  onOpenExpenseModal,
  onOpenIncomeModal
}) => {
  const { activeTab, currentUser, partner, resetToDefaultData, theme, toggleTheme } = useApp();
  const info = TAB_TITLES[activeTab] || { title: 'Duo Finance', subtitle: '' };

  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  const handleResetDemo = () => {
    if (window.confirm('Isso vai apagar todos os seus dados atuais e restaurar os dados de exemplo. Deseja continuar?')) {
      resetToDefaultData();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 lg:px-8 py-4 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {info.title}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-normal">
              {info.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Quick Action Buttons, Theme Toggle & Demo Control */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
            aria-label="Alternar tema"
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-2xs flex items-center justify-center active:scale-95"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Quick Demo Reset Data */}
          {isDemoMode && (
            <button
              onClick={handleResetDemo}
              title="Restaurar Dados Fictícios de Exemplo"
              className="p-2 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-xl transition-colors text-xs font-medium flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden xl:inline">Restaurar Exemplo</span>
            </button>
          )}

          {/* New Income Button */}
          <button
            onClick={onOpenIncomeModal}
            className="px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-xl font-semibold text-xs md:text-sm flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>+ Receita</span>
          </button>

          {/* New Expense Button */}
          <button
            onClick={onOpenExpenseModal}
            className="px-4 py-2.5 bg-gradient-duo hover:opacity-95 text-white rounded-xl font-semibold text-xs md:text-sm flex items-center gap-2 shadow-md shadow-purple-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nova Despesa</span>
          </button>

          {/* Active Couple Avatars indicator */}
          <div className="hidden sm:flex items-center gap-1 pl-3 border-l border-slate-200 dark:border-slate-800">
            <div className="flex -space-x-2 overflow-hidden">
              <img
                src={currentUser.avatar}
                alt={currentUser.nome}
                title={`Logado como ${currentUser.nome}`}
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover"
              />
              {partner && (
                <img
                  src={partner.avatar}
                  alt={partner.nome}
                  title={`Parceiro(a): ${partner.nome}`}
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-pink-400 object-cover"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
