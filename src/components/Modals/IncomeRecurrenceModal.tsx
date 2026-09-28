import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { IncomeRecurrenceConfig } from '../../types';
import { X, Calendar, DollarSign, Sun, Award, RefreshCw, Check, Info, Pencil } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface IncomeRecurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MESES = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' }
];

export const IncomeRecurrenceModal: React.FC<IncomeRecurrenceModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    partner,
    getIncomeRecurrenceConfig,
    saveIncomeRecurrenceConfig,
    syncRecurrentIncomesForUser,
    updateUserSalario
  } = useApp();

  const [selectedUserId, setSelectedUserId] = useState(currentUser.id);
  const activeUser = selectedUserId === currentUser.id ? currentUser : (partner || currentUser);

  // Config States
  const [salarioInput, setSalarioInput] = useState<string>('0');
  const [salarioAtivo, setSalarioAtivo] = useState(true);
  const [diaRecebimento, setDiaRecebimento] = useState(5);

  const [feriasAtivo, setFeriasAtivo] = useState(true);
  const [periodosFerias, setPeriodosFerias] = useState<{ mes: number }[]>([{ mes: 7 }]);

  const [decimoAtivo, setDecimoAtivo] = useState(true);
  const [formaDecimo, setFormaDecimo] = useState<'padrao' | 'antecipado_ferias'>('antecipado_ferias');

  useEffect(() => {
    if (isOpen) {
      const activeU = selectedUserId === currentUser.id ? currentUser : (partner || currentUser);
      setSalarioInput((activeU.salario || 0).toString());

      const configs = getIncomeRecurrenceConfig(selectedUserId);
      
      const salarioCfg = configs.find(c => c.tipo === 'salario');
      if (salarioCfg) {
        setSalarioAtivo(salarioCfg.ativo);
        setDiaRecebimento(salarioCfg.diaRecebimento || 5);
      }

      const feriasCfg = configs.find(c => c.tipo === 'ferias');
      if (feriasCfg) {
        setFeriasAtivo(feriasCfg.ativo);
        setPeriodosFerias(feriasCfg.periodosFerias && feriasCfg.periodosFerias.length > 0 ? feriasCfg.periodosFerias : [{ mes: 7 }]);
      }

      const decimoCfg = configs.find(c => c.tipo === 'decimo_terceiro');
      if (decimoCfg) {
        setDecimoAtivo(decimoCfg.ativo);
        setFormaDecimo(decimoCfg.formaDecimoTerceiro || 'padrao');
      }
    }
  }, [isOpen, selectedUserId]);

  if (!isOpen) return null;

  const handleAddFeriasPeriodo = () => {
    if (periodosFerias.length < 3) {
      setPeriodosFerias([...periodosFerias, { mes: 1 }]);
    }
  };

  const handleRemoveFeriasPeriodo = (index: number) => {
    if (periodosFerias.length > 1) {
      setPeriodosFerias(periodosFerias.filter((_, i) => i !== index));
    }
  };

  const handleUpdateFeriasMes = (index: number, mes: number) => {
    const updated = [...periodosFerias];
    updated[index] = { mes };
    setPeriodosFerias(updated);
  };

  const handleSaveAndSync = (e: React.FormEvent) => {
    e.preventDefault();

    const novoSalario = parseFloat(salarioInput) || 0;

    // Atualiza o salário base do usuário no context
    updateUserSalario(novoSalario, selectedUserId);

    // Save Salario config
    const salarioConfig: IncomeRecurrenceConfig = {
      id: `irc-${selectedUserId}-salario`,
      donoId: selectedUserId,
      tipo: 'salario',
      ativo: salarioAtivo,
      diaRecebimento
    };

    // Save Ferias config
    const feriasConfig: IncomeRecurrenceConfig = {
      id: `irc-${selectedUserId}-ferias`,
      donoId: selectedUserId,
      tipo: 'ferias',
      ativo: feriasAtivo,
      periodosFerias
    };

    // Save 13th config
    const decimoConfig: IncomeRecurrenceConfig = {
      id: `irc-${selectedUserId}-decimo`,
      donoId: selectedUserId,
      tipo: 'decimo_terceiro',
      ativo: decimoAtivo,
      formaDecimoTerceiro: formaDecimo
    };

    saveIncomeRecurrenceConfig(salarioConfig);
    saveIncomeRecurrenceConfig(feriasConfig);
    saveIncomeRecurrenceConfig(decimoConfig);

    syncRecurrentIncomesForUser(selectedUserId, undefined, novoSalario);
    onClose();
  };

  const baseSalary = parseFloat(salarioInput) || 0;
  const feriasTotalEstimado = (baseSalary * 4) / 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Configurar Receitas Recorrentes</h2>
              <p className="text-xs text-slate-500">Gere automaticamente Salários, Férias e 13º Salário</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Selector if Partnership Active */}
        {partner && (
          <div className="mt-4 flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedUserId(currentUser.id)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                selectedUserId === currentUser.id ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              <img src={currentUser.avatar} alt={currentUser.nome} className="w-5 h-5 rounded-full object-cover" />
              <span>{currentUser.nome.split(' ')[0]}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedUserId(partner.id)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                selectedUserId === partner.id ? 'bg-white text-pink-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              <img src={partner.avatar} alt={partner.nome} className="w-5 h-5 rounded-full object-cover" />
              <span>{partner.nome.split(' ')[0]}</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSaveAndSync} className="mt-4 space-y-5">
          {/* Base Salary Info (Editable) */}
          <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <label htmlFor="salario-base-input" className="block text-xs font-semibold text-purple-900 mb-1 flex items-center gap-1.5">
                <span>Salário Base Cadastrado</span>
                <Pencil className="w-3.5 h-3.5 text-purple-600" />
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-sm font-bold text-purple-700">R$</span>
                <input
                  id="salario-base-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={salarioInput}
                  onChange={(e) => setSalarioInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-purple-200 text-lg font-extrabold text-purple-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="text-[11px] text-purple-600 bg-white/80 px-2.5 py-1 rounded-lg border border-purple-200 self-start sm:self-center">
              CLT Mensal
            </div>
          </div>

          {/* 1. Config Salário */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-slate-800">Salário Mensal Fixo</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={salarioAtivo}
                  onChange={(e) => setSalarioAtivo(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {salarioAtivo && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Dia preferencial do recebimento no mês
                </label>
                <select
                  value={diaRecebimento}
                  onChange={(e) => setDiaRecebimento(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      Dia {d} de cada mês
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 2. Config Férias */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="text-sm font-bold text-slate-800">Férias & 1/3 Constitucional</span>
                  <span className="block text-[11px] text-slate-400 font-normal">
                    Valor total estimado: {formatCurrency(feriasTotalEstimado)}
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={feriasAtivo}
                  onChange={(e) => setFeriasAtivo(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {feriasAtivo && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600">
                  Mês(es) do gozo de férias no ano
                </label>
                {periodosFerias.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={p.mes}
                      onChange={(e) => handleUpdateFeriasMes(idx, Number(e.target.value))}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {MESES.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    {periodosFerias.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFeriasPeriodo(idx)}
                        className="text-xs text-rose-600 hover:underline px-2 py-1"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}
                {periodosFerias.length < 3 && (
                  <button
                    type="button"
                    onClick={handleAddFeriasPeriodo}
                    className="text-xs text-amber-700 font-semibold hover:underline flex items-center gap-1 mt-1"
                  >
                    + Adicionar fracionamento de férias
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 3. Config 13º Salário */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-bold text-slate-800">13º Salário</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={decimoAtivo}
                  onChange={(e) => setDecimoAtivo(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {decimoAtivo && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600">
                  Forma de recebimento da 1ª parcela
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors border border-transparent hover:border-slate-200">
                    <input
                      type="radio"
                      name="formaDecimo"
                      value="padrao"
                      checked={formaDecimo === 'padrao'}
                      onChange={() => setFormaDecimo('padrao')}
                      className="mt-0.5 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800">Padrão CLT (Nov/Dez)</span>
                      <p className="text-slate-500 text-[11px]">
                        1ª parcela (50%) em Novembro e 2ª parcela (50%) em Dezembro.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors border border-transparent hover:border-slate-200">
                    <input
                      type="radio"
                      name="formaDecimo"
                      value="antecipado_ferias"
                      checked={formaDecimo === 'antecipado_ferias'}
                      onChange={() => setFormaDecimo('antecipado_ferias')}
                      className="mt-0.5 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800">Antecipado nas Férias</span>
                      <p className="text-slate-500 text-[11px]">
                        1ª parcela (50%) no mês das férias e 2ª parcela (50%) em Dezembro.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Salvar & Sincronizar Ano</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
