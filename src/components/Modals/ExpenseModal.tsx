import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ExpenseCategory, Expense } from '../../types';
import { X, Check, DollarSign, Calendar, Tag, User as UserIcon } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialExpense?: Expense | null;
}

const CATEGORIES: ExpenseCategory[] = [
  'Moradia',
  'Família',
  'Assinaturas/Serviços',
  'Cartões/Dívidas',
  'Pessoal/Saúde',
  'Alimentação',
  'Outros'
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose, initialExpense }) => {
  const { addExpense, updateExpense, currentUser, partner } = useApp();

  const selectableUsers = [currentUser, partner].filter(Boolean);

  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState<ExpenseCategory>('Alimentação');
  const [pago, setPago] = useState(true);
  const [registradoPor, setRegistradoPor] = useState(currentUser.id);
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    if (initialExpense) {
      setDescricao(initialExpense.descricao);
      setValor(initialExpense.valor.toString());
      setCategoria(initialExpense.categoria);
      setPago(initialExpense.pago);
      setRegistradoPor(initialExpense.registradoPor);
      setData(initialExpense.data);
      setObservacao(initialExpense.observacao || '');
    } else {
      setDescricao('');
      setValor('');
      setCategoria('Alimentação');
      setPago(true);
      setRegistradoPor(currentUser.id);
      setData(new Date().toISOString().split('T')[0]);
      setObservacao('');
    }
  }, [initialExpense, isOpen, currentUser.id]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numValor = parseFloat(valor.replace(',', '.'));
    if (!descricao.trim() || isNaN(numValor) || numValor <= 0) return;

    if (initialExpense) {
      updateExpense(initialExpense.id, {
        descricao,
        valor: numValor,
        categoria,
        pago,
        registradoPor,
        data,
        observacao
      });
    } else {
      addExpense({
        descricao,
        valor: numValor,
        categoria,
        pago,
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
              {initialExpense ? 'Editar Despesa' : 'Nova Despesa do Casal'}
            </h2>
            <p className="text-xs text-slate-500">Registre os gastos para manter o controle em dia</p>
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
              Descrição da despesa *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Supermercado, Aluguel, Netflix"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-800"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" /> Categoria *
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as ExpenseCategory)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Quem pagou */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" /> Quem pagou / registrou? *
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
                        ? 'border-purple-500 bg-purple-50 text-purple-900 font-bold ring-2 ring-purple-200'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <img src={usr.avatar} alt={displayName} className="w-6 h-6 rounded-full object-cover" />
                    <span className="truncate">{displayName}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-purple-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Pago */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <input
              type="checkbox"
              id="pago-check"
              checked={pago}
              onChange={(e) => setPago(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-slate-300"
            />
            <label htmlFor="pago-check" className="text-xs font-medium text-slate-700 cursor-pointer">
              Esta despesa já está paga? <span className="text-slate-400">(caso contrário, entra como pendente)</span>
            </label>
          </div>

          {/* Observação */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observação (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Paguei via PIX no cartão do Banco do Brasil"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              className="px-5 py-2.5 rounded-xl bg-gradient-duo text-white font-semibold text-xs shadow-md shadow-purple-500/20 hover:opacity-95"
            >
              {initialExpense ? 'Salvar Alterações' : 'Cadastrar Despesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
