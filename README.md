# Wayframe

**Plan the flow before you build the app.**

Wayframe turns a plain-English description into a live, editable screen-flow diagram. Describe your app, watch the flow build on an infinite canvas, refine it by chatting, and catch the screens you forgot before you write a single route.

🔗 **[wayframe.vercel.app](https://wayframe.vercel.app)**

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![React Flow](https://img.shields.io/badge/React%20Flow-canvas-4c8dff?style=flat)
![Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4c8dff?style=flat)
![Postgres](https://img.shields.io/badge/Postgres-pgvector-4fb0a5?style=flat&logo=postgresql&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat&logo=vercel&logoColor=white)

---

## Why

Every developer knows this moment: you're three days into building a checkout flow and realize you never planned a shipping-address screen. Now it's not a plan, it's a rewrite — rewired navigation, revisited code, a slipped deadline.

Wayframe exists so that moment happens *before* you write code, not after.

## How it works

1. **Describe** — one sentence in plain English. Gemini resolves it into discrete, categorized screens and the navigation between them.
2. **Edit** — type an instruction or edit directly on the canvas. Each change is planned as a batch of graph operations and validated atomically before anything touches state.
3. **Check** — your flow is embedded and matched against a pgvector library of flow patterns, filtered to your app's category. Missing steps come back as reviewable suggestions, not silent edits.

Every change — generated, typed, or approved — lands in a version log tagged by source, so nothing is ever a mystery edit.

## Features

- **Infinite canvas** — screens as nodes, navigation as directed edges, built on React Flow
- **AI-generated flows** — Gemini structured output turns a description into a categorized screen flow
- **Chat-driven editing** — instructions become validated, all-or-nothing batches of graph operations
- **Completeness check** — category-aware RAG over a pgvector pattern library, not just prompted from memory
- **Accounts & persistence** — Auth.js magic-link sign-in, flows saved to Postgres per user
- **Version history** — every change tagged by source (chat, manual, suggestion, restore) and restorable
- **Dark by default** — built for developers, not general design audiences

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router), TypeScript, React 19 |
| Canvas & state | React Flow (`@xyflow/react`), Zustand |
| AI | Google Gemini — `generateObject` for flow generation and edit planning, `gemini-embedding-001` for retrieval, via the Vercel AI SDK |
| Database | Neon Postgres + pgvector, Drizzle ORM with `drizzle-kit` migrations |
| Auth | Auth.js (NextAuth v5) — Drizzle adapter, database sessions, Resend magic-link |
| Styling | Tailwind CSS v4, IBM Plex Sans/Mono, dark-by-default with a light theme |
| Deployment | Vercel |

## Getting started

```bash
git clone https://github.com/chijex5/wayframe.git
cd wayframe
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Database setup:

```bash
npm run db:generate   # generate a migration from the schema
npm run db:migrate    # apply migrations
npm run db:seed       # seed base data
npm run db:embed      # backfill pattern_chunks embeddings for RAG
```

## Project structure

```
app/          route handlers & pages (App Router), including app/api/*
components/   canvas, chat bar, dashboard, settings, and landing UI
lib/          ai (generation/edit/RAG), auth, db (schema + client), email, flow validation
drizzle/      generated SQL migrations + snapshots
store/        Zustand stores (session, projects)
data/         static/demo flow data
hooks/        canvas and app state hooks
types/        shared TypeScript types
```

## How the AI pipeline works

- **Generation** (`lib/ai/generateFlowGraph.ts`) — a system prompt constrains Gemini to a fixed schema: kebab-case screen ids, short labels, and one of three categories (`auth`, `commerce`, `core`). No layout is generated; positioning is handled client-side.
- **Editing** (`lib/ai/planEditCalls.ts`) — instructions are planned as a batch of operations (`addNode`, `removeNode`, `renameNode`, `addEdge`, `removeEdge`) against the current graph, described to the model as compact text context. The same pure validator (`lib/flow/validateToolCalls.ts`) runs client- and server-side, so a batch with one invalid operation is rejected as a whole — no partial edits.
- **Completeness check** (`lib/ai/runCompletenessCheck.ts`, `lib/patterns/retrieve.ts`) — the live flow is embedded as a `RETRIEVAL_QUERY` vector and matched via cosine distance against `pattern_chunks` (embedded as `RETRIEVAL_DOCUMENT`), narrowed to the flow's dominant category with a standing carve-out for cross-domain auth patterns. Suggestions are proposals only — approving one routes through the exact same validated edit path as a typed command.
- **Reliability** — every AI route classifies failures: `429`/`503` (rate-limited/transient) trigger client-side retry with backoff; other errors surface immediately since retrying wouldn't help.

## License

MIT
