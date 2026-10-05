# Checklist de revisão — React / TypeScript / Vite

Aplicar somente itens pertinentes ao diff, mas sempre avaliar requisitos, segurança, verificação e fluxo Git.

Focar código alterado. Legado fora do diff só gera achado quando é dependência direta ou regressão da mudança. Ao tocar legado, preferir correção proporcional, não uma reescrita geral.

## Requisitos e comportamento

- Cada item declarado na descrição/commits do PR possui evidência implementada e verificável no diff.
- Fluxos feliz, vazio, carregamento, erro e limites foram tratados.
- Mensagens, formatação e textos visíveis permanecem coerentes.
- Nenhuma funcionalidade pedida foi entregue apenas parcialmente ou atrás de condição não solicitada.
- O diff não introduz funcionalidade fora do escopo declarado sem justificativa.

## Componentes e estado (React)

- Componentes têm responsabilidade clara; lógica pesada não fica inline no JSX.
- Estado derivado é calculado, não duplicado no state; evita fontes de verdade divergentes.
- `useEffect` tem dependências corretas, cleanup quando necessário e não é usado para o que seria estado derivado ou um handler de evento.
- Keys de lista são estáveis e únicas (não índice quando a ordem muda).
- Context é usado para estado realmente compartilhado; evita re-render global desnecessário.
- Chamadas assíncronas tratam loading, erro e cancelamento/condição de corrida (requisição obsoleta não sobrescreve estado novo).
- Sem efeitos colaterais durante o render; sem mutação direta de props/state.

## TypeScript

- Tipos expressam o contrato real; `any` só com justificativa explícita.
- Props, retornos de hooks e dados de API são tipados; narrowing adequado antes de usar valores possivelmente `undefined`/`null`.
- Sem `as` que mascare incompatibilidade real de tipo; sem `@ts-ignore`/`@ts-expect-error` sem justificativa.
- Enums/union types e discriminated unions usados onde reduzem erro.

## UI, acessibilidade e estilo

- Tailwind: classes coerentes com o padrão do projeto; sem estilos inline duplicando utilitários sem motivo.
- Elementos interativos são acessíveis (semântica correta, `aria-*` quando preciso, foco e teclado).
- Estados visuais (hover, foco, disabled, loading, vazio, erro) cobertos.
- Responsividade preservada nos breakpoints usados pelo projeto.
- Imagens/ícones com texto alternativo quando carregam significado.

## Dados e integrações externas

- Entradas do usuário e respostas de API são validadas/narrowed antes do uso.
- Dados renderizados a partir de fonte externa não introduzem injeção (evitar `dangerouslySetInnerHTML`; se usado, sanitizar e justificar).
- Chamadas a APIs externas (ex.: `@google/genai`) tratam timeout, erro e resposta inesperada.
- Nenhuma chave/segredo fica hardcoded ou exposto no bundle do cliente; segredos vêm de variáveis de ambiente no lado servidor (`express`/`tsx`), não embutidos no frontend.
- `import.meta.env`/`VITE_*` não expõe segredos sensíveis ao cliente.

## Segurança

- Sem segredos, tokens ou credenciais no diff, em logs ou no código do cliente.
- Dados sensíveis não aparecem em logs, mensagens de erro ou URLs.
- Entrada externa validada; saída escapada; sem interpolação insegura em caminhos/comandos no código de servidor.
- Dependências novas são conhecidas, mantidas e com versão fixada; nome não parece typosquatting.

## Verificação e qualidade

- `npm run lint` (`tsc --noEmit`) passa sem novos erros.
- `npm run build` passa quando o diff toca código do bundle.
- Comportamento novo foi exercitado na superfície real quando não é comprovável só por verificação estática.
- Sem `console.log`/código de depuração esquecido; sem código morto introduzido.

## Git e Pull Request

- Branch, nome e escopo seguem o `AGENTS.md` (branch de trabalho a partir de `develop`).
- Base correta (`develop` no fluxo padrão; `main` em publicação) e diff focado em uma mudança lógica.
- Commits não incluem segredos, dumps, artefatos de build ou código de outro escopo.
- Quando houver PR: título/base coerentes e threads de review relevantes verificadas no head atual.

## Severidade

Tratar como bloqueador:

- requisito declarado não atendido ou comportamento incorreto;
- segredo exposto, vazamento de dados ou injeção;
- corrupção/perda de dados ou condição de corrida relevante no estado;
- erro de type-check ou falha de build introduzidos pela branch;
- regressão em comportamento preexistente coberto;
- base/escopo da branch que impede validar o que será integrado.

Tratar como não bloqueador:

- melhoria nominal ou estética sem impacto;
- simplificação opcional;
- cobertura adicional de risco já adequadamente protegido;
- comentário já resolvido ou falso positivo.
