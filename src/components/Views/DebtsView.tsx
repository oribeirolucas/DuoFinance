import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateBR } from '../../utils/formatters';
import { Debt } from '../../types';
import {
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  CreditCard,
  Percent,
  UserCheck,
  Building2,
  HelpCircle,
  Calendar
} from 'lucide-react';

interface DebtsViewProps {
  onOpenDebtModal: (debtToEdit?: Debt) => void;
}

export const DebtsView: React.FC<DebtsViewProps> = ({ onOpenDebtModal }) => {
  const { debts: rawDebts, users, payDebtInstallment, deleteDebt, getHouseholdUserIds } = useApp();

  const householdIds = getHouseholdUserIds();
  const debts = rawDebts.filter(d => householdIds.includes(d.registradoPor));

  const totalOriginalDebt = debts.reduce((acc, curr) => acc + curr.valorTotal, 0);
  const totalRemainingDebt = debts.reduce((acc, curr) => acc + curr.valorRestante, 0);
  const totalPaidDebt = totalOriginalDebt - totalRemainingDebt;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bento-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Saldo Devedor Total</p>
            <h3 className="text-2xl font-extrabold text-rose-600">{formatCurrency(totalRemainingDebt)}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Valor inicial: {formatCurrency(totalOriginalDebt)}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bento-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Já Amortizado / Pago</p>
            <h3 className="text-2xl font-extrabold text-emerald-600">{formatCurrency(totalPaidDebt)}</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              {totalOriginalDebt > 0 ? ((totalPaidDebt / totalOriginalDebt) * 100).toFixed(1) : 0}% da dívida quitada
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bento-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Compromissos Ativos</p>
            <h3 className="text-2xl font-extrabold text-purple-900">{debts.filter(d => d.valorRestante > 0).length}</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              {debts.filter(d => d.valorRestante <= 0).length} financiamentos liquidados
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Actions Bar */}
      <div className="bento-card p-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Gerenciamento de Dívidas & Financiamentos</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mantenha visibilidade total sobre parcelamentos, juros e prazos do casal
          </p>
        </div>

        <button
          onClick={() => onOpenDebtModal()}
          className="px-4 py-2 bg-gradient-duo text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-500/20 hover:opacity-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Dívida</span>
        </button>
      </div>

      {/* Debt Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {debts.length === 0 ? (
          <div className="col-span-2 bg-white p-12 rounded-2xl border border-slate-200/80 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">Parabéns! Nenhuma dívida registrada.</h3>
            <p className="text-xs text-slate-500 mt-1">O casal está livre de passivos financeiros cadastrados.</p>
          </div>
        ) : (
          debts.map(debt => {
            const isPaidOff = debt.valorRestante <= 0;
            const progress = debt.valorTotal > 0 ? ((debt.valorTotal - debt.valorRestante) / debt.valorTotal) * 100 : 100;
            const responsavelUser = users.find(u => u.id === debt.responsavel);

            return (
              <div
                key={debt.id}
                className={`bento-card p-6 flex flex-col justify-between transition-all ${
                  isPaidOff
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'hover:border-purple-300'
                }`}
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                        {debt.credor}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">{debt.titulo}</h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenDebtModal(debt)}
                        className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteDebt(debt.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="my-4">
                    <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                      <span className="text-slate-600">Amortização</span>
                      <span className={isPaidOff ? 'text-emerald-600' : 'text-purple-700'}>
                        {progress.toFixed(0)}% quitado
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isPaidOff ? 'bg-emerald-500' : 'bg-gradient-duo'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Main Metric Numbers */}
                  <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 my-3">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Restante a Pagar</p>
                      <p className={`text-base font-extrabold ${isPaidOff ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(debt.valorRestante)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Valor da Parcela</p>
                      <p className="text-base font-extrabold text-slate-800">
                        {formatCurrency(debt.valorParcela)}
                        <span className="text-[10px] font-normal text-slate-500 ml-1">
                          ({debt.parcelasPagas}/{debt.totalParcelas})
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Badges & Details */}
                  <div className="space-y-2 text-xs text-slate-600 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Percent className="w-3.5 h-3.5 text-purple-600" /> Taxa de Juros:
                      </span>
                      <span className="font-semibold text-slate-800">{debt.taxaJuros}% a.m.</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-purple-600" /> Vencimento Mensal:
                      </span>
                      <span className="font-semibold text-slate-800">Dia {debt.vencimentoDia}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <UserCheck className="w-3.5 h-3.5 text-purple-600" /> Responsável:
                      </span>
                      <span className="font-bold text-purple-900">
                        {debt.responsavel === 'casal'
                          ? 'Compartilhado (Casal)'
                          : responsavelUser
                          ? responsavelUser.nome
                          : 'Casal'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  {isPaidOff ? (
                    <div className="w-full py-2 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Dívida Quitada com Sucesso! 🎉</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => payDebtInstallment(debt.id)}
                      className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs rounded-xl transition-colors border border-purple-200 flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4 text-purple-600" />
                      <span>Registrar Pagamento de Parcela ({formatCurrency(debt.valorParcela)})</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
