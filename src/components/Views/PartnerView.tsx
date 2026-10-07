import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Heart,
  UserCheck,
  Send,
  Key,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Sparkles,
  Scale,
  Users,
  Copy,
  Check,
  Trash2
} from 'lucide-react';

interface PartnerViewProps {
  onOpenInviteModal: () => void;
}

export const PartnerView: React.FC<PartnerViewProps> = ({ onOpenInviteModal }) => {
  const {
    currentUser,
    partner,
    partnership,
    subscription,
    divisionRule,
    setDivisionRule,
    setSubscriptionPlan,
    endPartnership,
    sendInvite,
    acceptInvite
  } = useApp();

  const [inviteEmail, setInviteEmail] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || enviando) return;
    setEnviando(true);
    try {
      const token = await sendInvite(inviteEmail);
      if (token) setInviteEmail('');
    } finally {
      setEnviando(false);
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim() || enviando) return;
    setEnviando(true);
    try {
      const ok = await acceptInvite(tokenInput);
      if (ok) setTokenInput('');
    } finally {
      setEnviando(false);
    }
  };

  // O texto precisa ser verdadeiro para quem quer que clique: os lançamentos
  // ficam com a conta que PERMANECE, não com a que criou a parceria. Quem sai
  // recomeça vazio, seja quem for.
  const handleEndPartnership = () => {
    if (window.confirm(
      'Encerrar a parceria? Todos os lançamentos ficam com a conta que permanece, '
      + 'inclusive os que você registrou. Você recomeça com um espaço vazio.'
    )) {
      void endPartnership();
    }
  };

  const copyToken = () => {
    if (partnership.inviteToken) {
      navigator.clipboard.writeText(partnership.inviteToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-gradient-duo rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-purple-500/15 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-3">
            <Heart className="w-3.5 h-3.5 fill-white" />
            <span>Conexão & Sincronização Duo</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Gestão Financeira Compartilhada
          </h2>
          <p className="text-sm md:text-base text-purple-100 mt-2 font-normal">
            Conecte suas finanças com quem você ama. Acompanhe entradas, divida contas de forma justa e realizem sonhos juntos sem desentendimentos.
          </p>
        </div>
      </div>

      {/* 2. PARTNERSHIP STATUS CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          <span>Status da Parceria do Casal</span>
        </h3>

        {partnership.status === 'active' && partner ? (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                    Parceria Ativa & Sincronizada 💜
                  </p>
                  <p className="text-xs text-emerald-800">
                    Sua conta está conectada com <span className="font-semibold">{partner.nome}</span> ({partner.email})
                  </p>
                </div>
              </div>

              <button
                onClick={handleEndPartnership}
                className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Desconectar Parceria</span>
              </button>
            </div>

            {/* Couple Profiles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* User 1 */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center gap-3">
                <img src={currentUser.avatar} alt={currentUser.nome} className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/40" />
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Você</span>
                  <h4 className="text-sm font-bold text-slate-900">{currentUser.nome}</h4>
                  <p className="text-xs text-slate-500">Salário: R$ {currentUser.salario.toLocaleString('pt-BR')}</p>
                </div>
              </div>

              {/* User 2 */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center gap-3">
                <img src={partner.avatar} alt={partner.nome} className="w-12 h-12 rounded-full object-cover ring-2 ring-pink-500/40" />
                <div>
                  <span className="text-xs text-pink-600 font-semibold uppercase tracking-wider block">Parceiro(a)</span>
                  <h4 className="text-sm font-bold text-slate-900">{partner.nome}</h4>
                  <p className="text-xs text-slate-500">Salário: R$ {partner.salario.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-amber-600 fill-amber-600" />
                  Nenhuma Parceria Ativa no Momento
                </p>
                <p className="text-xs text-amber-800 mt-0.5">
                  Convide seu parceiro(a) enviando um e-mail ou compartilhando o código de convite.
                </p>
              </div>

              <button
                onClick={onOpenInviteModal}
                className="px-4 py-2.5 bg-gradient-duo text-white font-semibold text-xs rounded-xl shadow-md shadow-purple-500/20 shrink-0"
              >
                + Enviar Convite Rápido
              </button>
            </div>

            {/* Quick Invitation Forms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Send Invite Form */}
              <form onSubmit={handleSendInvite} className="p-5 border border-slate-200/80 rounded-2xl space-y-3">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Send className="w-4 h-4 text-purple-600" />
                  <span>1. Enviar Convite por E-mail</span>
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    E-mail do Parceiro(a)
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="parceiro@exemplo.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="campo-form w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-xs transition-colors"
                >
                  Gerar Código de Convite
                </button>

                {partnership.inviteToken && (
                  <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-xl text-center space-y-1">
                    <p className="text-[11px] text-purple-900 font-semibold">Código Atual:</p>
                    <p className="font-mono text-base font-extrabold text-purple-900">{partnership.inviteToken}</p>
                    <button
                      type="button"
                      onClick={copyToken}
                      className="text-xs font-bold text-purple-700 flex items-center justify-center gap-1 mx-auto"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
                    </button>
                  </div>
                )}
              </form>

              {/* Enter Invite Code Form */}
              <form onSubmit={handleAcceptInvite} className="p-5 border border-slate-200/80 rounded-2xl space-y-3">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Key className="w-4 h-4 text-pink-600" />
                  <span>2. Já tem um Código? Aceitar Convite</span>
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Código Recebido
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 3f2a9c14-7b5e-4d81-a0c6-1e8f2b7d9043"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                    className="campo-form w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-semibold text-xs transition-colors"
                >
                  Conectar Contas Agora
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* 3. DIVISION RULE PREFERENCE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Scale className="w-5 h-5 text-purple-600" />
          <h3 className="text-base font-bold text-slate-900">Regra de Divisão de Gastos Padrão</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Escolha como o sistema deve sugerir a cota de pagamentos de cada um nas despesas compartilhadas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Proportional Option */}
          <div
            onClick={() => setDivisionRule('proportional')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              divisionRule === 'proportional'
                ? 'border-purple-500 bg-purple-50/50 ring-2 ring-purple-500/20'
                : 'border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-900">Proporcional à Renda</span>
              {divisionRule === 'proportional' && (
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
              )}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Quem ganha mais contribui com uma porcentagem equivalente maior no orçamento do lar. É o método recomendado para casais com rendas diferentes.
            </p>
          </div>

          {/* Equal 50/50 Option */}
          <div
            onClick={() => setDivisionRule('equal')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              divisionRule === 'equal'
                ? 'border-purple-500 bg-purple-50/50 ring-2 ring-purple-500/20'
                : 'border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-900">Divisão Igualitária 50 / 50</span>
              {divisionRule === 'equal' && (
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
              )}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Todas as despesas compartilhadas são divididas exatamente ao meio (50% para cada um), independente do salário individual.
            </p>
          </div>
        </div>
      </div>

      {/* 4. SUBSCRIPTION PLAN CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Plano Duo Finance</span>
            </h3>
            <p className="text-xs text-slate-500">
              Plano atual: <strong className="uppercase text-purple-700 font-bold">{subscription.plano}</strong>
            </p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSubscriptionPlan('free')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                subscription.plano === 'free' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Plano Individual (Grátis)
            </button>
            <button
              onClick={() => setSubscriptionPlan('duo')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                subscription.plano === 'duo' ? 'bg-gradient-duo text-white shadow-2xs' : 'text-slate-500'
              }`}
            >
              Plano Duo Casal (Premium)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Free Plan Box */}
          <div className={`p-5 rounded-2xl border ${subscription.plano === 'free' ? 'border-slate-400 bg-slate-50/80' : 'border-slate-200/80'}`}>
            <h4 className="font-bold text-slate-900 text-sm">Plano Individual / Grátis</h4>
            <p className="text-2xl font-extrabold text-slate-800 my-2">R$ 0,00 <span className="text-xs text-slate-500 font-normal">/mês</span></p>
            <ul className="space-y-2 text-xs text-slate-600 mt-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Gestão individual de despesas e receitas</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Metas de economia básicas</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-[10px] flex items-center justify-center shrink-0">✕</span>
                <span>Sem sincronização com parceiro(a)</span>
              </li>
            </ul>
          </div>

          {/* Duo Plan Box */}
          <div className={`p-5 rounded-2xl border relative overflow-hidden ${subscription.plano === 'duo' ? 'border-purple-500 bg-purple-50/40 ring-2 ring-purple-500/20' : 'border-slate-200/80'}`}>
            <div className="absolute top-3 right-3 bg-gradient-duo text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
              Recomendado
            </div>
            <h4 className="font-bold text-purple-900 text-sm flex items-center gap-1.5">
              <span>Plano Duo Casal</span>
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
            </h4>
            <p className="text-2xl font-extrabold text-purple-900 my-2">
              R$ 19,90 <span className="text-xs text-slate-500 font-normal">/mês para os dois</span>
            </p>
            <ul className="space-y-2 text-xs text-slate-700 mt-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Sincronização em tempo real entre 2 contas</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Calculadora inteligente de acerto de contas</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Metas e sonhos compartilhados de longo prazo</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Análise comparativa avançada e exportação Excel</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
