import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateBR } from '../../utils/formatters';
import { FinancialGoal } from '../../types';
import {
  Compass,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Home,
  Car,
  Plane,
  Heart,
  Briefcase,
  Calendar,
  Sparkles,
  X
} from 'lucide-react';

export const FinancialGoalsView: React.FC = () => {
  const {
    financialGoals: rawFinancialGoals,
    deleteFinancialGoal,
    addFinancialGoal,
    updateFinancialGoal,
    getHouseholdUserIds
  } = useApp();

  const householdIds = getHouseholdUserIds();
  const financialGoals = rawFinancialGoals.filter(g => !g.donoId || householdIds.includes(g.donoId));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valorAlvo, setValorAlvo] = useState('');
  const [valorAtual, setValorAtual] = useState('');
  const [categoria, setCategoria] = useState<'casa' | 'carro' | 'viagem' | 'aposentadoria' | 'outros'>('casa');
  const [prazo, setPrazo] = useState('2027-12-31');
  const [prioridade, setPrioridade] = useState<'alta' | 'media' | 'baixa'>('media');
  const [metaMensal, setMetaMensal] = useState('');

  // Contribution state
  const [contributingGoal, setContributingGoal] = useState<FinancialGoal | null>(null);
  const [contributionValue, setContributionValue] = useState('');

  const handleOpenAddModal = (goalToEdit?: FinancialGoal) => {
    if (goalToEdit) {
      setEditingGoal(goalToEdit);
      setNome(goalToEdit.nome);
      setDescricao(goalToEdit.descricao || '');
      setValorAlvo(goalToEdit.valorAlvo.toString());
      setValorAtual(goalToEdit.valorAtual.toString());
      setCategoria(goalToEdit.categoria);
      setPrazo(goalToEdit.prazo);
      setPrioridade(goalToEdit.prioridade);
      setMetaMensal(goalToEdit.metaMensal.toString());
    } else {
      setEditingGoal(null);
      setNome('');
      setDescricao('');
      setValorAlvo('');
      setValorAtual('0');
      setCategoria('casa');
      setPrazo('2027-12-31');
      setPrioridade('media');
      setMetaMensal('500');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !valorAlvo) return;

    const targetVal = Number(valorAlvo);
    const currVal = Number(valorAtual) || 0;

    if (editingGoal) {
      updateFinancialGoal(editingGoal.id, {
        ...editingGoal,
        nome,
        descricao,
        valorAlvo: targetVal,
        valorAtual: currVal,
        categoria,
        prazo,
        prioridade,
        metaMensal: Number(metaMensal) || 0,
        status: currVal >= targetVal ? 'concluida' : 'em_andamento'
      });
    } else {
      addFinancialGoal({
        nome,
        descricao,
        valorAlvo: targetVal,
        valorAtual: currVal,
        categoria,
        prazo,
        prioridade,
        metaMensal: Number(metaMensal) || 0,
        status: currVal >= targetVal ? 'concluida' : 'em_andamento'
      });
    }

    setIsModalOpen(false);
  };

  const handleAddContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributingGoal || !contributionValue) return;

    const addition = Number(contributionValue);
    const newCurrent = contributingGoal.valorAtual + addition;

    updateFinancialGoal(contributingGoal.id, {
      ...contributingGoal,
      valorAtual: newCurrent,
      status: newCurrent >= contributingGoal.valorAlvo ? 'concluida' : 'em_andamento'
    });

    setContributingGoal(null);
    setContributionValue('');
  };

  const totalTarget = financialGoals.reduce((acc, curr) => acc + curr.valorAlvo, 0);
  const totalCurrent = financialGoals.reduce((acc, curr) => acc + curr.valorAtual, 0);
  const totalRemaining = Math.max(0, totalTarget - totalCurrent);
  const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'casa':
        return <Home className="w-5 h-5 text-indigo-600" />;
      case 'carro':
        return <Car className="w-5 h-5 text-blue-600" />;
      case 'viagem':
        return <Plane className="w-5 h-5 text-amber-600" />;
      case 'aposentadoria':
        return <Briefcase className="w-5 h-5 text-purple-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-emerald-600" />;
    }
  };

  const getPriorityBadge = (prio: 'baixa' | 'media' | 'alta') => {
    switch (prio) {
      case 'alta':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Alta Prioridade</span>;
      case 'media':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Média Prioridade</span>;
      case 'baixa':
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200">Baixa Prioridade</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Top Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bento-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Patrimônio Conquistado</p>
            <h3 className="text-2xl font-extrabold text-emerald-600">{formatCurrency(totalCurrent)}</h3>
            <p className="text-[11px] text-slate-400 mt-1">{overallProgress.toFixed(1)}% do acumulado total</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="bento-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Alvo dos Grandes Sonhos</p>
            <h3 className="text-2xl font-extrabold text-purple-900">{formatCurrency(totalTarget)}</h3>
            <p className="text-[11px] text-slate-400 mt-1">{financialGoals.length} projetos de vida em andamento</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Compass className="w-6 h-6" />
          </div>
        </div>

        <div className="bento-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Falta para Realizar</p>
            <h3 className="text-2xl font-extrabold text-indigo-600">{formatCurrency(totalRemaining)}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Aporte acumulado restante</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Action Bar Header */}
      <div className="bento-card p-5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Grandes Objetivos & Sonhos de Longo Prazo</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Planeje casa própria, veículo, viagens internacionais e independência financeira do casal
          </p>
        </div>

        <button
          onClick={() => handleOpenAddModal()}
          className="px-4 py-2 bg-gradient-duo text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-500/20 hover:opacity-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Sonho</span>
        </button>
      </div>

      {/* Long Term Goals Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {financialGoals.length === 0 ? (
          <div className="col-span-2 bento-card p-12 text-center">
            <Compass className="w-12 h-12 text-purple-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">Nenhum grande objetivo registrado</h3>
            <p className="text-xs text-slate-500 mt-1">Cadastre o primeiro grande projeto financeiro do casal.</p>
          </div>
        ) : (
          financialGoals.map(goal => {
            const isCompleted = goal.valorAtual >= goal.valorAlvo;
            const progress = goal.valorAlvo > 0 ? (goal.valorAtual / goal.valorAlvo) * 100 : 100;

            return (
              <div
                key={goal.id}
                className={`bento-card p-6 flex flex-col justify-between transition-all ${
                  isCompleted
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'hover:border-purple-300'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0">
                        {getCategoryIcon(goal.categoria)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{goal.nome}</h3>
                          {getPriorityBadge(goal.prioridade)}
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          Meta para: <span className="font-bold text-slate-700">{formatDateBR(goal.prazo)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenAddModal(goal)}
                        className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteFinancialGoal(goal.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {goal.descricao && (
                    <p className="text-xs text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {goal.descricao}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="my-4">
                    <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                      <span className="text-slate-600">Progresso de Realização</span>
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
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Acumulado Hoje</p>
                      <p className="text-base font-extrabold text-emerald-600">
                        {formatCurrency(goal.valorAtual)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Valor do Sonho</p>
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
                    <span>Aportar para este Sonho</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Goal Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingGoal ? 'Editar Sonho' : 'Cadastrar Sonho de Longo Prazo'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título do Sonho *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Entrada do Apartamento"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="campo-form w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Valor Alvo (R$) *</label>
                  <input
                    type="number"
                    required
                    placeholder="120000"
                    value={valorAlvo}
                    onChange={(e) => setValorAlvo(e.target.value)}
                    className="campo-form w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Acumulado Atual (R$)</label>
                  <input
                    type="number"
                    placeholder="25000"
                    value={valorAtual}
                    onChange={(e) => setValorAtual(e.target.value)}
                    className="campo-form w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as any)}
                    className="campo-form w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="casa">Imóvel / Casa</option>
                    <option value="carro">Veículo / Carro</option>
                    <option value="viagem">Viagem Internacional</option>
                    <option value="aposentadoria">Aposentadoria</option>
                    <option value="outros">Outros Projetos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prioridade</label>
                  <select
                    value={prioridade}
                    onChange={(e) => setPrioridade(e.target.value as any)}
                    className="campo-form w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Data Alvo / Prazo</label>
                <input
                  type="date"
                  value={prazo}
                  onChange={(e) => setPrazo(e.target.value)}
                  className="campo-form w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição / Detalhes</label>
                <textarea
                  placeholder="Ex: Fundo para dar 20% de entrada na casa própria em 2028"
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
                Salvar Sonho
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Quick Deposit Modal */}
      {contributingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Novo Aporte: {contributingGoal.nome}</h3>
              <button onClick={() => setContributingGoal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddContribution} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Valor do Depósito (R$)</label>
                <input
                  type="number"
                  required
                  placeholder="500"
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
