import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MonthlyGoal } from '../../types';
import { X, Target, DollarSign } from 'lucide-react';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGoal?: MonthlyGoal | null;
}

export const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, initialGoal }) => {
  const { addMonthlyGoal, updateMonthlyGoal } = useApp();

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valorAlvo, setValorAlvo] = useState('');
  const [mes, setMes] = useState('Julho/2026');

  useEffect(() => {
    if (initialGoal) {
      setNome(initialGoal.nome);
      setDescricao(initialGoal.descricao);
      setValorAlvo(initialGoal.valorAlvo.toString());
      setMes(initialGoal.mes);
    } else {
      setNome('');
      setDescricao('');
      setValorAlvo('');
      setMes('Julho/2026');
    }
  }, [initialGoal, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAlvo = parseFloat(valorAlvo.replace(',', '.'));
    if (!nome.trim() || isNaN(numAlvo) || numAlvo <= 0) return;

    if (initialGoal) {
      updateMonthlyGoal(initialGoal.id, {
        nome,
        descricao,
        valorAlvo: numAlvo,
        mes
      });
    } else {
      addMonthlyGoal({
        nome,
        descricao,
        valorAlvo: numAlvo,
        mes
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {initialGoal ? 'Editar Meta Mensal' : 'Nova Meta de Economia Mensal'}
              </h2>
              <p className="text-xs text-slate-500">Defina um desafio de poupança para este mês</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome da meta *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Fundo de reserva, Viagem de fim de ano"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="campo-form w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descrição / Detalhes
            </label>
            <input
              type="text"
              placeholder="Ex: Economizar no supermercado e guardar a diferença"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="campo-form w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Meta de Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0,00"
                value={valorAlvo}
                onChange={(e) => setValorAlvo(e.target.value)}
                className="campo-form w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mês / Referência
              </label>
              <input
                type="text"
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="campo-form w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-duo text-white font-semibold text-xs shadow-md shadow-purple-500/20"
            >
              {initialGoal ? 'Salvar Alterações' : 'Criar Meta Mensal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
