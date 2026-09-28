import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateBR, getCategoryColor, CATEGORY_HEX_MAP } from '../../utils/formatters';
import { ExpenseCategory } from '../../types';
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  CreditCard,
  PieChart as PieIcon,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Plus,
  Users,
  UserPlus
} from 'lucide-react';

interface DashboardViewProps {
  onOpenExpenseModal: () => void;
  onOpenIncomeModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenExpenseModal,
  onOpenIncomeModal
}) => {
  const {
    expenses: rawExpenses,
    incomes: rawIncomes,
    budgets,
    users,
    currentUser,
    partner,
    divisionRule,
    setDivisionRule,
    toggleExpensePaid,
    setActiveTab,
    getHouseholdUserIds
  } = useApp();

  const householdIds = getHouseholdUserIds();
  const expenses = rawExpenses.filter(item => householdIds.includes(item.registradoPor));
  const incomes = rawIncomes.filter(item => householdIds.includes(item.registradoPor));

  // Calculate total incomes
  const totalIncomes = incomes.reduce((acc, curr) => acc + curr.valor, 0);

  // Income by user
  const user1Income = incomes
    .filter(i => i.registradoPor === currentUser.id)
    .reduce((acc, curr) => acc + curr.valor, 0);

  const user2Income = partner
    ? incomes
        .filter(i => i.registradoPor === partner.id)
        .reduce((acc, curr) => acc + curr.valor, 0)
    : 0;

  // Total Expenses
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.valor, 0);
  const paidExpenses = expenses.filter(e => e.pago).reduce((acc, curr) => acc + curr.valor, 0);
  const pendingExpenses = totalExpenses - paidExpenses;

  // Expenses paid by user
  const user1Paid = expenses
    .filter(e => e.registradoPor === currentUser.id && e.pago)
    .reduce((acc, curr) => acc + curr.valor, 0);

  const user2Paid = partner
    ? expenses
        .filter(e => e.registradoPor === partner.id && e.pago)
        .reduce((acc, curr) => acc + curr.valor, 0)
    : 0;

  // Net Balance
  const netBalance = totalIncomes - totalExpenses;

  // Proportional or 50/50 division math
  let user1TargetShare = 0.5;
  let user2TargetShare = 0.5;

  if (partner) {
    if (divisionRule === 'proportional' && totalIncomes > 0) {
      user1TargetShare = user1Income / totalIncomes;
      user2TargetShare = user2Income / totalIncomes;
    }
  } else {
    user1TargetShare = 1.0;
    user2TargetShare = 0;
  }

  const user1TargetExpense = totalExpenses * user1TargetShare;
  const user2TargetExpense = totalExpenses * user2TargetShare;

  // Difference paid vs target
  const user1Diff = user1Paid - user1TargetExpense; // positive = paid more than share
  const user2Diff = user2Paid - user2TargetExpense;

  // Category breakdown for Pie Chart
  const categoryTotals: Record<string, number> = {};
  expenses.forEach(exp => {
    categoryTotals[exp.categoria] = (categoryTotals[exp.categoria] || 0) + exp.valor;
  });

  const pieData = Object.keys(categoryTotals).map(cat => ({
    name: cat,
    value: categoryTotals[cat],
    color: CATEGORY_HEX_MAP[cat as ExpenseCategory] || '#94A3B8'
  }));

  // Bar Chart Data: Incomes & Expenses per user
  const currentFirstName = currentUser.nome ? currentUser.nome.split(' ')[0] : 'Você';
  const partnerFirstName = partner?.nome ? partner.nome.split(' ')[0] : null;

  const barData = [
    {
      name: currentFirstName,
      Receitas: user1Income,
      DespesasPagas: user1Paid,
      CotaIdeal: user1TargetExpense
    },
    ...(partner && partnerFirstName ? [{
      name: partnerFirstName,
      Receitas: user2Income,
      DespesasPagas: user2Paid,
      CotaIdeal: user2TargetExpense
    }] : [])
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* 1. TOP STATS CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Receitas */}
        <div className="bento-card p-5 flex items-center justify-between hover:border-emerald-300 transition-all shadow-duo-hover">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              {partner ? 'Receitas do Casal' : 'Minhas Receitas'}
            </p>
            <h3 className="text-2xl font-extrabold text-emerald-600">{formatCurrency(totalIncomes)}</h3>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              {partner ? (
                <>
                  <span className="font-semibold text-emerald-600">{currentFirstName}</span> R$ {user1Income.toLocaleString('pt-BR')} | <span className="font-semibold text-pink-600">{partnerFirstName}</span> R$ {user2Income.toLocaleString('pt-BR')}
                </>
              ) : (
                <>
                  <span className="font-semibold text-emerald-600">{currentFirstName}</span> R$ {user1Income.toLocaleString('pt-BR')}
                </>
              )}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Total Despesas */}
        <div className="bento-card p-5 flex items-center justify-between hover:border-rose-300 transition-all shadow-duo-hover">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Despesas Totais</p>
            <h3 className="text-2xl font-extrabold text-rose-600">{formatCurrency(totalExpenses)}</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Pagas: <span className="font-medium text-slate-700">{formatCurrency(paidExpenses)}</span> | Pendente: <span className="font-medium text-amber-600">{formatCurrency(pendingExpenses)}</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Saldo Líquido do Mês */}
        <div className="bento-card p-5 flex items-center justify-between hover:border-purple-300 transition-all shadow-duo-hover">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Saldo Líquido</p>
            <h3 className={`text-2xl font-extrabold ${netBalance >= 0 ? 'text-purple-900' : 'text-rose-600'}`}>
              {formatCurrency(netBalance)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              {netBalance >= 0 ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Saldo Positivo
                </span>
              ) : (
                <span className="text-rose-600 font-semibold flex items-center gap-0.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Déficit Atento
                </span>
              )}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-gradient-duo text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Acerto entre Casal */}
        <div className="bento-card p-5 flex items-center justify-between hover:border-indigo-300 transition-all shadow-duo-hover">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Acerto de Contas</p>
            {!partner ? (
              <div>
                <h3 className="text-xs font-bold text-slate-700">Sem parceiro vinculado</h3>
                <button
                  onClick={() => setActiveTab('parceiro')}
                  className="text-[11px] text-purple-600 font-semibold hover:underline mt-0.5 flex items-center gap-1"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Convidar parceiro(a)</span>
                </button>
              </div>
            ) : Math.abs(user1Diff) < 1 ? (
              <h3 className="text-base font-extrabold text-emerald-600">Contas em dia! 👌</h3>
            ) : user1Diff > 0 ? (
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {partnerFirstName} transfere <span className="text-purple-700">{formatCurrency(user1Diff)}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">para {currentFirstName} compensar</p>
              </div>
            ) : (
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {currentFirstName} transfere <span className="text-pink-700">{formatCurrency(Math.abs(user1Diff))}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">para {partnerFirstName} compensar</p>
              </div>
            )}
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. PROPORTIONAL DIVISION CALCULATOR CARD */}
      <div className="bento-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-slate-900">Divisão de Contas do Casal</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Defina como as despesas do lar devem ser divididas com base nas rendas
            </p>
          </div>

          {/* Rule Switcher Toggle */}
          {partner && (
            <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
              <button
                onClick={() => setDivisionRule('proportional')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  divisionRule === 'proportional'
                    ? 'bg-gradient-duo text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Proporcional à Renda
              </button>
              <button
                onClick={() => setDivisionRule('equal')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  divisionRule === 'equal'
                    ? 'bg-gradient-duo text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Divisão Igualitária 50/50
              </button>
            </div>
          )}
        </div>

        {!partner ? (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-center my-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-3">
              <UserPlus className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Convide seu parceiro(a) para comparar e dividir contas!</h3>
            <p className="text-xs text-slate-500 max-w-md mb-4">
              Conecte sua conta com a do seu parceiro(a) para calcular a divisão proporcional de despesas, organizar o acerto de contas e planejar o futuro juntos.
            </p>
            <button
              onClick={() => setActiveTab('parceiro')}
              className="px-4 py-2 bg-gradient-duo text-white text-xs font-semibold rounded-xl shadow-xs hover:opacity-95 transition-all flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Convidar Parceiro(a)</span>
            </button>
          </div>
        ) : (
          /* User Proportion Progress Bars */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
            {/* Current User */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <img src={currentUser.avatar} alt={currentFirstName} className="w-7 h-7 rounded-full object-cover" />
                  <div>
                    <span className="text-xs font-bold text-slate-800">{currentFirstName}</span>
                    <span className="text-[10px] text-slate-500 block">Renda: {formatCurrency(user1Income)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-purple-700">
                    {(user1TargetShare * 100).toFixed(0)}% da cota
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Cota Ideal: {formatCurrency(user1TargetExpense)}
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-purple-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((user1Paid / (user1TargetExpense || 1)) * 100, 100)}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>Pago até agora: <strong>{formatCurrency(user1Paid)}</strong></span>
                <span>
                  {user1Diff >= 0 ? (
                    <span className="text-emerald-600">+ {formatCurrency(user1Diff)} pago a mais</span>
                  ) : (
                    <span className="text-rose-600">- {formatCurrency(Math.abs(user1Diff))} pendente</span>
                  )}
                </span>
              </div>
            </div>

            {/* Partner User */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <img src={partner.avatar} alt={partnerFirstName || 'Parceiro'} className="w-7 h-7 rounded-full object-cover" />
                  <div>
                    <span className="text-xs font-bold text-slate-800">{partnerFirstName}</span>
                    <span className="text-[10px] text-slate-500 block">Renda: {formatCurrency(user2Income)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-pink-600">
                    {(user2TargetShare * 100).toFixed(0)}% da cota
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Cota Ideal: {formatCurrency(user2TargetExpense)}
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-pink-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((user2Paid / (user2TargetExpense || 1)) * 100, 100)}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>Pago até agora: <strong>{formatCurrency(user2Paid)}</strong></span>
                <span>
                  {user2Diff >= 0 ? (
                    <span className="text-emerald-600">+ {formatCurrency(user2Diff)} pago a mais</span>
                  ) : (
                    <span className="text-rose-600">- {formatCurrency(Math.abs(user2Diff))} pendente</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. CHARTS SECTION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart: Expenses by Category */}
        <div className="bento-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-purple-600" />
              <h3 className="text-base font-bold text-slate-900">Gastos por Categoria</h3>
            </div>
            <button
              onClick={() => setActiveTab('orcamento')}
              className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
            >
              <span>Ver Orçamentos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Gasto Total']}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </div>

          {/* Category Chips Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 pt-3 border-t border-slate-100">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.name}:</span>
                <span className="font-bold text-slate-800 shrink-0">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart: Income vs Paid per Partner */}
        <div className="bento-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Renda vs Contribuição Efetiva</h3>
            </div>
            <button
              onClick={() => setActiveTab('comparacao')}
              className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
            >
              <span>Comparação Detalhada</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="name" tickLine={false} />
                <YAxis tickLine={false} tickFormatter={(v) => `R$${v / 1000}k`} />
                <RechartsTooltip formatter={(val: any) => formatCurrency(Number(val))} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Receitas" fill="#43D19E" radius={[6, 6, 0, 0]} name="Receitas" />
                <Bar dataKey="DespesasPagas" fill="#6C63FF" radius={[6, 6, 0, 0]} name="Despesas Pagas" />
                <Bar dataKey="CotaIdeal" fill="#FF6584" radius={[6, 6, 0, 0]} name="Cota Ideal" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-slate-500 text-center mt-3">
            A barra &quot;Cota Ideal&quot; representa a parcela que cabe a cada um segundo a regra selecionada ({divisionRule === 'proportional' ? 'Proporcional' : '50/50'}).
          </p>
        </div>
      </div>

      {/* 4. RECENT TRANSACTIONS TABLE */}
      <div className="bento-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Últimas Despesas Registradas</h3>
            <p className="text-xs text-slate-500">Mantenha o histórico atualizado em tempo real</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenExpenseModal}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-xl flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar</span>
            </button>
            <button
              onClick={() => setActiveTab('despesas')}
              className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
            >
              <span>Ver Todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3">Data</th>
                <th className="py-3 px-3">Descrição</th>
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-3">Quem Pagou</th>
                <th className="py-3 px-3 text-right">Valor</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.slice(0, 5).map(exp => {
                const catStyle = getCategoryColor(exp.categoria);
                const payer = users.find(u => u.id === exp.registradoPor);

                return (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-slate-500 font-mono whitespace-nowrap">
                      {formatDateBR(exp.data)}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {exp.descricao}
                      {exp.observacao && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {exp.observacao}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
                        {exp.categoria}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {payer && (
                          <img src={payer.avatar} alt={payer.nome} className="w-5 h-5 rounded-full object-cover" />
                        )}
                        <span className="text-slate-700 font-medium">
                          {payer ? payer.nome.split(' ')[0] : 'Desconhecido'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(exp.valor)}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => toggleExpensePaid(exp.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
