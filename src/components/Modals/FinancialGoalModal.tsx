import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { FinancialGoal } from '../../types';
import { X, Rocket, DollarSign, Calendar, Flag } from 'lucide-react';

interface FinancialGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGoal?: FinancialGoal | null;
}

export const FinancialGoalModal: React.FC<FinancialGoalModalProps> = ({ isOpen, onClose, initialGoal }) => {
  const { addFinancialGoal, updateFinancialGoal } = useApp();

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valorAlvo, setValorAlvo] = useState('');
  const [categoria, setCategoria] = useState<'casa' | 'carro' | 'viagem' | 'aposentadoria' | 'outros'>('casa');
  const [prazo, setPrazo] = useState('2027-12-31');
  const [prioridade, setPrioridade] = useState<'alta' | 'media' | 'baixa'>('alta');
  const [metaMensal, setMetaMensal] = useState('');

  useEffect(() => {
    if (initialGoal) {
      setNome(initialGoal.nome);
      setDescricao(initialGoal.descricao);
      setValorAlvo(initialGoal.valorAlvo.toString());
      setCategoria(initialGoal.categoria);
      setPrazo(initialGoal.prazo);
      setPrioridade(initialGoal.prioridade);
      setMetaMensal(initialGoal.metaMensal.toString());
    } else {
      setNome('');
      setDescricao('');
      setValorAlvo('');
      setCategoria('casa');
      setPrazo('2027-12-31');
      setPrioridade('alta');
      setMetaMensal('');
    }
  }, [initialGoal, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAlvo = parseFloat(valorAlvo.replace(',', '.'));
    const numMensal = parseFloat(metaMensal.replace(',', '.')) || (numAlvo ? Math.round(numAlvo / 24) : 0);

    if (!nome.trim() || isNaN(numAlvo) || numAlvo <= 0) return;

    if (initialGoal) {
      updateFinancialGoal(initialGoal.id, {
        nome,
        descricao,
        valorAlvo: numAlvo,
        categoria,
        prazo,
        prioridade,
        metaMensal: numMensal
      });
    } else {
      addFinancialGoal({
        nome,
        descricao,
        valorAlvo: numAlvo,
        categoria,
        prazo,
        prioridade,
        metaMensal: numMensal
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Rocket className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {initialGoal ? 'Editar Objetivo de Longo Prazo' : 'Novo Objetivo de Longo Prazo'}
              </h2>
              <p className="text-xs text-slate-500">Projete grandes conquistas para o futuro do casal</p>
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
              Nome do objetivo / sonho *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Entrada do Apê, Viagem Itália 2027, SUV Híbrido"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descrição do objetivo
            </label>
            <input
              type="text"
              placeholder="Ex: Apê de 3 quartos com varanda na Zona Sul"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Valor Total (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="100.000,00"
                value={valorAlvo}
                onChange={(e) => setValorAlvo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Aporte Mensal Recomendado (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="2.500,00"
                value={metaMensal}
                onChange={(e) => setMetaMensal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as any)}
                className="w-full px-2.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="casa">🏠 Casa</option>
                <option value="viagem">✈️ Viagem</option>
                <option value="carro">🚗 Carro</option>
                <option value="aposentadoria">📈 Aposentadoria</option>
                <option value="outros">🌟 Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Prazo
              </label>
              <input
                type="date"
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
                className="w-full px-2 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Flag className="w-3.5 h-3.5 text-slate-400" /> Prioridade
              </label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as any)}
                className="w-full px-2 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="alta">🔴 Alta</option>
                <option value="media">🟡 Média</option>
                <option value="baixa">🟢 Baixa</option>
              </select>
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
              {initialGoal ? 'Salvar Alterações' : 'Criar Objetivo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
