# Plano de correção

Criar este artefato somente após autorização explícita. Persistir na raiz como `pr-<numero>-plano-correcao.md` quando houver PR, ou `<branch-slug>-plano-correcao.md` para branch local.

## Estrutura

```markdown
# Plano de correção do code review — <PR #123 ou branch>

## Metadados
- PR (se houver):
- Branch:
- Base (develop ou main):
- Head/commit revisado:
- Status do review:

## Objetivo
...

## Fora do escopo
...

## Matriz de correções
| Prioridade | Achado/evidência | Correção esperada | Verificação de conclusão |

## Fases de implementação
### Fase 1 — ...
- arquivos prováveis
- dependências
- ações
- verificações (`npm run lint`, `npm run build`, QA manual)

## Divisão sugerida entre subagentes
| Frente | Escopo | Propriedade de arquivos | Dependências | Verificações |

## Riscos e controles
- ...

## Comandos de verificação
- `npm run lint`
- `npm run build`
- QA manual na superfície alterada

## Definição de pronto
- [ ] Todos os requisitos bloqueados possuem evidência.
- [ ] `npm run lint` e `npm run build` aplicáveis estão verdes.
- [ ] Comentários confirmados do PR (se houver) foram resolvidos ou justificados.
- [ ] Diff permanece focado e sem regressão de segurança/dados.
```

## Regras

- Converter cada bloqueador confirmado em trabalho verificável.
- Ordenar fases por dependência e risco, não pela ordem dos arquivos.
- Não prescrever implementação incompatível com o requisito ou com a arquitetura vigente.
- Separar correções obrigatórias de melhorias opcionais.
- Indicar arquivos como prováveis, salvo quando o diff tornar o alvo inequívoco.
- Não incluir credenciais, logs extensos, payloads sensíveis ou transcrições do review.
- Não editar código nem publicar o plano externamente.
