---
name: task-flow
description: Orquestrar o ciclo de trabalho de um desenvolvedor solo no DuoFinance. Usar quando o usuário pedir para "fazer a tarefa X", "implementar Y", "corrigir Z" ou iniciar qualquer trabalho que gere mudança de código, e também quando pedir para "publicar", "lançar" ou "subir para produção". Abre uma branch de trabalho a partir de `develop`, conduz a implementação, oferece o code review ao terminar, faz o merge em `develop` e, no comando de publicação, mescla `develop` em `main`. Não usar para perguntas, exploração sem alteração de código ou dúvidas pontuais.
---

# Task Flow — DuoFinance (dev solo)

Fluxo leve de ponta a ponta para um único desenvolvedor, com duas branches de longa duração:

- **`develop`** — integração do dia a dia; é a base de toda tarefa.
- **`main`** — branch de release estável; só recebe código via publicação a partir de `develop`.

```text
pedido de tarefa → branch (a partir de develop) → implementação → (code review opcional) → merge em develop
                                                                                              │
                                                        "publicar" → merge de develop em main
```

Trabalho fica numa branch dedicada; `develop` só recebe código que passou pelos gates; `main` só recebe `develop` via publicação explícita.

Nunca fazer commit, merge ou push sem que a etapa correspondente deste fluxo autorize. Confirmações destrutivas (reescrever história, apagar branch com trabalho) exigem aprovação explícita.

## 1. Abrir a branch (a partir de `develop`)

Ao receber um pedido de tarefa que vá alterar código:

1. Garantir árvore limpa. Se houver mudanças não commitadas, perguntar antes de prosseguir (não descartar trabalho).
2. Confirmar que `develop` existe. Se não existir, criá-la a partir da branch principal uma única vez e avisar o usuário:

   ```bash
   git show-ref --verify --quiet refs/heads/develop || git checkout -b develop main
   ```

3. Atualizar `develop` e criar a branch de trabalho a partir dela:

   ```bash
   git checkout develop
   git pull --ff-only origin develop   # se houver remoto configurado e acessível
   git checkout -b <tipo>/<slug-curto>
   ```

   - `<tipo>`: `feat` para funcionalidade, `fix` para correção.
   - `<slug-curto>`: resumo da tarefa em minúsculas com hífens (ex.: `feat/filtro-por-periodo`).
   - Se a branch já existir, perguntar se o usuário quer reutilizá-la ou criar outra.
4. Confirmar ao usuário a branch criada e o resumo do que será feito.

## 2. Implementar

Implementar a tarefa seguindo o `AGENTS.md` e os padrões do projeto. Durante a implementação:

- manter o diff focado na tarefa;
- rodar os gates do projeto conforme avança: `npm run lint` (type-check) e `npm run build` quando tocar o bundle;
- commitar em incrementos lógicos com mensagens no formato Conventional Commits (`feat:`, `fix:`, `refactor:`, ...).

Só commitar quando a mudança estiver coerente e os gates aplicáveis passarem. Relatar qualquer gate que falhe antes de seguir.

## 3. Oferecer o code review

Ao concluir a implementação (tarefa pronta, gates verdes, mudanças commitadas na branch), **sempre perguntar**:

```text
Tarefa concluída na branch <branch>. Deseja um code review antes do merge em develop?
1. Sim — rodar a skill code-review sobre esta branch
2. Não — pular e ir direto ao merge
```

Não fazer merge antes dessa resposta.

- Se **sim**: invocar a skill `code-review` sobre a branch atual (base = `develop`; head = branch de trabalho). Seguir o parecer:
  - `APROVADO`: seguir para o merge (etapa 4).
  - `REPROVADO`: apresentar os bloqueadores, perguntar se o usuário quer corrigir agora (volta à etapa 2) ou mesmo assim prosseguir. Não fazer merge de branch reprovada sem confirmação explícita.
- Se **não**: seguir direto para o merge (etapa 4).

## 4. Fazer o merge em `develop`

Antes do merge, garantir árvore limpa. Então:

```bash
git checkout develop
git pull --ff-only origin develop       # se houver remoto acessível
git merge --no-ff <branch> -m "<mensagem do merge>"
```

- Usar `--no-ff` para preservar o ponto de integração de cada tarefa. Se o usuário preferir histórico linear, usar `--ff-only` — perguntar na primeira vez e seguir a preferência registrada no `AGENTS.md`.
- Após o merge, se houver remoto configurado, perguntar se deve `git push origin develop`. Não fazer push automático sem confirmação.
- Perguntar se deve apagar a branch de trabalho já mesclada (`git branch -d <branch>`).

Relatar ao usuário: branch mesclada em `develop`, commit de merge, estado dos gates e se o push/limpeza foram feitos.

A tarefa termina em `develop`. **Nada vai para `main` aqui** — isso só acontece na publicação (etapa 5), sob pedido explícito.

## 5. Publicar (`develop` → `main`)

Executar **somente** quando o usuário pedir explicitamente para "publicar", "lançar" ou "subir para produção". `main` é a branch de release.

1. Garantir árvore limpa e confirmar a branch principal — não presumir:

   ```bash
   git symbolic-ref refs/remotes/origin/HEAD --short   # ex.: origin/main
   ```

2. Rodar os gates de sanidade em `develop` antes de tocar `main`:

   ```bash
   git checkout develop
   git pull --ff-only origin develop       # se houver remoto acessível
   npm run lint
   npm run build
   ```

   Se qualquer gate falhar, **parar** e relatar; não publicar código quebrado em `main`.

3. Mostrar ao usuário o que será publicado e **pedir confirmação explícita** antes do merge:

   ```bash
   git log --oneline main..develop         # commits que entrarão em main
   git diff --stat main..develop
   ```

4. Com a confirmação, mesclar `develop` em `main`:

   ```bash
   git checkout main
   git pull --ff-only origin main          # se houver remoto acessível
   git merge --no-ff develop -m "release: <resumo da publicação>"
   ```

5. Perguntar se deve `git push origin main`. Nunca fazer push de `main` automaticamente.
6. Voltar para `develop` ao final (`git checkout develop`) para o trabalho seguir dali.

Relatar: commits publicados, commit de merge em `main`, estado dos gates e se o push foi feito.

## Regras

- Toda tarefa nasce de `develop`; `main` só recebe código via publicação (etapa 5).
- Mapear a branch principal pelo repositório, nunca por suposição.
- Não misturar mais de uma tarefa na mesma branch.
- Não fazer commit, merge ou push sem autorização da etapa correspondente.
- A publicação em `main` só ocorre a pedido explícito, com gates verdes e confirmação.
- Preservar trabalho não commitado: perguntar antes de qualquer operação que possa descartá-lo.
- Para tarefas triviais e inequívocas (ex.: corrigir um typo isolado), oferecer pular a cerimônia e perguntar se o usuário prefere editar direto — mas o default continua sendo este fluxo.
