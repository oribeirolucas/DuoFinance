import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, DollarSign, Sparkles } from 'lucide-react';

interface AddContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalId: string;
  goalTitle: string;
  isLongTerm?: boolean;
}

export const AddContributionModal: React.FC<AddContributionModalProps> = ({
  isOpen,
  onClose,
  goalId,
  goalTitle,
  isLongTerm = false
}) => {
  const { addGoalContribution, addFinancialGoalContribution } = useApp();
  const [amount, setAmount] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount.replace(',', '.'));
    if (isNaN(num) || num <= 0) return;

    if (isLongTerm) {
      addFinancialGoalContribution(goalId, num);
    } else {
      addGoalContribution(goalId, num);
    }
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Registrar Aporte</h2>
              <p className="text-xs text-slate-500 truncate max-w-[200px]">{goalTitle}</p>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Quanto vocês estão depositando hoje? *
            </label>
            <input
              type="number"
              step="0.01"
              required
              autoFocus
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="campo-form w-full px-4 py-3 rounded-xl border border-slate-200 text-lg font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20"
            >
              Confirmar Aporte
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
