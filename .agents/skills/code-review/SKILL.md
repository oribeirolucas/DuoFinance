---
name: code-review
description: Revisar implementações do DuoFinance a partir de uma branch local (antes do merge) ou de um Pull Request no GitHub, correlacionando a descrição da tarefa, os commits, a branch, o diff, a arquitetura React/TypeScript, segurança básica de frontend e cobertura de verificação (type-check e build). Usar quando o usuário pedir code review, aprovação, reprovação, conferência da implementação, revisão de PR ou plano de correção, ou quando a skill `task-flow` encaminhar uma branch concluída para revisão antes do merge. A revisão é somente leitura e baseada em evidências.
---

# Code Review — DuoFinance

Conduzir uma revisão somente leitura, rastreável e baseada em evidências. Não corrigir código, não fazer merge, não alterar o GitHub, não criar plano e não publicar comentários durante a revisão inicial.

Esta skill cobre dois cenários:

- **Branch local, antes do merge** (fluxo padrão do dev solo, acionado pela skill `task-flow`): compara a branch de trabalho contra a branch de integração (`develop`), sem exigir PR aberto.
- **Pull Request no GitHub**: quando existe um PR, inclui a leitura da descrição, comentários e threads.

O escopo e os requisitos da mudança vêm da **descrição da tarefa, dos commits e — quando houver — da descrição e comentários do PR**. Este projeto não usa Jira, CodeGraph nem CodeRabbit. Toda inferência de intenção precisa estar ancorada nessas fontes e confirmada no diff.

Ler, conforme a etapa:

- [references/context-collection.md](references/context-collection.md) antes de consultar Git e GitHub;
- [references/review-checklist.md](references/review-checklist.md) antes de analisar o diff;
- [references/output-contract.md](references/output-contract.md) antes de consolidar e responder;
- [references/correction-plan.md](references/correction-plan.md) somente se o usuário autorizar a criação do plano.

## 1. Preparar o review

1. Identificar o alvo: a branch atual de trabalho (caso padrão), uma branch indicada ou um número de PR explícito.
2. Ler o `AGENTS.md` da raiz (se existir) e os padrões do projeto antes de opinar sobre arquitetura.
3. Confirmar a raiz do repositório, a branch atual, o worktree e as versões efetivas de Node, do gerenciador de pacotes e das dependências relevantes (`package.json`), sem supor pela memória do modelo.
4. Não trocar de branch, fazer checkout, rebase, commit, push, merge ou editar arquivos.
5. Não assumir que a branch atual pertence a um PR específico. Localizar branch e PR por evidências.

## 2. Localizar base, head e (opcionalmente) o Pull Request

Determinar a **base** e o **head**:

- head = a branch de trabalho em revisão (atual, salvo indicação em contrário);
- base = a branch de integração **`develop`** no fluxo padrão (tarefa antes do merge). Quando a revisão for de uma publicação (`develop` → `main`), a base é a branch principal, resolvida dinamicamente:

```bash
git symbolic-ref refs/remotes/origin/HEAD --short   # ex.: origin/main
```

Se existir um PR para a branch (opcional neste fluxo), usar a base real do PR (`baseRefName`) e comparar `headRefOid` com o commit local avaliado. Localizar o PR por:

1. número fornecido explicitamente pelo usuário;
2. PR aberto cuja branch (`headRefName`) corresponda à branch em revisão.

Comparar sempre:

```text
merge-base(base, head)..head
```

Separar:

- diff implementado pela branch;
- alterações não commitadas do worktree;
- arquivos herdados da base ou de outro escopo.

Concentrar achados no diff. Só abrir bloqueador sobre código legado não alterado quando a mudança depender diretamente dele, ampliar seu risco ou introduzir regressão.

Se não houver PR, a revisão prossegue normalmente sobre o diff local — o PR é opcional neste projeto.

## 3. Ler o PR (quando existir)

Com `gh` disponível e havendo um PR, ler metadados, descrição, commits, diff, arquivos alterados, checks, reviews, comentários gerais, comentários inline e threads. Sem PR, pular esta etapa e derivar o escopo dos commits e da descrição da tarefa.

Usar `scripts/fetch_pr_threads.py --repo OWNER/REPO --pr NUMERO` para coletar comentários, reviews e threads com estado `isResolved`/`isOutdated` e âncoras. Sempre fornecer repositório e número explícitos. A API REST isolada não representa com fidelidade todo o estado de resolução das threads.

Para cada thread/comentário humano relevante:

- verificar contra o código atual, pois o comentário pode estar obsoleto;
- classificar como `confirmado`, `resolvido`, `falso positivo` ou `não verificável`;
- incorporar somente achados confirmados como falhas próprias.

