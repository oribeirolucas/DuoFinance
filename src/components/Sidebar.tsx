import React from 'react';
import { useApp } from '../context/AppContext';
import { NavigationTab } from '../types';
import {
  LayoutDashboard,
  ArrowUpDown,
  TrendingDown,
  TrendingUp,
  PieChart,
  AlertTriangle,
  Target,
  Rocket,
  FileSpreadsheet,
  Heart,
  LogOut,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  setMobileOpen,
  collapsed,
  onToggleCollapse
}) => {
  const { activeTab, setActiveTab, currentUser, partner, setCurrentUserId, logout, partnership } = useApp();

  const menuItems: { id: NavigationTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'comparacao', label: 'Comparação', icon: ArrowUpDown },
    { id: 'despesas', label: 'Despesas', icon: TrendingDown },
    { id: 'receitas', label: 'Receitas', icon: TrendingUp },
    { id: 'orcamento', label: 'Orçamento', icon: PieChart },
    { id: 'dividas', label: 'Dívidas', icon: AlertTriangle },
    { id: 'metas', label: 'Metas', icon: Target },
    { id: 'metas-financeiras', label: 'Metas Financeiras', icon: Rocket },
    { id: 'planilha', label: 'Planilha', icon: FileSpreadsheet },
    { id: 'parceiro', label: 'Meu Parceiro(a)', icon: Heart },
  ];

  const handleTabClick = (tab: NavigationTab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 ${
          collapsed ? 'lg:w-20' : 'lg:w-72'
        } bg-white dark:bg-slate-900 border-r border-[#E5E7EB] dark:border-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Toggle Collapse Button (Desktop Only) */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          className="hidden lg:flex absolute -right-3.5 top-6 z-50 w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full items-center justify-center text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 shadow-md transition-all hover:scale-110 active:scale-95 cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Top Brand Header */}
        <div className={`p-6 border-b border-[#E5E7EB] dark:border-slate-800 ${collapsed ? 'lg:px-3' : ''}`}>
          <div className={`flex items-center ${collapsed ? 'lg:justify-center' : 'justify-between'}`}>
            <div className={`flex items-center gap-3 ${collapsed ? 'lg:justify-center' : ''}`}>
              <div className="w-10 h-10 rounded-xl bg-gradient-duo flex items-center justify-center text-white shadow-md shadow-purple-500/20 shrink-0">
                <Heart className="w-5 h-5 fill-white" />
              </div>
              <div className={collapsed ? 'lg:hidden' : 'block'}>
                <h1 className="font-bold text-xl tracking-tight text-gradient-duo">Duo Finance</h1>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 italic">Dois sonhos. Um só planejamento.</p>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Partnership Badge */}
          <div className="mt-4">
            {partnership.status === 'active' && partner ? (
              <div
                onClick={() => handleTabClick('parceiro')}
                title="Parceria Ativa 💜"
                className={`cursor-pointer bg-gradient-duo-subtle border border-purple-200/80 dark:border-purple-800/50 rounded-xl p-2.5 flex items-center justify-between hover:border-purple-300 dark:hover:border-purple-600 transition-colors ${
                  collapsed ? 'lg:justify-center lg:px-0' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#43D19E] animate-pulse shrink-0" />
                  <span className={`text-xs font-semibold text-purple-900 dark:text-purple-200 ${collapsed ? 'lg:hidden' : 'block'}`}>
                    Parceria Ativa 💜
                  </span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 text-purple-500 dark:text-purple-300 ${collapsed ? 'lg:hidden' : 'block'}`} />
              </div>
            ) : (
              <div
                onClick={() => handleTabClick('parceiro')}
                title="Convidar Parceiro(a)"
                className={`cursor-pointer bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-2.5 flex items-center justify-between hover:bg-amber-100/80 dark:hover:bg-amber-900/40 transition-colors ${
                  collapsed ? 'lg:justify-center lg:px-0' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className={`text-xs font-semibold text-amber-900 dark:text-amber-200 ${collapsed ? 'lg:hidden' : 'block'}`}>
                    Convidar Parceiro(a)
                  </span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 text-amber-600 dark:text-amber-400 ${collapsed ? 'lg:hidden' : 'block'}`} />
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <div className={`flex-1 overflow-y-auto px-4 py-4 space-y-1 ${collapsed ? 'lg:px-2' : ''}`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                title={item.label}
                aria-label={item.label}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 relative ${
                  isActive
                    ? 'bg-gradient-duo text-white shadow-md shadow-purple-500/20 font-semibold'
                    : 'text-[#6B7280] dark:text-slate-400 hover:text-[#1A1A2E] dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-slate-800'
                } ${collapsed ? 'lg:px-0 lg:justify-center' : ''}`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-gray-400 dark:text-slate-500'}`} />
                <span className={`flex-1 text-left truncate ${collapsed ? 'lg:hidden' : 'block'}`}>{item.label}</span>
                {item.id === 'parceiro' && partnership.status === 'pending' && (
                  <span
                    className={`w-2 h-2 rounded-full bg-amber-500 ${
                      collapsed ? 'lg:absolute lg:top-2 lg:right-2' : ''
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Profile & Switcher Footer */}
        <div className={`p-4 border-t border-[#E5E7EB] dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 space-y-3 ${collapsed ? 'lg:px-2' : ''}`}>
          {/* Active User Card */}
          <div
            className={`flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-[#E5E7EB] dark:border-slate-700 shadow-2xs ${
              collapsed ? 'lg:flex-col lg:justify-center lg:gap-2' : ''
            }`}
          >
            <div className={`flex items-center gap-2.5 overflow-hidden ${collapsed ? 'lg:justify-center' : ''}`}>
              <img
                src={currentUser.avatar}
                alt={currentUser.nome}
                title={`Logado como ${currentUser.nome} (${currentUser.email})`}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-[#6C63FF]/30 shrink-0"
              />
              <div className={`truncate ${collapsed ? 'lg:hidden' : 'block'}`}>
                <p className="text-xs font-bold text-[#1A1A2E] dark:text-slate-100 truncate">{currentUser.nome}</p>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate">{currentUser.email}</p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sair"
              aria-label="Sair"
              className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Partner Switcher Demo button */}
          {partner && (
            <button
              onClick={() => setCurrentUserId(partner.id)}
              title={`Alternar visão para ${partner.nome.split(' ')[0]}`}
              aria-label={`Alternar visão para ${partner.nome.split(' ')[0]}`}
              className={`w-full text-xs py-2 px-3 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100/80 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-300 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                collapsed ? 'lg:px-0' : ''
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span className={collapsed ? 'lg:hidden' : 'block'}>
                Alternar visão para {partner.nome.split(' ')[0]}
              </span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
