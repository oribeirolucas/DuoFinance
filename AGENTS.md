# AGENTS.md — DuoFinance

Projeto mantido por um único desenvolvedor. O fluxo é propositalmente leve: pouca cerimônia, mas `main` sempre estável.

## Fluxo de trabalho

Duas branches de longa duração:

- **`develop`** — integração do dia a dia; base de toda tarefa.
- **`main`** — release estável; só recebe código via publicação a partir de `develop`.

Toda tarefa que altere código segue o ciclo da skill [`task-flow`](.agents/skills/task-flow/SKILL.md):

```text
pedido de tarefa → branch (de develop) → implementação → (code review opcional) → merge em develop
                                                                                     │
                                               "publicar" → merge de develop em main
```

1. **Branch** — criada a partir de `develop` atualizada, nomeada `feat/<slug>` ou `fix/<slug>`.
2. **Implementação** — diff focado em uma única tarefa; commits em Conventional Commits.
3. **Code review** — ao terminar, o agente **sempre pergunta** se deseja um review ([`code-review`](.agents/skills/code-review/SKILL.md)). É opcional e pode ser pulado.
4. **Merge em `develop`** — após o review (ou ao pular).
5. **Publicação (`develop` → `main`)** — só a pedido explícito ("publicar"), com gates verdes e confirmação.

## Convenção de branch e merge

- **Branches de longa duração:** `develop` (integração) e `main` (release). Resolver `main` dinamicamente com `git symbolic-ref refs/remotes/origin/HEAD`, nunca presumir.
- **Branches de trabalho:** `feat/<slug-curto>` ou `fix/<slug-curto>`, em minúsculas com hífens, sempre a partir de `develop`.
- **Merge:** `git merge --no-ff <branch>` por padrão, para preservar o ponto de integração de cada tarefa. (Trocar para fast-forward se preferir histórico linear — registrar a preferência aqui.)
- **Publicação:** `develop → main` apenas sob pedido explícito, após `npm run lint` + `npm run build` verdes e confirmação do diff `main..develop`.
- **Push:** nunca automático. O agente pergunta antes de `git push origin develop` e de `git push origin main`.
- **Limpeza:** após merge, o agente pergunta se deve apagar a branch (`git branch -d`).

## Mensagens de commit

Conventional Commits, resumo imperativo curto (até ~50 caracteres), sem ponto final:

```text
<tipo>(<escopo opcional>): <resumo>
```

Tipos usuais: `feat`, `fix`, `refactor`, `style`, `docs`, `chore`, `test`.

## Gates de verificação

Rodar antes de concluir uma tarefa / fazer merge:

- `npm run lint` — type-check (`tsc --noEmit`).
- `npm run build` — quando a mudança toca código que entra no bundle.
- QA manual na superfície real (`npm run dev`) quando o comportamento não for comprovável só por verificação estática.

Não concluir com gate aplicável falhando. Falha preexistente deve ser reproduzida na base e declarada, não usada para mascarar regressão.

## Segurança

- Nenhum segredo/token no código do cliente ou no diff.
- `VITE_*` pode carregar apenas identificadores **públicos** — hoje `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. A chave publicável identifica o projeto e não autoriza nada por si só: quem autoriza é o JWT do usuário, e o alcance dele é decidido pelas policies de RLS. Cada nova variável `VITE_*` precisa ser justificada no PR.
- Qualquer valor que conceda autoridade sozinho — `service_role`, chaves de API, segredos de webhook, credenciais SMTP — nunca entra no repositório, em `.env*` versionado, em `VITE_*`, nem em arquivo que o Vite empacote. Vive só no dashboard do Supabase ou em secrets de Edge Function.
- Autorização mora em RLS e em funções `SECURITY DEFINER`, não no cliente. Filtro no front é conveniência de UI, nunca fronteira de segurança.
- Validar entrada externa antes do uso. A validação que protege precisa existir também no servidor: `NOT NULL`, `CHECK` e tipos reais no banco, não só no formulário.

## Skills do projeto

Ficam em `.agents/skills/` (agnósticas de IDE):

- **task-flow** — orquestra o ciclo branch → implementação → review → merge.
- **code-review** — revisão read-only, baseada em evidências, de uma branch local ou PR.
