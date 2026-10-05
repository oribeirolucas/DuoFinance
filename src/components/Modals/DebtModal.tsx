import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Debt } from '../../types';
import { X, AlertTriangle, DollarSign, Calendar, Percent } from 'lucide-react';

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDebt?: Debt | null;
}

export const DebtModal: React.FC<DebtModalProps> = ({ isOpen, onClose, initialDebt }) => {
  const { addDebt, updateDebt, currentUser } = useApp();

  const [nome, setNome] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [valorPago, setValorPago] = useState('');
  const [juros, setJuros] = useState('12.0');
  const [parcelas, setParcelas] = useState('1/12');
  const [dono, setDono] = useState<'individual' | 'casal'>('casal');
  const [vencimento, setVencimento] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (initialDebt) {
      setNome(initialDebt.nome);
      setValorTotal(initialDebt.valorTotal.toString());
      setValorPago(initialDebt.valorPago.toString());
      setJuros(initialDebt.juros.toString());
      setParcelas(initialDebt.parcelas);
      setDono(initialDebt.dono);
      setVencimento(initialDebt.vencimento);
    } else {
      setNome('');
      setValorTotal('');
      setValorPago('0');
      setJuros('12.0');
      setParcelas('1/12');
      setDono('casal');
      setVencimento(new Date().toISOString().split('T')[0]);
    }
  }, [initialDebt, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numTotal = parseFloat(valorTotal.replace(',', '.'));
    const numPago = parseFloat(valorPago.replace(',', '.'));
    const numJuros = parseFloat(juros.replace(',', '.'));

    if (!nome.trim() || isNaN(numTotal) || numTotal <= 0) return;
    // A tela de dívidas divide valorTotal pelo denominador para achar a parcela.
    // Sem o formato N/M, o total colapsaria para 1 e um clique quitaria tudo.
    if (!/^\d+\s*\/\s*\d+$/.test(parcelas.trim())) return;
    // O banco recusa valor_pago acima do total (debts_pago_nao_excede_total).
    // Barrar aqui também evita que o usuário veja o erro cru do Postgres.
    if (!isNaN(numPago) && numPago > numTotal) return;

    if (initialDebt) {
      updateDebt(initialDebt.id, {
        nome,
        valorTotal: numTotal,
        valorPago: isNaN(numPago) ? 0 : numPago,
        juros: isNaN(numJuros) ? 0 : numJuros,
        parcelas,
        dono,
        vencimento
      });
    } else {
      addDebt({
        nome,
        valorTotal: numTotal,
        valorPago: isNaN(numPago) ? 0 : numPago,
        juros: isNaN(numJuros) ? 0 : numJuros,
        parcelas,
        dono,
        registradoPor: currentUser.id,
        vencimento
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {initialDebt ? 'Editar Dívida' : 'Cadastrar Dívida'}
              </h2>
              <p className="text-xs text-slate-500">Acompanhe e quite pendências financeiras</p>
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
              Nome da dívida / financiamento *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Financiamento HB20, Cartão Nubank"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                placeholder="0,00"
                value={valorTotal}
                onChange={(e) => setValorTotal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Já Pago (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={valorPago}
                onChange={(e) => setValorPago(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-slate-400" /> Taxa de Juros (% a.a.)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="12.0"
                value={juros}
                onChange={(e) => setJuros(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Parcelamento (pagas/total) *
              </label>
              <input
                type="text"
                required
                pattern="\d+\s*/\s*\d+"
                title="Use o formato pagas/total, por exemplo 12/24"
                placeholder="12/24"
                value={parcelas}
                onChange={(e) => setParcelas(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Abrangência da dívida
              </label>
              <select
                value={dono}
                onChange={(e) => setDono(e.target.value as 'individual' | 'casal')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              >
                <option value="casal">Conjunta do Casal</option>
                <option value="individual">Individual</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Próx. Vencimento
              </label>
              <input
                type="date"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
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
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-600/20"
            >
              {initialDebt ? 'Salvar Alterações' : 'Cadastrar Dívida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
