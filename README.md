# Wayframe

**Plan the flow before you build the app.**

Wayframe turns a plain-English description into a live, editable screen-flow diagram. Describe your app, watch the flow build on an infinite canvas, refine it by chatting, and catch the screens you forgot before you write a single route.

🔗 **[wayframe.vercel.app](https://wayframe.vercel.app)**

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![React Flow](https://img.shields.io/badge/React%20Flow-canvas-22D3EE?style=flat)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat&logo=vercel&logoColor=white)

---

## Why

Every developer knows this moment: you're three days into building a checkout flow and realize you never planned a shipping-address screen. Now it's not a plan, it's a rewrite — rewired navigation, revisited code, a slipped deadline.

Wayframe exists so that moment happens *before* you write code, not after.

## How it works

1. **Describe** — one sentence in plain English. Wayframe resolves it into discrete screens and the navigation between them.
2. **Edit** — type an instruction or edit directly on the canvas. Add a screen, rewire a connection, rename a step.
3. **Check** — compare your flow against patterns from comparable products. Missing steps come back as reviewable suggestions, not silent edits.

Every change — generated, typed, or approved — lands in a version log with its source attached, so nothing is ever a mystery edit.

## Features

- **Infinite canvas** — screens as nodes, navigation as directed edges, built on React Flow
- **Chat-driven editing** — describe a change instead of dragging shapes
- **Direct manipulation** — rename inline, drag connections, delete an edge from its midpoint
- **Category typing** — every screen carries a category (core, commerce, auth) so scope creep is visible at a glance
- **Pattern comparison** — catch commonly-missed steps for your app's category
- **Dashboard** — every flow you've started, at a glance
- **Dark by default** — built for developers, not general design audiences

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router), TypeScript |
| Canvas | React Flow (`@xyflow/react`) |
| Styling | Tailwind CSS |
| Fonts | Geist, via `next/font` |
| Deployment | Vercel |

## Getting started

```bash
git clone https://github.com/chijex5/wayframe.git
cd wayframe
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/          route handlers & pages (App Router)
components/   canvas, chat bar, dashboard cards, and other UI
data/         flow data
hooks/        canvas and app state
public/       static assets
types/        shared TypeScript types
```

## Roadmap

- AI-generated flows from a plain-English description, backed by Gemini
- Chat edits resolved as validated tool calls against live graph state
- Accounts, saved flows, and full version history
- Pattern-based completeness checking, grounded in a retrievable pattern library

## License

MIT
