import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, getCategoryColor, CATEGORY_HEX_MAP } from '../../utils/formatters';
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Percent,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

export const ComparisonView: React.FC = () => {
  const { expenses: rawExpenses, incomes: rawIncomes, users, currentUser, partner, getHouseholdUserIds } = useApp();
  const householdIds = getHouseholdUserIds();
  const expenses = rawExpenses.filter(e => householdIds.includes(e.registradoPor));
  const incomes = rawIncomes.filter(i => householdIds.includes(i.registradoPor));
  const [timeframe, setTimeframe] = useState<'3m' | '6m' | '1y'>('6m');

  const user1Name = currentUser?.nome ? currentUser.nome.split(' ')[0] : 'Usuário 1';
  const user2Name = partner?.nome ? partner.nome.split(' ')[0] : 'Parceiro';

  // Multi-month comparison dataset simulation
  const monthsData = [
    { mes: 'Mar/26', lucasRenda: 6000, marinaRenda: 5500, despesasTotal: 6800, economia: 4700 },
    { mes: 'Abr/26', lucasRenda: 6200, marinaRenda: 5500, despesasTotal: 7100, economia: 4600 },
    { mes: 'Mai/26', lucasRenda: 6000, marinaRenda: 5800, despesasTotal: 6500, economia: 5300 },
    { mes: 'Jun/26', lucasRenda: 6500, marinaRenda: 5800, despesasTotal: 7200, economia: 5100 },
    { mes: 'Jul/26', lucasRenda: 6500, marinaRenda: 5800, despesasTotal: 6900, economia: 5400 },
    { mes: 'Ago/26 (Atual)', lucasRenda: 6500, marinaRenda: 5800, despesasTotal: 6720, economia: 5580 }
  ];

  const currentMonth = monthsData[monthsData.length - 1];
  const previousMonth = monthsData[monthsData.length - 2];

  const totalCurrentIncome = currentMonth.lucasRenda + currentMonth.marinaRenda;
  const totalPrevIncome = previousMonth.lucasRenda + previousMonth.marinaRenda;

  const incomeDiff = ((totalCurrentIncome - totalPrevIncome) / totalPrevIncome) * 100;
  const expenseDiff = ((currentMonth.despesasTotal - previousMonth.despesasTotal) / previousMonth.despesasTotal) * 100;
  const savingsDiff = ((currentMonth.economia - previousMonth.economia) / previousMonth.economia) * 100;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-slate-900">Comparativo Periódico e Tendências</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Analise a evolução dos gastos, aportes e equilíbrio financeiro ao longo dos meses
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
          <button
            onClick={() => setTimeframe('3m')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeframe === '3m' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Últimos 3 Meses
          </button>
          <button
            onClick={() => setTimeframe('6m')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeframe === '6m' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Últimos 6 Meses
          </button>
          <button
            onClick={() => setTimeframe('1y')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeframe === '1y' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            1 Ano
          </button>
        </div>
      </div>

      {/* Month-over-Month Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Variação da Renda Familiar</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-extrabold text-slate-900">{formatCurrency(totalCurrentIncome)}</h3>
            <span className={`inline-flex items-center text-xs font-bold ${incomeDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {incomeDiff >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(incomeDiff).toFixed(1)}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">em relação ao mês anterior ({formatCurrency(totalPrevIncome)})</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Variação das Despesas</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-extrabold text-slate-900">{formatCurrency(currentMonth.despesasTotal)}</h3>
            <span className={`inline-flex items-center text-xs font-bold ${expenseDiff <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {expenseDiff > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(expenseDiff).toFixed(1)}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">em relação ao mês anterior ({formatCurrency(previousMonth.despesasTotal)})</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Capacidade de Poupança</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-extrabold text-emerald-600">{formatCurrency(currentMonth.economia)}</h3>
            <span className={`inline-flex items-center text-xs font-bold ${savingsDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {savingsDiff >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(savingsDiff).toFixed(1)}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">em relação ao mês anterior ({formatCurrency(previousMonth.economia)})</p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Evolution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-1">Evolução de Entradas vs Saídas</h3>
          <p className="text-xs text-slate-500 mb-5">Acompanhamento dos fluxos financeiros do casal nos últimos meses</p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="mes" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(val) => `R$${val / 1000}k`} />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), '']}
                  contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="despesasTotal" name="Despesas Totais" fill="#FF5A5A" radius={[6, 6, 0, 0]} />
                <Bar dataKey="economia" name="Economia/Aportes" fill="#43D19E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income Split Evolution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-1">Contribuição Proporcional da Renda</h3>
          <p className="text-xs text-slate-500 mb-5">Comparativo do aporte individual do casal mês a mês</p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="mes" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(val) => `R$${val / 1000}k`} />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), '']}
                  contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="lucasRenda" name={`Renda ${user1Name}`} fill="#6C63FF" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="marinaRenda" name={`Renda ${user2Name}`} fill="#FF6584" stackId="a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
