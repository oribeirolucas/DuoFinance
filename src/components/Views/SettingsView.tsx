import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { User as UserIcon, Camera, Lock, Mail, Check, AlertCircle, Loader2, Download, Trash2 } from 'lucide-react';

/** Mensagem presa a um bloco do formulário, em vez de um toast global. */
type Aviso = { tipo: 'ok' | 'erro'; texto: string } | null;

const Bloco: React.FC<{
  titulo: string;
  descricao: string;
  icone: React.ReactNode;
  children: React.ReactNode;
}> = ({ titulo, descricao, icone, children }) => (
  <section className="bento-card p-6">
    <header className="flex items-start gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
      <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
        {icone}
      </div>
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{titulo}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{descricao}</p>
      </div>
    </header>
    {children}
  </section>
);

const Mensagem: React.FC<{ aviso: Aviso }> = ({ aviso }) => {
  if (!aviso) return null;
  const ok = aviso.tipo === 'ok';
  return (
    <p
      role="status"
      className={`mt-3 text-xs flex items-start gap-1.5 ${
        ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
      }`}
    >
      {ok ? <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
      <span>{aviso.texto}</span>
    </p>
  );
};

const rotuloBotao = 'px-4 py-2.5 rounded-xl bg-gradient-duo text-white font-bold text-xs shadow-md shadow-purple-500/20 hover:opacity-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2';
const rotuloCampo = 'block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1';
const classeCampo = 'campo-form w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500';

export const SettingsView: React.FC = () => {
  const {
    currentUser, atualizarPerfil, enviarFotoPerfil, trocarSenha, trocarEmail,
    exportarMeusDados, excluirMinhaConta, partner,
  } = useApp();

  const temParceiro = partner !== null;
  const nomeDoParceiro = partner?.nome.split(' ')[0] ?? 'seu parceiro(a)';

  const [nome, setNome] = useState(currentUser.nome);
  const [salario, setSalario] = useState(String(currentUser.salario));
  const [avisoPerfil, setAvisoPerfil] = useState<Aviso>(null);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [avisoFoto, setAvisoFoto] = useState<Aviso>(null);
  const inputArquivo = useRef<HTMLInputElement>(null);

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [avisoSenha, setAvisoSenha] = useState<Aviso>(null);
  const [trocandoSenha, setTrocandoSenha] = useState(false);

  const [novoEmail, setNovoEmail] = useState('');
  const [avisoEmail, setAvisoEmail] = useState<Aviso>(null);
  const [trocandoEmail, setTrocandoEmail] = useState(false);

  const [baixando, setBaixando] = useState(false);
  const [avisoDados, setAvisoDados] = useState<Aviso>(null);

  const [senhaExclusao, setSenhaExclusao] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [avisoExclusao, setAvisoExclusao] = useState<Aviso>(null);

  const baixarDados = async () => {
    setAvisoDados(null);
    setBaixando(true);
    try {
      const ok = await exportarMeusDados();
      setAvisoDados(
        ok
          ? { tipo: 'ok', texto: 'Arquivo gerado. Confira os downloads do navegador.' }
          : { tipo: 'erro', texto: 'Não foi possível gerar o arquivo. Tente novamente.' }
      );
    } finally {
      setBaixando(false);
    }
  };

  const excluirConta = async (e: React.FormEvent) => {
    e.preventDefault();
    setAvisoExclusao(null);
    setExcluindo(true);
    try {
      const ok = await excluirMinhaConta(senhaExclusao);
      // Em caso de sucesso o signOut já derrubou a sessão e a tela de login
      // assume sozinha; não há o que avisar nesta tela, que deixa de existir.
      if (!ok) {
        setAvisoExclusao({ tipo: 'erro', texto: 'Não foi possível excluir. Confira a senha e tente de novo.' });
        setExcluindo(false);
      }
    } catch {
      setAvisoExclusao({ tipo: 'erro', texto: 'Não foi possível excluir. Tente novamente.' });
      setExcluindo(false);
    }
  };

  // O perfil chega do banco depois da primeira renderização; sem isto os
  // campos ficariam presos no valor de placeholder que existia ao montar.
  useEffect(() => {
    setNome(currentUser.nome);
    setSalario(String(currentUser.salario));
  }, [currentUser.id, currentUser.nome, currentUser.salario]);

  const senhaForte = novaSenha.length >= 8 && /[A-Z]/.test(novaSenha) && /[0-9]/.test(novaSenha);

  const salvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setAvisoPerfil(null);
    if (!nome.trim()) {
      setAvisoPerfil({ tipo: 'erro', texto: 'O nome não pode ficar vazio.' });
      return;
    }
    const valorSalario = Number(salario.replace(',', '.'));
    if (Number.isNaN(valorSalario) || valorSalario < 0) {
      setAvisoPerfil({ tipo: 'erro', texto: 'Informe um salário válido.' });
      return;
    }

    setSalvandoPerfil(true);
    const ok = await atualizarPerfil({ nome, salario: valorSalario });
    setSalvandoPerfil(false);
    setAvisoPerfil(ok
      ? { tipo: 'ok', texto: 'Dados salvos.' }
      : { tipo: 'erro', texto: 'Não foi possível salvar. Tente novamente.' });
  };

  const escolherFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setAvisoFoto(null);
    setEnviandoFoto(true);
    const url = await enviarFotoPerfil(arquivo);
    if (url) {
      const ok = await atualizarPerfil({ avatar: url });
      setAvisoFoto(ok
        ? { tipo: 'ok', texto: 'Foto atualizada.' }
        : { tipo: 'erro', texto: 'A imagem subiu, mas o perfil não foi salvo.' });
    } else {
      setAvisoFoto({ tipo: 'erro', texto: 'Não foi possível enviar a imagem.' });
    }
    setEnviandoFoto(false);
    // Permite reenviar o mesmo arquivo: sem isto, escolher a mesma imagem de
    // novo não dispara o evento de mudança.
    if (inputArquivo.current) inputArquivo.current.value = '';
  };

  const salvarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setAvisoSenha(null);
    if (!senhaForte) {
      setAvisoSenha({ tipo: 'erro', texto: 'A nova senha precisa de 8 caracteres, 1 maiúscula e 1 número.' });
      return;
    }
    if (novaSenha !== confirmaSenha) {
      setAvisoSenha({ tipo: 'erro', texto: 'A confirmação não confere.' });
      return;
    }
    setTrocandoSenha(true);
    const ok = await trocarSenha(senhaAtual, novaSenha);
    setTrocandoSenha(false);
    if (ok) {
      setSenhaAtual(''); setNovaSenha(''); setConfirmaSenha('');
      setAvisoSenha({ tipo: 'ok', texto: 'Senha alterada.' });
    } else {
      setAvisoSenha({ tipo: 'erro', texto: 'Não foi possível alterar. Confira a senha atual.' });
    }
  };

  const salvarEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setAvisoEmail(null);
    if (!/^\S+@\S+\.\S+$/.test(novoEmail.trim())) {
      setAvisoEmail({ tipo: 'erro', texto: 'Informe um e-mail válido.' });
      return;
    }
    setTrocandoEmail(true);
    const ok = await trocarEmail(novoEmail);
    setTrocandoEmail(false);
    if (ok) {
      setNovoEmail('');
      setAvisoEmail({ tipo: 'ok', texto: 'Enviamos um link de confirmação para o novo endereço. A troca só vale depois que você clicar nele.' });
    } else {
      setAvisoEmail({ tipo: 'erro', texto: 'Não foi possível alterar o e-mail.' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Configurações da conta</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Seus dados pessoais e de acesso. Alterações aqui não afetam os lançamentos do casal.
        </p>
      </div>

      <Bloco
        titulo="Foto de perfil"
        descricao="JPG, PNG, WEBP ou GIF, até 2 MB."
        icone={<Camera className="w-4 h-4" />}
      >
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatar}
            alt={`Foto de ${currentUser.nome}`}
            className="w-20 h-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
          />
          <div>
            <input
              ref={inputArquivo}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={escolherFoto}
              className="hidden"
              id="foto-perfil"
            />
            <label
              htmlFor="foto-perfil"
              className={`${rotuloBotao} inline-flex cursor-pointer ${enviandoFoto ? 'opacity-60 pointer-events-none' : ''}`}
            >
              {enviandoFoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              <span>{enviandoFoto ? 'Enviando...' : 'Escolher imagem'}</span>
            </label>
            <Mensagem aviso={avisoFoto} />
          </div>
        </div>
      </Bloco>

      <Bloco
        titulo="Dados pessoais"
        descricao="Como você aparece para sua dupla."
        icone={<UserIcon className="w-4 h-4" />}
      >
        <form onSubmit={salvarPerfil} className="space-y-4">
          <div>
            <label htmlFor="cfg-nome" className={rotuloCampo}>Nome</label>
            <input
              id="cfg-nome"
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              className={classeCampo}
            />
          </div>

          <div>
            <label htmlFor="cfg-salario" className={rotuloCampo}>Renda mensal (R$)</label>
            <input
              id="cfg-salario"
              type="number"
              step="0.01"
              min="0"
              value={salario}
              onChange={e => setSalario(e.target.value)}
              className={classeCampo}
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Usada na divisão proporcional das contas. Hoje: {formatCurrency(currentUser.salario)}.
            </p>
          </div>

          <button type="submit" disabled={salvandoPerfil} className={rotuloBotao}>
            {salvandoPerfil && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{salvandoPerfil ? 'Salvando...' : 'Salvar dados'}</span>
          </button>
          <Mensagem aviso={avisoPerfil} />
        </form>
      </Bloco>

      <Bloco
        titulo="Senha"
        descricao="Pedimos a senha atual antes de trocar."
        icone={<Lock className="w-4 h-4" />}
      >
        <form onSubmit={salvarSenha} className="space-y-4">
          <div>
            <label htmlFor="cfg-senha-atual" className={rotuloCampo}>Senha atual</label>
            <input
              id="cfg-senha-atual"
              type="password"
              autoComplete="current-password"
              value={senhaAtual}
              onChange={e => setSenhaAtual(e.target.value)}
              className={classeCampo}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="cfg-senha-nova" className={rotuloCampo}>Nova senha</label>
              <input
                id="cfg-senha-nova"
                type="password"
                autoComplete="new-password"
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                className={classeCampo}
              />
            </div>
            <div>
              <label htmlFor="cfg-senha-confirma" className={rotuloCampo}>Repita a nova senha</label>
              <input
                id="cfg-senha-confirma"
                type="password"
                autoComplete="new-password"
                value={confirmaSenha}
                onChange={e => setConfirmaSenha(e.target.value)}
                className={classeCampo}
              />
            </div>
          </div>

          {novaSenha.length > 0 && (
            <p className={`text-[11px] ${senhaForte ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>
              Mínimo de 8 caracteres, com uma letra maiúscula e um número.
            </p>
          )}

          <button
            type="submit"
            disabled={trocandoSenha || !senhaAtual || !novaSenha}
            className={rotuloBotao}
          >
            {trocandoSenha && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{trocandoSenha ? 'Alterando...' : 'Alterar senha'}</span>
          </button>
          <Mensagem aviso={avisoSenha} />
        </form>
      </Bloco>

      <Bloco
        titulo="E-mail de acesso"
        descricao={`Atualmente ${currentUser.email || '—'}.`}
        icone={<Mail className="w-4 h-4" />}
      >
        <form onSubmit={salvarEmail} className="space-y-4">
          <div>
            <label htmlFor="cfg-email" className={rotuloCampo}>Novo e-mail</label>
            <input
              id="cfg-email"
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              value={novoEmail}
              onChange={e => setNovoEmail(e.target.value)}
              className={classeCampo}
            />
          </div>

          <button type="submit" disabled={trocandoEmail || !novoEmail} className={rotuloBotao}>
            {trocandoEmail && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{trocandoEmail ? 'Enviando...' : 'Alterar e-mail'}</span>
          </button>
          <Mensagem aviso={avisoEmail} />
        </form>
      </Bloco>

      <Bloco
        titulo="Seus dados"
        descricao="Baixe uma cópia de tudo que esta conta enxerga, em formato legível por outro sistema."
        icone={<Download className="w-4 h-4" />}
      >
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          O arquivo traz perfil, lançamentos, metas, orçamento e dívidas. Se você está em
          uma parceria, inclui também o que é do casal — porque já é visível para você no app.
        </p>
        <button type="button" onClick={baixarDados} disabled={baixando} className={rotuloBotao}>
          {baixando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          <span>{baixando ? 'Reunindo...' : 'Baixar meus dados (JSON)'}</span>
        </button>
        <Mensagem aviso={avisoDados} />
      </Bloco>

      <Bloco
        titulo="Excluir a conta"
        descricao="Apaga sua conta e seus dados. Não há como desfazer."
        icone={<Trash2 className="w-4 h-4" />}
      >
        {/* O texto muda conforme haja parceiro, porque o que acontece com os
            lançamentos também muda. Prometer "apaga tudo" para quem está numa
            parceria seria mentira: os lançamentos são do casal e ficam. */}
        <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
          <p className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
            {temParceiro ? (
              <>
                Você está em uma parceria. Sua conta, seu perfil e sua foto são apagados,
                e <strong>os lançamentos do casal ficam com {nomeDoParceiro}</strong> — inclusive
                os que você registrou, que passam a não ter autor. Isso não dá para desfazer.
              </>
            ) : (
              <>
                Sua conta e <strong>todos os seus lançamentos, metas, dívidas e orçamento
                são apagados</strong> do banco. Isso não dá para desfazer.
              </>
            )}
          </p>
        </div>

        <form onSubmit={excluirConta} className="space-y-4">
          <div>
            <label htmlFor="cfg-senha-exclusao" className={rotuloCampo}>
              Confirme com sua senha
            </label>
            <input
              id="cfg-senha-exclusao"
              type="password"
              autoComplete="current-password"
              value={senhaExclusao}
              onChange={e => setSenhaExclusao(e.target.value)}
              className={classeCampo}
            />
          </div>

          <div>
            <label htmlFor="cfg-confirma-exclusao" className={rotuloCampo}>
              Digite <span className="font-mono font-bold">EXCLUIR</span> para liberar o botão
            </label>
            <input
              id="cfg-confirma-exclusao"
              type="text"
              autoComplete="off"
              value={confirmacao}
              onChange={e => setConfirmacao(e.target.value)}
              className={classeCampo}
            />
          </div>

          <button
            type="submit"
            disabled={excluindo || !senhaExclusao || confirmacao.trim().toUpperCase() !== 'EXCLUIR'}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {excluindo && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{excluindo ? 'Excluindo...' : 'Excluir minha conta'}</span>
          </button>
          <Mensagem aviso={avisoExclusao} />
        </form>
      </Bloco>
    </div>
  );
};
