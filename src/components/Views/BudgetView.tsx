import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, getCategoryColor } from '../../utils/formatters';
import { ExpenseCategory } from '../../types';
import {
  PieChart,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Edit2,
  Save,
  RotateCcw
} from 'lucide-react';

export const BudgetView: React.FC = () => {
  const { budgets: rawBudgets, expenses: rawExpenses, updateBudget, getHouseholdUserIds } = useApp();

  const householdIds = getHouseholdUserIds();
  const budgets = rawBudgets.filter(b => !b.donoId || householdIds.includes(b.donoId));
  const expenses = rawExpenses.filter(e => householdIds.includes(e.registradoPor));

  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [editLimitValue, setEditLimitValue] = useState<string>('');

  const categories: ExpenseCategory[] = [
    'Moradia',
    'Alimentação',
    'Cartões/Dívidas',
    'Assinaturas/Serviços',
    'Família',
    'Pessoal/Saúde',
    'Outros'
  ];

  // Calculate actual spending per category
  const getCategorySpent = (category: ExpenseCategory): number => {
    return expenses
      .filter(e => e.categoria === category)
      .reduce((acc, curr) => acc + curr.valor, 0);
  };

  const getCategoryLimit = (category: ExpenseCategory): number => {
    const found = budgets.find(b => b.categoria === category);
    return found ? found.limite : 0;
  };

  const handleStartEdit = (category: ExpenseCategory, currentLimit: number) => {
    setEditingCategory(category);
    setEditLimitValue(currentLimit.toString());
  };

  const handleSaveEdit = (category: ExpenseCategory) => {
    const val = parseFloat(editLimitValue);
    if (!isNaN(val) && val >= 0) {
      updateBudget(category, val);
      setEditingCategory(null);
    }
  };

  const totalBudgetLimit = budgets.reduce((acc, curr) => acc + curr.limite, 0);
  const totalSpent = expenses.reduce((acc, curr) => acc + curr.valor, 0);
  const overallPercentage = totalBudgetLimit > 0 ? (totalSpent / totalBudgetLimit) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Top Banner Overview */}
      <div className="bento-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-slate-900">Planejamento de Orçamento Familiar</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Acompanhe os limites de gastos por categoria definidos pelo casal
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 block font-medium">Gasto Total do Mês</span>
            <span className="text-xl font-extrabold text-slate-900">{formatCurrency(totalSpent)}</span>
            <span className="text-xs text-slate-400 block font-medium">
              de {formatCurrency(totalBudgetLimit)} limite total
            </span>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-5">
          <div className="flex justify-between items-center text-xs font-bold mb-2">
            <span className="text-slate-700">Consumo Geral do Teto Orçamentário</span>
            <span className={overallPercentage > 100 ? 'text-rose-600 font-extrabold' : 'text-purple-700 font-extrabold'}>
              {overallPercentage.toFixed(1)}% do orçamento
            </span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallPercentage > 100
                  ? 'bg-rose-500'
                  : overallPercentage > 85
                  ? 'bg-amber-500'
                  : 'bg-gradient-duo'
              }`}
              style={{ width: `${Math.min(overallPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Budget Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map(category => {
          const spent = getCategorySpent(category);
          const limit = getCategoryLimit(category);
          const percent = limit > 0 ? (spent / limit) * 100 : spent > 0 ? 100 : 0;
          const catStyle = getCategoryColor(category);

          let statusText = 'Dentro do limite';
          let statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          let StatusIcon = CheckCircle2;

          if (percent > 100) {
            statusText = 'Excedido!';
            statusBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
            StatusIcon = XCircle;
          } else if (percent > 85) {
            statusText = 'Atenção próximo do limite';
            statusBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
            StatusIcon = AlertTriangle;
          }

          const isEditing = editingCategory === category;

          return (
            <div
              key={category}
              className="bento-card p-5 hover:border-purple-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Category Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                    <span className={`w-2 h-2 rounded-full ${catStyle.dot}`} />
                    {category}
                  </span>

                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadgeClass}`}>
                    <StatusIcon className="w-3 h-3" />
                    <span>{statusText}</span>
                  </span>
                </div>

                {/* Values */}
                <div className="my-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Gasto Atual</p>
                      <p className="text-xl font-extrabold text-slate-900">{formatCurrency(spent)}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Limite Teto</p>
                      {isEditing ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          {/* bg-white explícito: é o único campo dentro de um
                              .bento-card, que escurece no tema escuro. Sem
                              fundo próprio, ficaria escuro no escuro. */}
                          <input
                            type="number"
                            value={editLimitValue}
                            onChange={(e) => setEditLimitValue(e.target.value)}
                            className="campo-form bg-white w-24 px-2 py-1 border border-purple-400 rounded-lg text-xs font-bold focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(category)}
                            className="p-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                            title="Salvar"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 justify-end group">
                          <p className="text-sm font-extrabold text-slate-600">{formatCurrency(limit)}</p>
                          <button
                            onClick={() => handleStartEdit(category, limit)}
                            className="text-slate-300 hover:text-purple-600 p-0.5 transition-colors"
                            title="Ajustar limite"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden my-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      percent > 100
                        ? 'bg-rose-500'
                        : percent > 85
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              </div>

              {/* Footer info */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Disponível:</span>
                <span className={limit - spent < 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                  {limit - spent < 0 ? `- ${formatCurrency(Math.abs(limit - spent))}` : formatCurrency(limit - spent)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