Checks ausentes ou workflows sem evento `pull_request` não comprovam qualidade. Executar localmente os gates aplicáveis (seção 6).

## 4. Construir a matriz de rastreabilidade

Como não há Jira, derivar os requisitos observáveis da **descrição da tarefa, dos commits e — quando houver PR — da descrição e comentários do PR**. Para cada requisito:

1. decompor a descrição/commits em requisitos observáveis;
2. mapear cada requisito para arquivos, comportamento e evidência no diff;
3. confirmar no diff e no código atual os caminhos relevantes;
4. marcar `atendido`, `parcial`, `não atendido` ou `não verificável`;
5. identificar implementação fora do escopo declarado;
6. distinguir falha real de preferência estética.

Requisito parcial, ausente ou contradito pela implementação é bloqueador quando altera o comportamento solicitado. Se a descrição da tarefa/PR for insuficiente para derivar requisitos, registrar como limitação e pedir contexto ao usuário em vez de inventar aceite.

## 5. Distribuir entre subagentes (quando disponível)

Usar subagentes quando houver slots disponíveis, mantendo o agente principal como orquestrador e responsável pela leitura central (diff, commits e PR quando houver) e pela consolidação.

Criar de duas a quatro frentes independentes, ajustadas ao diff:

1. **Requisitos e comportamento:** rastreabilidade descrição/commits → implementação → verificação.
2. **Arquitetura e qualidade:** componentes, estado, hooks, tipos TypeScript, legibilidade e manutenção.
3. **Segurança e dados:** validação de entrada, exposição de segredos, uso seguro de APIs externas, sanitização de dados renderizados.
4. **Verificação, Git e PR:** type-check, build, escopo da branch e, quando houver, threads do PR.

Entregar a cada subagente apenas: requisitos e comentários relevantes; base, head e arquivos do escopo; checklist aplicável; comando de validação seguro; formato de retorno. Proibir edições e ações externas. Exigir retorno:

```text
Escopo:
Requisitos avaliados:
Achados bloqueadores:
Achados não bloqueadores:
Verificações/comandos:
Limitações:
```

O agente principal verifica os bloqueadores no código atual, elimina duplicatas e resolve divergências. Se subagentes não estiverem disponíveis, executar as mesmas frentes sequencialmente e declarar a limitação.

## 6. Validar sem modificar

Executar os gates do projeto proporcionais ao diff, sem autofix e sem alterar arquivos:

- **Type-check / lint:** `npm run lint` (equivale a `tsc --noEmit` neste projeto).
- **Build:** `npm run build` quando o diff tocar código que entra no bundle.
- QA manual na superfície real (`npm run dev` / `npm run preview`) quando o comportamento não puder ser comprovado só por verificação estática — relatar como QA manual, não executar o servidor como parte automática do review.

Distinguir:

- falha introduzida pela branch;
- falha preexistente reproduzida na base;
- comando não executável por limitação ambiental.

Não aprovar com gate aplicável falhando, requisito relevante sem evidência ou risco crítico não resolvido.

## 7. Determinar o parecer

Usar somente:

- `APROVADO`: todos os requisitos declarados estão atendidos e não existe bloqueador funcional, arquitetural, de segurança ou de verificação.
- `REPROVADO`: existe ao menos um bloqueador confirmado ou falta evidência essencial para afirmar conformidade.

Sugestões não bloqueadoras não reprovam isoladamente.

## 8. Entregar e pausar

Responder no contrato de [references/output-contract.md](references/output-contract.md), com uma matriz de requisitos e um resumo geral.

Ao final, perguntar se o usuário deseja:

1. criar um plano de correção na raiz do projeto;
2. (**somente quando houver PR**) publicar o resumo/comentários no PR;
3. encerrar sem escritas.

Quando a revisão for de uma **branch local sem PR**, a opção 2 não se aplica — oferecer apenas o plano de correção ou encerrar, e devolver o parecer ao fluxo `task-flow` para decidir sobre o merge.

Não executar nenhuma dessas opções antes de confirmação explícita. Para publicação em PR, mostrar antes os alvos e o texto resumido. Um parecer `REPROVADO` deve resultar em resumo compatível com `Request changes`; `APROVADO`, com aprovação formal, somente se o usuário autorizar a ação.

Se o usuário autorizar o plano, ler [references/correction-plan.md](references/correction-plan.md) e criar o arquivo na raiz: `pr-<numero>-plano-correcao.md` quando houver PR, ou `<branch-slug>-plano-correcao.md` para branch local. Não implementar o plano.
