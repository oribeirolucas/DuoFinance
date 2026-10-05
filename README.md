# 💜 Duo Finance

> Gestão financeira para casais — **dois sonhos, um só planejamento.**

Duo Finance é uma aplicação web para casais organizarem a vida financeira em conjunto: acompanhar saldos, planejar metas e visualizar para onde o dinheiro está indo, com apoio de IA (Google Gemini).

---

## ✨ Stack

| Camada | Tecnologia |
|---|---|
| UI | [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org) |
| Build / dev server | [Vite 6](https://vitejs.dev) |
| Estilo | [Tailwind CSS 4](https://tailwindcss.com) |
| Gráficos | [Recharts](https://recharts.org) |
| Animação | [Motion](https://motion.dev) |
| Ícones | [lucide-react](https://lucide.dev) |
| IA | [@google/genai](https://ai.google.dev) (Gemini) |
| Backend leve | [Express](https://expressjs.com) via `tsx` |

## 📁 Estrutura

```text
DuoFinance/
├── src/
│   ├── components/      # Auth, Header, Sidebar, Modals, Views, Toasts
│   ├── context/         # AppContext — estado global da aplicação
│   ├── data/            # initialData — dados de carga inicial
│   ├── utils/           # formatters, hash
│   ├── types.ts         # tipos compartilhados
│   ├── App.tsx          # composição das views
│   └── main.tsx         # bootstrap React
├── .agents/skills/      # skills de automação (ver "Fluxo de trabalho")
├── AGENTS.md            # convenções de branch, commit, merge e gates
├── index.html
└── vite.config.ts
```

## 🚀 Começando

Pré-requisitos: Node 18+ e um gerenciador de pacotes (o repo versiona `bun.lock`, mas os scripts `npm` funcionam normalmente).

```bash
# 1. instalar dependências
npm install          # ou: bun install

# 2. configurar variáveis de ambiente
cp .env.example .env.local
#   edite .env.local e preencha GEMINI_API_KEY

# 3. subir o ambiente de desenvolvimento
npm run dev          # http://localhost:3000
```

### Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `GEMINI_API_KEY` | sim | Chave da API Gemini (usada no lado servidor). |
| `APP_URL` | — | URL de hospedagem da aplicação. |
| `VITE_DEMO_MODE` | — | `"true"` exibe os atalhos de login rápido de demonstração. |

> ⚠️ Segredos (como `GEMINI_API_KEY`) ficam no lado servidor. **Nunca** exponha chaves sensíveis via `VITE_*`, pois tudo com prefixo `VITE_` vai para o bundle do cliente.

## 📜 Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Dev server com HMR na porta 3000. |
| `npm run build` | Build de produção. |
| `npm run preview` | Serve o build para conferência. |
| `npm run lint` | Type-check (`tsc --noEmit`). |
| `npm run clean` | Remove `dist` e `server.js`. |

## 🔁 Fluxo de trabalho

Projeto de um único desenvolvedor, com fluxo leve, porém com `main` sempre estável. Usa duas branches de longa duração — `develop` (integração do dia a dia) e `main` (release). Detalhes em [`AGENTS.md`](AGENTS.md).

```text
pedido de tarefa → branch (de develop) → implementação → (code review opcional) → merge em develop
                                                                                     │
                                               "publicar" → merge de develop em main
```

Duas skills em `.agents/skills/` apoiam esse ciclo (agnósticas de IDE/agente):

- **[`task-flow`](.agents/skills/task-flow/SKILL.md)** — ao pedir "fazer a tarefa X", abre uma branch a partir de `develop`, conduz a implementação, **sempre pergunta se quer o code review** ao terminar e faz o merge em `develop`. Quando você pedir para **publicar**, mescla `develop` em `main` (com gates verdes e confirmação).
- **[`code-review`](.agents/skills/code-review/SKILL.md)** — revisão read-only, baseada em evidências, de uma branch local (antes do merge) ou de um PR: confere requisitos, arquitetura React/TS, segurança e os gates (`npm run lint`, `npm run build`), e emite parecer **APROVADO / REPROVADO**.

Convenções principais:

- Branches de longa duração: `develop` (base das tarefas) e `main` (release). Branches de trabalho: `feat/<slug>` ou `fix/<slug>`.
- Commits em Conventional Commits (`feat:`, `fix:`, `refactor:`, ...).
- Merge com `--no-ff` por padrão; `main` só recebe código via publicação explícita; push nunca é automático.

### 👉 Como usar as skills (passo a passo)

Você **não** precisa decorar comandos de git. É só conversar com o agente de IA em linguagem natural — ele segue as skills e cuida das branches e merges pra você. As skills vivem em `.agents/skills/` e funcionam em qualquer agente que leia essa pasta (nada pra instalar).

Regra de ouro: **o agente sempre pergunta antes de qualquer passo importante** (fazer o review, mesclar, dar push, publicar). Se tiver dúvida, pode responder com calma — nada acontece sem a sua confirmação.

**1. Começar uma tarefa** — descreva o que quer fazer, começando com "faça a tarefa" (ou "implemente", "corrija"):

```text
Faça a tarefa: adicionar um filtro de transações por categoria
```

O que o agente faz:
1. cria a branch `feat/filtro-por-categoria` a partir de `develop`;
2. implementa a mudança e roda os gates (`npm run lint`, `npm run build`);
3. ao terminar, **pergunta** se você quer um code review.

**2. Code review (opcional, mas recomendado)** — quando ele perguntar, responda:

```text
Sim, pode revisar
```

O agente analisa a sua branch comparada com `develop` e devolve um parecer **APROVADO** ou **REPROVADO**, listando o que achou e as evidências (`arquivo:linha`). Se for reprovado, ele explica os problemas e pergunta se você quer corrigir agora. Você também pode pedir o review a qualquer momento:

```text
Faz o code review dessa branch
```

**3. Guardar a tarefa (merge em `develop`)** — depois do review (ou se você pular), o agente mescla a branch em `develop`. Isso **não** publica nada para produção ainda — fica tudo na branch de integração, seguro.

**4. Publicar (quando estiver pronto para produção)** — quando quiser levar o que está em `develop` para a `main`, diga:

```text
Pode publicar
```

O agente roda os gates em `develop`, **te mostra exatamente o que vai entrar** na `main` e espera a sua confirmação antes de mesclar. Nada vai para `main` sem você aprovar.

> 💡 Dica para começar: tente uma tarefa pequena primeiro (ex.: "faça a tarefa: trocar o texto do botão de login") para ver o fluxo inteiro funcionando sem risco.

## 🤖 Ferramentas recomendadas (MCP)

As skills acima funcionam só com o `git` e o GitHub CLI (`gh`), mas dois servidores MCP deixam o fluxo bem mais poderoso. **Ambos são opcionais** — você pode usar todo o fluxo de trabalho sem eles e configurá-los depois, quando quiser. Um MCP é só uma "ponte" que dá ao agente acesso a uma ferramenta externa (o GitHub, ou um mapa do seu código).

### 1. GitHub MCP Server — operar o GitHub por linguagem natural

Dá ao agente acesso a repositórios, issues, PRs, Actions e code scanning direto pelo GitHub. Ótimo para a parte de PR e publicação de review da skill `code-review`.
Repositório: <https://github.com/github/github-mcp-server>

A forma mais simples é o **servidor remoto hospedado pela GitHub**. Exemplo de configuração (host compatível com MCP remoto, autenticação via PAT):

```json
{
  "servers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer ${input:github_mcp_pat}"
      }
    }
  }
}
```

> Há também uma versão local (container/binário) para hosts que não suportam MCP remoto — veja o README do projeto. Consulte sempre a documentação oficial, pois a configuração varia por host.

### 2. CodeGraph — inteligência semântica de código, 100% local

Constrói um grafo do código (símbolos, chamadas, blast radius) e entrega ao agente contexto cirúrgico em uma só consulta — excelente para a skill `code-review` entender o impacto real de um diff.
Repositório: <https://github.com/colbymchenry/codegraph>

```bash
# 1. instalar o CLI (macOS / Linux)
curl -fsSL https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.sh | sh

# 2. conectar aos seus agentes (abra um novo terminal antes)
codegraph install

# 3. indexar este projeto
cd DuoFinance
codegraph init
```

> `codegraph init` cria o diretório local `.codegraph/` e constrói o grafo. O índice é local; nada do seu código sai da máquina.

---

<div align="center">
<sub>Feito com 💜 para quem planeja a vida a dois.</sub>
</div>
