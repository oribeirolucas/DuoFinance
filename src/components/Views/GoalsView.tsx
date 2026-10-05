import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { MonthlyGoal } from '../../types';
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  PiggyBank,
  Sparkles,
  X
} from 'lucide-react';

export const GoalsView: React.FC = () => {
  const {
    monthlyGoals: rawMonthlyGoals,
    deleteMonthlyGoal,
    addMonthlyGoal,
    updateMonthlyGoal,
    addGoalContribution,
    getHouseholdUserIds
  } = useApp();

  const householdIds = getHouseholdUserIds();
  const monthlyGoals = rawMonthlyGoals.filter(g => !g.donoId || householdIds.includes(g.donoId));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<MonthlyGoal | null>(null);

  // Form state
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valorAlvo, setValorAlvo] = useState('');
  const [mes, setMes] = useState('Julho/2026');

  // Contribution state
  const [contributingGoal, setContributingGoal] = useState<MonthlyGoal | null>(null);
  const [contributionValue, setContributionValue] = useState('');

  const handleOpenModal = (goalToEdit?: MonthlyGoal) => {
    if (goalToEdit) {
      setEditingGoal(goalToEdit);
      setNome(goalToEdit.nome);
      setDescricao(goalToEdit.descricao || '');
      setValorAlvo(goalToEdit.valorAlvo.toString());
      setMes(goalToEdit.mes);
    } else {
      setEditingGoal(null);
      setNome('');
      setDescricao('');
      setValorAlvo('');
      setMes('Julho/2026');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !valorAlvo) return;

    const targetVal = Number(valorAlvo);

    if (editingGoal) {
      updateMonthlyGoal(editingGoal.id, {
        nome,
        descricao,
        valorAlvo: targetVal,
        mes
      });
    } else {
      addMonthlyGoal({
        nome,
        descricao,
        valorAlvo: targetVal,
        mes
      });
    }

    setIsModalOpen(false);
  };

  const handleContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributingGoal || !contributionValue) return;

    const amount = Number(contributionValue);
    if (amount > 0) {
      addGoalContribution(contributingGoal.id, amount);
    }

    setContributingGoal(null);
    setContributionValue('');
  };

  const totalTargetAmount = monthlyGoals.reduce((acc, curr) => acc + curr.valorAlvo, 0);
  const totalCurrentAmount = monthlyGoals.reduce((acc, curr) => acc + curr.valorAtual, 0);
  const totalRemainingAmount = Math.max(0, totalTargetAmount - totalCurrentAmount);
  const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Total Acumulado Guardado</p>
            <h3 className="text-2xl font-extrabold text-emerald-600">{formatCurrency(totalCurrentAmount)}</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              {overallProgress.toFixed(1)}% do objetivo mensal atingido
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <PiggyBank className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Meta Total Almejada</p>
            <h3 className="text-2xl font-extrabold text-purple-900">{formatCurrency(totalTargetAmount)}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Soma das metas cadastradas</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Falta Economizar</p>
            <h3 className="text-2xl font-extrabold text-indigo-600">{formatCurrency(totalRemainingAmount)}</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              {monthlyGoals.filter(g => g.valorAtual >= g.valorAlvo).length} metas concluídas
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Actions Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Economias e Desafios Financeiros do Casal</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Reservas de emergência, caixinhas mensais e fundos de investimento
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-gradient-duo text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-500/20 hover:opacity-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Caixinha / Meta</span>
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {monthlyGoals.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200/80 text-center">
            <Target className="w-12 h-12 text-purple-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">Nenhuma meta mensal cadastrada</h3>
            <p className="text-xs text-slate-500 mt-1">Crie caixinhas de economia para construir patrimônio em conjunto.</p>
          </div>
        ) : (
          monthlyGoals.map(goal => {
            const isCompleted = goal.valorAtual >= goal.valorAlvo;
            const progress = goal.valorAlvo > 0 ? (goal.valorAtual / goal.valorAlvo) * 100 : 100;

            return (
              <div
                key={goal.id}
                className={`bg-white p-6 rounded-2xl border shadow-xs flex flex-col justify-between transition-all ${
                  isCompleted
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-slate-200/80 hover:border-purple-300'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                        <PiggyBank className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{goal.nome}</h3>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Mês: {goal.mes}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenModal(goal)}
                        className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMonthlyGoal(goal.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {goal.descricao && (
                    <p className="text-xs text-slate-500 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {goal.descricao}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="my-4">
                    <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                      <span className="text-slate-600">Progresso</span>
                      <span className={isCompleted ? 'text-emerald-600' : 'text-purple-700'}>
                        {progress.toFixed(1)}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-gradient-duo'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Main Metric Numbers */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 my-3">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Guardado</p>
                      <p className="text-base font-extrabold text-emerald-600">
                        {formatCurrency(goal.valorAtual)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Alvo Final</p>
                      <p className="text-base font-extrabold text-slate-900">
                        {formatCurrency(goal.valorAlvo)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contribution Action */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setContributingGoal(goal);
                      setContributionValue('');
                    }}
                    className="w-full py-2.5 bg-gradient-duo text-white font-bold text-xs rounded-xl shadow-md shadow-purple-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Aporte / Depósito</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingGoal ? 'Editar Meta' : 'Cadastrar Nova Caixinha'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Meta *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reserva de Emergência"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="campo-form w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Valor Alvo (R$) *</label>
                <input
                  type="number"
                  required
                  placeholder="2000"
                  value={valorAlvo}
                  onChange={(e) => setValorAlvo(e.target.value)}
                  className="campo-form w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mês / Período</label>
                <input
                  type="text"
                  placeholder="Julho/2026"
                  value={mes}
                  onChange={(e) => setMes(e.target.value)}
                  className="campo-form w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição</label>
                <textarea
                  placeholder="Objetivo e observações desta economia..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={2}
                  className="campo-form w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-duo text-white font-bold text-xs rounded-xl shadow-md shadow-purple-500/20"
              >
                Salvar Meta
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {contributingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Aporte para: {contributingGoal.nome}</h3>
              <button onClick={() => setContributingGoal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleContribution} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Valor do Depósito (R$)</label>
                <input
                  type="number"
                  required
                  placeholder="250"
                  value={contributionValue}
                  onChange={(e) => setContributionValue(e.target.value)}
                  className="campo-form w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-duo text-white font-bold text-xs rounded-xl shadow-md"
              >
                Confirmar Aporte
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
