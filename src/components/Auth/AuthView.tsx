import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Heart, Lock, Mail, User as UserIcon, ArrowRight, ShieldCheck, Sparkles, AlertCircle, Check, X } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { login, signup, recuperarSenha, authScreen, setAuthScreen } = useApp();

  // Campos começam vazios: credencial preenchida é credencial embarcada no
  // bundle de produção.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nome, setNome] = useState('');
  const [salario, setSalario] = useState('6500');

  // Forgot password state
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySubmitted, setRecoverySubmitted] = useState(false);

  // Error message
  const [errorMsg, setErrorMsg] = useState('');

  // Password validation rules (for signup)
  const isMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = isMinLength && hasUppercase && hasNumber;
  const passwordsMatch = password === confirmPassword;

  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (enviando) return;

    if (authScreen === 'login') {
      if (!email.trim()) {
        setErrorMsg('Por favor, informe seu e-mail.');
        return;
      }
      if (!password) {
        setErrorMsg('Por favor, informe sua senha.');
        return;
      }
      setEnviando(true);
      try {
        const ok = await login(email.trim(), password);
        if (!ok) setErrorMsg('E-mail ou senha incorretos.');
      } finally {
        setEnviando(false);
      }
    } else if (authScreen === 'cadastro') {
      if (!email.trim()) {
        setErrorMsg('Por favor, informe seu e-mail.');
        return;
      }
      if (!isPasswordValid) {
        setErrorMsg('A senha deve conter no mínimo 8 caracteres, pelo menos 1 letra maiúscula e 1 número.');
        return;
      }
      if (!passwordsMatch) {
        setErrorMsg('As senhas não coincidem. Verifique o campo de confirmação.');
        return;
      }
      setEnviando(true);
      try {
        const ok = await signup(nome.trim() || 'Novo Usuário', email.trim(), Number(salario) || 5000, password);
        if (!ok) setErrorMsg('Não foi possível concluir o cadastro.');
      } finally {
        setEnviando(false);
      }
    } else if (authScreen === 'esqueci-senha') {
      if (!recoveryEmail.trim()) {
        setErrorMsg('Por favor, digite seu e-mail para recuperação.');
        return;
      }
      setEnviando(true);
      try {
        // O servidor responde com sucesso mesmo para e-mail sem conta, então
        // confirmar o envio não revela quem tem conta. Mas se o envio falhou
        // de fato, mostrar "E-mail enviado!" seria mentira.
        const ok = await recuperarSenha(recoveryEmail.trim());
        if (ok) {
          setRecoverySubmitted(true);
        } else {
          setErrorMsg('Não foi possível enviar agora. Tente novamente em alguns minutos.');
        }
      } finally {
        setEnviando(false);
      }
    }
  };

  const handleSwitchScreen = (screen: 'login' | 'cadastro' | 'esqueci-senha') => {
    setErrorMsg('');
    setRecoverySubmitted(false);
    if (screen === 'esqueci-senha' && email) {
      setRecoveryEmail(email);
    }
    setAuthScreen(screen);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden">
        {/* Left Branding Side */}
        <div className="bg-gradient-duo p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                <Heart className="w-6 h-6 fill-white" />
              </div>
              <h1 className="font-extrabold text-2xl tracking-tight text-white">Duo Finance</h1>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-4 text-purple-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Finanças de Casais Sem Estresse</span>
            </div>

            <h2 className="text-3xl font-black leading-tight tracking-tight">
              Dois sonhos. <br />
              Um só planejamento.
            </h2>

            <p className="text-sm text-purple-100 mt-4 leading-relaxed font-normal">
              Acompanhem ganhos e despesas juntos, dividam as contas com justiça e conquistem a independência financeira do casal.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="mt-8 pt-6 border-t border-white/15 space-y-3 text-xs text-purple-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Divisão de contas proporcional à renda do casal</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Calculadora em tempo real do acerto de contas</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Metas mensais e sonhos de longo prazo compartilhados</span>
            </div>
          </div>
        </div>

        {/* Right Form Side */}
        <div className="p-8 flex flex-col justify-between">
          <div>
            <div className="text-center md:text-left mb-6">
              <h3 className="text-xl font-extrabold text-slate-900">
                {authScreen === 'cadastro' && 'Criar Conta do Casal'}
                {authScreen === 'login' && 'Entrar no Duo Finance'}
                {authScreen === 'esqueci-senha' && 'Recuperar Senha'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {authScreen === 'cadastro' && 'Cadastre seus dados para começar a gerenciar juntos'}
                {authScreen === 'login' && 'Acesse suas finanças compartilhadas em tempo real'}
                {authScreen === 'esqueci-senha' && 'Informe seu e-mail para receber o link de redefinição'}
              </p>
            </div>

            {/* Error Message Box */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Os atalhos de "Login Rápido Demo" saíram junto com as senhas de
                demonstração. Eles dependiam de uma senha fixa conhecida por
                todos, embutida no código — exatamente o que o modo demo
                precisa deixar de ter para a aplicação ir a produção. Em modo
                demo, crie as contas de exemplo pelo cadastro normal. */}
            {authScreen === 'login' && isDemoMode && (
              <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
                Modo demonstração ativo. As contas de exemplo são criadas pelo cadastro,
                com senha própria — não há mais senha padrão.
              </div>
            )}

            {/* FORGOT PASSWORD RECOVERY SUCCESS VIEW */}
            {authScreen === 'esqueci-senha' && recoverySubmitted ? (
              <div className="text-center py-4 space-y-4 animate-fade-in">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <Mail className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-lg font-extrabold text-slate-900">E-mail enviado!</h4>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Enviamos as instruções e o link de redefinição de senha para{' '}
                    <strong className="text-slate-800">{recoveryEmail}</strong>.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Verifique sua caixa de entrada e a pasta de spam.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSwitchScreen('login')}
                  className="w-full py-3 bg-gradient-duo text-white rounded-xl font-bold text-xs shadow-md shadow-purple-500/25 flex items-center justify-center gap-2 hover:opacity-95 transition-all mt-4"
                >
                  <span>Voltar para o Login</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* FORGOT PASSWORD FORM */}
                {authScreen === 'esqueci-senha' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail Cadastrado</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="seu-email@exemplo.com.br"
                        value={recoveryEmail}
                        onChange={(e) => {
                          setRecoveryEmail(e.target.value);
                          if (errorMsg) setErrorMsg('');
                        }}
                        className="campo-form w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                )}

                {/* SIGNUP: Nome */}
                {authScreen === 'cadastro' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Seu Nome</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="Ex: Lucas Silva"
                        value={nome}
                        onChange={(e) => {
                          setNome(e.target.value);
                          if (errorMsg) setErrorMsg('');
                        }}
                        className="campo-form w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                )}

                {/* LOGIN / SIGNUP: E-mail */}
                {authScreen !== 'esqueci-senha' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="voce@email.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errorMsg) setErrorMsg('');
                        }}
                        className="campo-form w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                )}

                {/* LOGIN / SIGNUP: Senha */}
                {authScreen !== 'esqueci-senha' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">Senha</label>
                      {authScreen === 'login' && (
                        <button
                          type="button"
                          onClick={() => handleSwitchScreen('esqueci-senha')}
                          className="text-[11px] text-purple-600 hover:text-purple-800 font-semibold transition-colors"
                        >
                          Esqueci minha senha
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errorMsg) setErrorMsg('');
                        }}
                        className="campo-form w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Password strength visual feedback for signup */}
                    {authScreen === 'cadastro' && (
                      <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl space-y-1.5 text-[11px]">
                        <p className="font-semibold text-slate-700">Requisitos da senha:</p>
                        <div className={`flex items-center gap-1.5 transition-colors ${isMinLength ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                          {isMinLength ? <Check className="w-3.5 h-3.5 shrink-0" /> : <div className="w-3 h-3 rounded-full border border-slate-300 shrink-0" />}
                          <span>Mínimo de 8 caracteres</span>
                        </div>
                        <div className={`flex items-center gap-1.5 transition-colors ${hasUppercase ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                          {hasUppercase ? <Check className="w-3.5 h-3.5 shrink-0" /> : <div className="w-3 h-3 rounded-full border border-slate-300 shrink-0" />}
                          <span>Pelo menos 1 letra maiúscula (A-Z)</span>
                        </div>
                        <div className={`flex items-center gap-1.5 transition-colors ${hasNumber ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                          {hasNumber ? <Check className="w-3.5 h-3.5 shrink-0" /> : <div className="w-3 h-3 rounded-full border border-slate-300 shrink-0" />}
                          <span>Pelo menos 1 número (0-9)</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* SIGNUP: Confirmar Senha */}
                {authScreen === 'cadastro' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmar Senha</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errorMsg) setErrorMsg('');
                        }}
                        className={`campo-form w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                          confirmPassword.length > 0 && !passwordsMatch
                            ? 'border-rose-300 focus:ring-rose-500'
                            : 'border-slate-200 focus:ring-purple-500'
                        }`}
                      />
                    </div>
                    {confirmPassword.length > 0 && (
                      <p className={`text-[11px] mt-1.5 font-medium flex items-center gap-1 ${passwordsMatch ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {passwordsMatch ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Senhas coincidem
                          </>
                        ) : (
                          <>
                            <X className="w-3.5 h-3.5" /> As senhas não coincidem
                          </>
                        )}
                      </p>
                    )}
                  </div>
                )}

                {/* SIGNUP: Salário Mensal */}
                {authScreen === 'cadastro' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Renda / Salário Mensal (R$)</label>
                    <input
                      type="number"
                      required
                      placeholder="6500"
                      value={salario}
                      onChange={(e) => {
                        setSalario(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      className="campo-form w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={enviando}
                  aria-busy={enviando}
                  className="w-full py-3 bg-gradient-duo text-white rounded-xl font-bold text-xs shadow-md shadow-purple-500/25 flex items-center justify-center gap-2 hover:opacity-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span>
                    {enviando && 'Aguarde...'}
                    {!enviando && authScreen === 'cadastro' && 'Cadastrar e Acessar'}
                    {!enviando && authScreen === 'login' && 'Entrar na Conta'}
                    {!enviando && authScreen === 'esqueci-senha' && 'Enviar link de recuperação'}
                  </span>
                  {!enviando && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            )}
          </div>

          {/* Bottom navigation link */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            {authScreen === 'login' && (
              <button
                type="button"
                onClick={() => handleSwitchScreen('cadastro')}
                className="text-xs text-purple-700 hover:text-purple-900 font-semibold transition-colors"
              >
                Ainda não tem conta? Cadastre-se grátis
              </button>
            )}
            {authScreen === 'cadastro' && (
              <button
                type="button"
                onClick={() => handleSwitchScreen('login')}
                className="text-xs text-purple-700 hover:text-purple-900 font-semibold transition-colors"
              >
                Já possui conta? Faça Login
              </button>
            )}
            {authScreen === 'esqueci-senha' && (
              <button
                type="button"
                onClick={() => handleSwitchScreen('login')}
                className="text-xs text-purple-700 hover:text-purple-900 font-semibold transition-colors"
              >
                Lembrou a senha? Voltar para o Login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
