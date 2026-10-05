import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateBR, getCategoryColor } from '../../utils/formatters';
import {
  Table,
  Download,
  Search,
  Filter,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  FileSpreadsheet
} from 'lucide-react';

export const SpreadsheetView: React.FC = () => {
  const { expenses: rawExpenses, incomes: rawIncomes, users, currentUser, partner, getHouseholdUserIds } = useApp();
  const householdIds = getHouseholdUserIds();
  const expenses = rawExpenses.filter(e => householdIds.includes(e.registradoPor));
  const incomes = rawIncomes.filter(i => householdIds.includes(i.registradoPor));
  const pairUsers = [currentUser, partner].filter((u): u is NonNullable<typeof u> => Boolean(u));

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'receita' | 'despesa'>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'data' | 'valor' | 'descricao'>('data');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Combine incomes and expenses into unified rows
  const unifiedRows = [
    ...expenses.map(e => ({
      id: `exp-${e.id}`,
      tipo: 'despesa' as const,
      data: e.data,
      descricao: e.descricao,
      categoriaOuFonte: e.categoria,
      registradoPor: e.registradoPor,
      valor: e.valor,
      pago: e.pago,
      raw: e
    })),
    ...incomes.map(i => ({
      id: `inc-${i.id}`,
      tipo: 'receita' as const,
      data: i.data,
      descricao: i.descricao,
      categoriaOuFonte: i.fonte,
      registradoPor: i.registradoPor,
      valor: i.valor,
      pago: true,
      raw: i
    }))
  ];

  // Filtering
  const filteredRows = unifiedRows.filter(row => {
    const matchesSearch = row.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.categoriaOuFonte.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || row.tipo === typeFilter;
    const matchesUser = userFilter === 'all' || row.registradoPor === userFilter;

    return matchesSearch && matchesType && matchesUser;
  });

  // Sorting
  const sortedRows = [...filteredRows].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'data') {
      comparison = a.data.localeCompare(b.data);
    } else if (sortField === 'valor') {
      comparison = a.valor - b.valor;
    } else if (sortField === 'descricao') {
      comparison = a.descricao.localeCompare(b.descricao);
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const toggleSort = (field: 'data' | 'valor' | 'descricao') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // CSV Export feature
  const exportToCSV = () => {
    const headers = ['Tipo', 'Data', 'Descrição', 'Categoria/Fonte', 'Registrado Por', 'Valor (R$)', 'Status'];
    const rows = sortedRows.map(row => {
      const user = users.find(u => u.id === row.registradoPor);
      return [
        row.tipo.toUpperCase(),
        formatDateBR(row.data),
        `"${row.descricao.replace(/"/g, '""')}"`,
        `"${row.categoriaOuFonte}"`,
        user ? user.nome : row.registradoPor,
        row.valor.toFixed(2),
        row.pago ? 'Pago/Recebido' : 'Pendente'
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `duo_finance_extrato_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Planilha Geral de Lançamentos</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Visão unificada em tabela com ordenação, busca e exportação para Excel/CSV
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Planilha (CSV)</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, tag ou fonte..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">Todos os Tipos (Entradas e Saídas)</option>
            <option value="despesa">Apenas Despesas</option>
            <option value="receita">Apenas Receitas</option>
          </select>

          {/* User Filter */}
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">Todos os Usuários</option>
            {pairUsers.map(u => (
              <option key={u.id} value={u.id}>{u.id === currentUser.id ? `${u.nome} (Você)` : u.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Exibindo {sortedRows.length} de {unifiedRows.length} lançamentos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Tipo</th>
                <th
                  onClick={() => toggleSort('data')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Data</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('descricao')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Descrição</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Categoria / Origem</th>
                <th className="py-3 px-4">Pessoa</th>
                <th
                  onClick={() => toggleSort('valor')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Valor</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Nenhum registro encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                sortedRows.map(row => {
                  const isExpense = row.tipo === 'despesa';
                  const user = users.find(u => u.id === row.registradoPor);

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          isExpense ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {isExpense ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                          {isExpense ? 'Despesa' : 'Receita'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {formatDateBR(row.data)}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {row.descricao}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {row.categoriaOuFonte}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {user && <img src={user.avatar} alt={user.nome} className="w-5 h-5 rounded-full object-cover" />}
                          <span className="text-slate-700 font-medium">{user ? user.nome : row.registradoPor}</span>
                        </div>
                      </td>

                      <td className={`py-3.5 px-4 text-right font-extrabold text-sm whitespace-nowrap ${
                        isExpense ? 'text-slate-900' : 'text-emerald-600'
                      }`}>
                        {isExpense ? `- ${formatCurrency(row.valor)}` : `+ ${formatCurrency(row.valor)}`}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {row.pago ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Liquidado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                            <Clock className="w-3.5 h-3.5" /> Pendente
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
