import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Heart, Copy, Check, Send, Key } from 'lucide-react';

interface PartnerInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PartnerInviteModal: React.FC<PartnerInviteModalProps> = ({ isOpen, onClose }) => {
  const { sendInvite, acceptInvite, partnership } = useApp();

  const [activeMode, setActiveMode] = useState<'send' | 'enter'>('send');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [enterToken, setEnterToken] = useState('');
  const [generatedToken, setGeneratedToken] = useState(partnership.inviteToken || '');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerEmail.trim()) return;
    const token = sendInvite(partnerEmail);
    setGeneratedToken(token);
  };

  const handleAcceptInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enterToken.trim()) return;
    const success = acceptInvite(enterToken);
    if (success) {
      onClose();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
              <Heart className="w-5 h-5 fill-pink-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Conectar com o Parceiro(a)</h2>
              <p className="text-xs text-slate-500">Planejamento financeiro sincronizado para o casal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-100 p-1 rounded-xl mt-4">
          <button
            type="button"
            onClick={() => setActiveMode('send')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeMode === 'send'
                ? 'bg-white text-purple-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Enviar Convite
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('enter')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeMode === 'enter'
                ? 'bg-white text-purple-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Inserir Código
          </button>
        </div>

        {/* Send Mode */}
        {activeMode === 'send' ? (
          <div className="mt-4 space-y-4">
            <form onSubmit={handleSendInvite} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail do seu amor / parceiro(a) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="sibeli@exemplo.com.br"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-duo text-white font-semibold text-xs shadow-md shadow-purple-500/20 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Gerar Código de Convite</span>
              </button>
            </form>

            {generatedToken && (
              <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-2xl text-center space-y-2">
                <p className="text-xs text-purple-900 font-semibold">
                  Código de Convite Gerado:
                </p>
                <div className="text-xl font-mono font-extrabold text-purple-900 bg-white py-2 px-4 rounded-xl border border-purple-200 tracking-wider">
                  {generatedToken}
                </div>
                <p className="text-[11px] text-purple-700">
                  Envie este código para o seu parceiro(a) colar no app dele(a).
                </p>
                <button
                  onClick={copyToClipboard}
                  className="mt-2 text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center justify-center gap-1.5 mx-auto"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Enter Code Mode */
          <form onSubmit={handleAcceptInvite} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-slate-400" /> Código de Convite *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: DUO-8492-LOVE"
                value={enterToken}
                onChange={(e) => setEnterToken(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-duo text-white font-semibold text-xs shadow-md shadow-purple-500/20 flex items-center justify-center gap-2"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Conectar Contas do Casal</span>
            </button>
          </form>
        )}

        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium"
          >
            Fechar janela
          </button>
        </div>
      </div>
    </div>
  );
};
