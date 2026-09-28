import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateBR } from '../../utils/formatters';
import { Income } from '../../types';
import {
  TrendingUp,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Briefcase,
  Users,
  PieChart,
  UserPlus,
  RefreshCw,
  Sun,
  Award,
  Calendar
} from 'lucide-react';

interface IncomesViewProps {
  onOpenIncomeModal: (incomeToEdit?: Income) => void;
  onOpenRecurrenceModal?: () => void;
}

export const IncomesView: React.FC<IncomesViewProps> = ({ onOpenIncomeModal, onOpenRecurrenceModal }) => {
  const { incomes: rawIncomes, users, deleteIncome, currentUser, partner, setActiveTab, getHouseholdUserIds } = useApp();
  const householdIds = getHouseholdUserIds();
  const incomes = rawIncomes.filter(item => householdIds.includes(item.registradoPor));

  const currentFirstName = currentUser.nome ? currentUser.nome.split(' ')[0] : 'Você';
  const partnerFirstName = partner?.nome ? partner.nome.split(' ')[0] : null;

  const totalIncomes = incomes.reduce((acc, curr) => acc + curr.valor, 0);

  const currentUserIncomes = incomes.filter(i => i.registradoPor === currentUser.id);
  const partnerIncomes = partner ? incomes.filter(i => i.registradoPor === partner.id) : [];

  const currentUserTotal = currentUserIncomes.reduce((acc, curr) => acc + curr.valor, 0);
  const partnerTotal = partnerIncomes.reduce((acc, curr) => acc + curr.valor, 0);

  const currentUserShare = !partner
    ? 100
    : totalIncomes > 0 ? (currentUserTotal / totalIncomes) * 100 : 50;

  const partnerShare = !partner
    ? 0
    : totalIncomes > 0 ? (partnerTotal / totalIncomes) * 100 : 50;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Renda do Casal */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              {partner ? 'Renda Combinada Total' : 'Minha Renda Total'}
            </p>
            <h3 className="text-2xl font-extrabold text-emerald-600">{formatCurrency(totalIncomes)}</h3>
            <p className="text-[11px] text-slate-400 mt-1">{incomes.length} fontes cadastradas</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Renda Usuário Atual */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={currentUser.avatar} alt={currentFirstName} className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-400" />
            <div>
              <p className="text-xs font-semibold text-slate-500">Renda {currentFirstName}</p>
              <h3 className="text-xl font-extrabold text-slate-900">{formatCurrency(currentUserTotal)}</h3>
              <p className="text-[11px] text-purple-600 font-bold mt-0.5">
                {partner ? `${currentUserShare.toFixed(1)}% do total` : '100% da sua renda'}
              </p>
            </div>
          </div>
        </div>

        {/* Renda Parceiro(a) ou Convite */}
        {partner ? (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={partner.avatar} alt={partnerFirstName || 'Parceiro'} className="w-10 h-10 rounded-full object-cover ring-2 ring-pink-400" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Renda {partnerFirstName}</p>
                <h3 className="text-xl font-extrabold text-slate-900">{formatCurrency(partnerTotal)}</h3>
                <p className="text-[11px] text-pink-600 font-bold mt-0.5">{partnerShare.toFixed(1)}% do total</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-2xl border border-dashed border-slate-300 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center ring-2 ring-purple-200 shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Sem parceiro vinculado</p>
                <button
                  onClick={() => setActiveTab('parceiro')}
                  className="text-xs font-bold text-purple-600 hover:underline text-left mt-0.5 flex items-center gap-1"
                >
                  <span>Convide seu parceiro(a) para comparar rendas</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Proportional Income Breakdown Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              {partner ? 'Proporção Renda Familiar' : 'Proporção da Minha Renda'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {onOpenRecurrenceModal && (
              <button
                onClick={onOpenRecurrenceModal}
                className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 border border-purple-200/80 transition-all shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Gerar Férias / 13º / Salário</span>
              </button>
            )}
            <button
              onClick={() => onOpenIncomeModal()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nova Receita</span>
            </button>
          </div>
        </div>

        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden flex my-3">
          <div
            className="bg-purple-600 h-full transition-all duration-500"
            style={{ width: `${currentUserShare}%` }}
            title={`${currentFirstName}: ${currentUserShare.toFixed(1)}%`}
          />
          {partner && (
            <div
              className="bg-pink-500 h-full transition-all duration-500"
              style={{ width: `${partnerShare}%` }}
              title={`${partnerFirstName}: ${partnerShare.toFixed(1)}%`}
            />
          )}
        </div>

        <div className="flex justify-between text-xs font-semibold">
          <span className="text-purple-700">
            {currentFirstName} ({currentUserShare.toFixed(1)}%) — {formatCurrency(currentUserTotal)}
          </span>
          {partner ? (
            <span className="text-pink-600">
              {partnerFirstName} ({partnerShare.toFixed(1)}%) — {formatCurrency(partnerTotal)}
            </span>
          ) : (
            <span className="text-slate-400 font-normal">Sem parceiro vinculado (100% individual)</span>
          )}
        </div>
      </div>

      {/* Incomes Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Todas as Entradas Cadastradas</h3>
          <span className="text-xs text-slate-500">{incomes.length} registros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Fonte / Origem</th>
                <th className="py-3 px-4">Pessoa</th>
                <th className="py-3 px-4 text-right">Valor Mensal</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {incomes.map(inc => {
                const payer = users.find(u => u.id === inc.registradoPor);

                return (
                  <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 font-mono whitespace-nowrap">
                      {formatDateBR(inc.data)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>{inc.descricao}</span>
                        {inc.tipo === 'ferias' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Sun className="w-3 h-3 text-amber-600" /> Férias
                          </span>
                        )}
                        {inc.tipo === 'decimo_terceiro' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            <Award className="w-3 h-3 text-purple-600" /> 13º Salário
                          </span>
                        )}
                        {inc.tipo === 'salario' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <DollarSign className="w-3 h-3 text-emerald-600" /> Salário
                          </span>
                        )}
                      </div>
                      {inc.observacao && (
                        <span className="block text-[11px] text-slate-400 font-normal mt-0.5">
                          {inc.observacao}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Briefcase className="w-3 h-3 text-emerald-600" />
                        {inc.fonte}
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
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600 whitespace-nowrap text-sm">
                      {formatCurrency(inc.valor)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onOpenIncomeModal(inc)}
                          title="Editar"
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteIncome(inc.id)}
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
      </div>
    </div>
  );
};
