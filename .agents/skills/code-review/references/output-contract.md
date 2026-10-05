# Contrato de saída

Produzir um relatório curto, mas suficiente para decisão. Não despejar logs nem todos os detalhes dos subagentes.

## Cabeçalho

Com PR:

```markdown
# Code review — PR #123

PR: #123 — <título> (<base> ← <head>)
Escopo: <resumo derivado da descrição/commits do PR>
Parecer geral: APROVADO | REPROVADO
```

Branch local sem PR (fluxo `task-flow`):

```markdown
# Code review — <branch> → develop

Branch: <branch> (base: develop)
Escopo: <resumo derivado dos commits/descrição da tarefa>
Parecer geral: APROVADO | REPROVADO
```

## Matriz de requisitos

Usar obrigatoriamente, uma linha por requisito observável derivado da tarefa/commits (e do PR quando houver):

| Requisito | Status | Evidência / comentário |
| --- | --- | --- |
| Exibir saldo consolidado | atendido | `src/components/Balance.tsx:40`; estados vazio/erro tratados |
| Filtrar por período | parcial | filtro aplicado, mas sem estado de erro; `src/...:88` |

Status possíveis: `atendido`, `parcial`, `não atendido`, `não verificável`.

O comentário deve sintetizar: requisito atendido ou bloqueador, impacto, uma ou duas evidências decisivas (`arquivo:linha`) e o estado da verificação relacionada.

## Achados consolidados

Se reprovado, ordenar bloqueadores por impacto:

```markdown
## Bloqueadores

1. **[Segurança] Título objetivo** — impacto e requisito violado. Evidência: `arquivo:linha`.
2. ...
```

Depois, se houver:

```markdown
## Observações não bloqueadoras

- ...
```

Não repetir o mesmo achado em várias seções.

## Comentários de review (humanos)

Quando houver threads/comentários no PR, resumir:

```markdown
## Comentários do PR

- Confirmados: N
- Resolvidos no head atual: N
- Falsos positivos: N
- Não verificáveis: N
- Decisivos: ...
```

## Verificações

Listar somente comandos executados e resultados objetivos:

```markdown
## Verificações

- `npm run lint` (tsc --noEmit): sem erros.
- `npm run build`: build concluído.
- Não executado: QA manual da tela X requer dados que não possuo.
```

Separar falha preexistente comprovada de regressão da branch.

## Resumo final

Para reprovação, preparar texto compatível com `Request changes` (em PR) ou que oriente a correção antes do merge (branch local):

```markdown
## Code review — REPROVADO

O PR não está apto para aprovação porque ...

### Bloqueadores
- ...

### Segurança e dados
- ...

### Verificação e qualidade
- ...

### Fluxo Git
- ...
```

Omitir subseções vazias. Para aprovação, sintetizar requisitos cobertos e gates verdes.

## Pergunta final obrigatória

Com PR, encerrar com:

```text
Deseja que eu:
1. crie pr-<numero>-plano-correcao.md na raiz do projeto;
2. publique o resumo/comentários no PR;
3. encerre sem realizar escritas?
```

Branch local sem PR, encerrar com:

```text
Deseja que eu:
1. crie <branch-slug>-plano-correcao.md na raiz do projeto;
2. encerre sem escritas (o parecer volta ao task-flow para decidir sobre o merge)?
```

Não executar antes da resposta. Se o usuário escolher publicação em PR, apresentar primeiro: PR alvo; texto resumido; e se será comentário simples, aprovação formal ou `Request changes`. Solicitar confirmação explícita final antes das chamadas de escrita.
