# Coleta de contexto

Este projeto não usa Jira, CodeGraph nem CodeRabbit. O contexto vem do Git local e, **quando houver PR**, do GitHub. O escopo da mudança é derivado dos commits e da descrição da tarefa (e da descrição/comentários do PR, se existir). No fluxo padrão do dev solo (`task-flow`), a revisão é de uma branch local contra `develop`, sem PR.

## Git local

Coletar:

```bash
git status --short --branch
git remote -v
git branch --all
git log --oneline --decorate -20
```

Depois de resolver base e head:

```bash
git merge-base <base> <head>
git diff --stat <merge-base>..<head>
git diff --name-status <merge-base>..<head>
git log --oneline <merge-base>..<head>
```

Inspecionar o diff completo e abrir os arquivos no estado da branch avaliada. Se o review ocorrer fora da branch, usar `git show <head>:<path>` ou um worktree temporário seguro; não trocar a branch do usuário.

Verificar:

- base real e conflitos;
- mistura de escopos ou mudanças alheias no diff;
- arquivos não commitados que não pertencem à tarefa;
- configuração, variáveis de ambiente e build que a mudança afete.

## GitHub e PR (somente quando houver PR)

Esta seção se aplica apenas quando a revisão é de um PR. No fluxo local sem PR, pular tudo abaixo.

Usar `gh` (read-only). Resolver primeiro o repositório, a branch e todos os PRs dessa branch. Nunca executar `gh pr view` sem número explícito.

```bash
gh repo view --json nameWithOwner,defaultBranchRef
git branch --show-current

gh pr list --state all --head '<branch-exata>' \
  --json number,title,body,headRefName,baseRefName,state,url,reviewDecision

gh pr view <numero-explicito> \
  --json number,url,title,body,state,isDraft,author,headRefName,headRefOid,baseRefName,baseRefOid,reviewDecision,mergeStateStatus,changedFiles,additions,deletions,commits,statusCheckRollup,comments,reviews

gh api repos/{owner}/{repo}/pulls/<numero>/reviews --paginate
gh api repos/{owner}/{repo}/pulls/<numero>/comments --paginate
gh api repos/{owner}/{repo}/issues/<numero>/comments --paginate
```

Comparar `headRefOid` com o commit local avaliado para garantir que a análise é do estado correto.

Usar `scripts/fetch_pr_threads.py --repo OWNER/REPO --pr NUMERO` desta skill para obter `isResolved`, `isOutdated` e âncoras das threads via GraphQL. A API REST isolada não representa com fidelidade todo o estado de resolução.

Para comentários humanos de review:

- preservar arquivo, linha, estado da thread e commit referenciado;
- verificar cada achado no head atual (pode estar obsoleto);
- um check verde comprova apenas que o workflow terminou, não ausência de problemas.

## Versões e dependências

Ler `package.json`, o lockfile (`bun.lock`/`package-lock.json`/`yarn.lock`), `node -v` e a versão do gerenciador de pacotes. Usar a versão efetiva, não a memória do modelo.

Avaliar o uso idiomático de React 19, TypeScript e das libs do projeto (Vite, Tailwind, Recharts, motion, lucide-react). Não transformar "mais novo" em regra absoluta: compatibilidade, clareza, segurança e padrões já consolidados no projeto continuam vinculantes.

## Limitações

Registrar de forma explícita:

- GitHub indisponível ou PR ambíguo;
- descrição do PR insuficiente para derivar requisitos;
- branch remota ausente;
- diff grande demais para validação completa;
- comentário ou thread inacessível;
- gate não executável por limitação ambiental.

Uma limitação essencial impede aprovação; não deve ser reescrita como defeito da implementação.
