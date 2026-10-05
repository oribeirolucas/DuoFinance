import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Income } from '../../types';
import { X, Check, DollarSign, Calendar, TrendingUp, User as UserIcon } from 'lucide-react';

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialIncome?: Income | null;
}

const SOURCES = ['CLT / Trabalho', 'Freelance', 'Investimentos', 'Bônus / Vendas', 'Outros'];
const TIPOS: { value: 'salario' | 'ferias' | 'decimo_terceiro' | 'renda_extra'; label: string }[] = [
  { value: 'renda_extra', label: 'Renda Extra / Geral' },
  { value: 'salario', label: 'Salário' },
  { value: 'ferias', label: 'Férias' },
  { value: 'decimo_terceiro', label: '13º Salário' },
];

export const IncomeModal: React.FC<IncomeModalProps> = ({ isOpen, onClose, initialIncome }) => {
  const { addIncome, updateIncome, currentUser, partner } = useApp();

  const selectableUsers = [currentUser, partner].filter(Boolean);

  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [fonte, setFonte] = useState('CLT / Trabalho');
  const [tipo, setTipo] = useState<'salario' | 'ferias' | 'decimo_terceiro' | 'renda_extra'>('renda_extra');
  const [registradoPor, setRegistradoPor] = useState(currentUser.id);
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    if (initialIncome) {
      setDescricao(initialIncome.descricao);
      setValor(initialIncome.valor.toString());
      setFonte(initialIncome.fonte);
      setTipo(initialIncome.tipo || 'renda_extra');
      setRegistradoPor(initialIncome.registradoPor);
      setData(initialIncome.data);
      setObservacao(initialIncome.observacao || '');
    } else {
      setDescricao('');
      setValor('');
      setFonte('CLT / Trabalho');
      setTipo('renda_extra');
      setRegistradoPor(currentUser.id);
      setData(new Date().toISOString().split('T')[0]);
      setObservacao('');
    }
  }, [initialIncome, isOpen, currentUser.id]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numValor = parseFloat(valor.replace(',', '.'));
    if (!descricao.trim() || isNaN(numValor) || numValor <= 0) return;

    if (initialIncome) {
      updateIncome(initialIncome.id, {
        descricao,
        valor: numValor,
        fonte,
        tipo,
        registradoPor,
        data,
        observacao
      });
    } else {
      addIncome({
        descricao,
        valor: numValor,
        fonte,
        tipo: tipo || 'renda_extra',
        registradoPor,
        data,
        observacao
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {initialIncome ? 'Editar Receita' : 'Nova Receita do Casal'}
            </h2>
            <p className="text-xs text-slate-500">Adicione salários, freelas ou investimentos</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descrição da receita *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Salário Mensal, Freelance Logo"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="campo-form w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Valor & Data */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="campo-form w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Data *
              </label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="campo-form w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Fonte & Tipo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-slate-400" /> Fonte de Renda *
              </label>
              <select
                value={fonte}
                onChange={(e) => setFonte(e.target.value)}
                className="campo-form w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                Tipo
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="campo-form w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quem recebeu */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" /> Quem recebeu? *
            </label>
            <div className={`grid ${selectableUsers.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
              {selectableUsers.map((usr) => {
                const isSelected = registradoPor === usr.id;
                const displayName = usr.id === currentUser.id ? 'Você' : usr.nome.split(' ')[0];
                return (
                  <button
                    key={usr.id}
                    type="button"
                    onClick={() => setRegistradoPor(usr.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-200'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <img src={usr.avatar} alt={displayName} className="w-6 h-6 rounded-full object-cover" />
                    <span className="truncate">{displayName}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Observação */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observação (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Recebido via Pix no Itaú"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="campo-form w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Buttons */}
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
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20"
            >
              {initialIncome ? 'Salvar Alterações' : 'Cadastrar Receita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
