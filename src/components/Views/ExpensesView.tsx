import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateBR, getCategoryColor } from '../../utils/formatters';
import { ExpenseCategory, Expense } from '../../types';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  TrendingDown,
  Calendar,
  User as UserIcon,
  Tag
} from 'lucide-react';

interface ExpensesViewProps {
  onOpenExpenseModal: (expenseToEdit?: Expense) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ onOpenExpenseModal }) => {
  const { expenses, users, currentUser, partner, deleteExpense, toggleExpensePaid, getHouseholdUserIds } = useApp();
  const householdIds = getHouseholdUserIds();
  const pairUsers = [currentUser, partner].filter((u): u is NonNullable<typeof u> => Boolean(u));

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPayer, setSelectedPayer] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const categories: ExpenseCategory[] = [
    'Moradia',
    'Família',
    'Assinaturas/Serviços',
    'Cartões/Dívidas',
    'Pessoal/Saúde',
    'Alimentação',
    'Outros'
  ];

  const filteredExpenses = expenses
    .filter(item => householdIds.includes(item.registradoPor))
    .filter(exp => {
    const matchesSearch = exp.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.observacao && exp.observacao.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || exp.categoria === selectedCategory;
    const matchesPayer = selectedPayer === 'all' || exp.registradoPor === selectedPayer;
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'pago' && exp.pago) || 
      (selectedStatus === 'pendente' && !exp.pago);

    return matchesSearch && matchesCategory && matchesPayer && matchesStatus;
  });

  const totalFiltered = filteredExpenses.reduce((acc, curr) => acc + curr.valor, 0);
  const paidFiltered = filteredExpenses.filter(e => e.pago).reduce((acc, curr) => acc + curr.valor, 0);
  const pendingFiltered = totalFiltered - paidFiltered;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bento-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Total em Despesas</p>
            <h3 className="text-2xl font-extrabold text-rose-600">{formatCurrency(totalFiltered)}</h3>
            <p className="text-[11px] text-slate-400 mt-1">{filteredExpenses.length} lançamentos encontrados</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="bento-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Já Pagas</p>
            <h3 className="text-2xl font-extrabold text-emerald-600">{formatCurrency(paidFiltered)}</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              {filteredExpenses.filter(e => e.pago).length} contas quitadas
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bento-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Pendentes no Mês</p>
            <h3 className="text-2xl font-extrabold text-amber-600">{formatCurrency(pendingFiltered)}</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              {filteredExpenses.filter(e => !e.pago).length} aguardando pagamento
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Action Toolbar */}
      <div className="bento-card p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar despesa ou nota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="campo-form w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="campo-form px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="all">Todas Categorias</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Payer Filter */}
          <select
            value={selectedPayer}
            onChange={(e) => setSelectedPayer(e.target.value)}
            className="campo-form px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="all">Quem Pagou (Todos)</option>
            {pairUsers.map(u => (
              <option key={u.id} value={u.id}>{u.id === currentUser.id ? `${u.nome} (Você)` : u.nome}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="campo-form px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="all">Todos Status</option>
            <option value="pago">Apenas Pagas</option>
            <option value="pendente">Apenas Pendentes</option>
          </select>

          {/* Add Expense Button */}
          <button
            onClick={() => onOpenExpenseModal()}
            className="px-4 py-2 bg-gradient-duo text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-500/20 hover:opacity-95 transition-all ml-auto md:ml-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Despesa</span>
          </button>
        </div>
      </div>

      {/* Expense List Table */}
      <div className="bento-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Histórico Detalhado de Gastos</h3>
          <span className="text-xs text-slate-500">Exibindo {filteredExpenses.length} registros</span>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <Filter className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-bold text-sm">Nenhuma despesa encontrada</p>
            <p className="text-xs text-slate-400 mt-1">Tente ajustar seus filtros ou cadastre um novo lançamento.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Registrado por</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map(exp => {
                  const catStyle = getCategoryColor(exp.categoria);
                  const payer = users.find(u => u.id === exp.registradoPor);

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500 font-mono whitespace-nowrap">
                        {formatDateBR(exp.data)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {exp.descricao}
                        {exp.observacao && (
                          <span className="block text-[11px] text-slate-400 font-normal mt-0.5">
                            {exp.observacao}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
                          {exp.categoria}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {payer && (
                            <img src={payer.avatar} alt={payer.nome} className="w-6 h-6 rounded-full object-cover" />
                          )}
                          <span className="text-slate-700 font-medium">
                            {payer ? payer.nome : 'Desconhecido'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 whitespace-nowrap text-sm">
                        {formatCurrency(exp.valor)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => toggleExpensePaid(exp.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            exp.pago
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                          }`}
                        >
                          {exp.pago ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Paga</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Pendente</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenExpenseModal(exp)}
                            title="Editar"
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteExpense(exp.id)}
                            title="Excluir"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
