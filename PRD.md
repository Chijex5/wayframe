# WAYFRAME — Product Requirements Document

Plan the flow before you build the app.

| | |
|---|---|
| **Version** | 1.0 |
| **Date** | July 2026 |
| **Status** | Draft for Review |
| **Author** | Chijioke Uzodinma |

## How to Read This Document

This PRD follows Amazon's Working Backwards methodology. We begin with the developer — their problem, their language, their desired outcome — and derive every requirement from that starting point. Readers should evaluate each section by asking: does this serve the developer, and can we measure whether it does?

### Document Structure

| Section | |
|---|---|
| Section 1 | Press Release (the north star — read first) |
| Section 2 | Customer FAQs |
| Section 3 | Internal FAQs |
| Section 4 | Goals & Non-Goals |
| Section 5 | User Types & Stories |
| Section 6 | Functional Requirements |
| Section 7 | Non-Functional Requirements |
| Section 8 | Success Metrics |
| Section 9 | Milestones |
| Section 10 | Open Questions |
| Section 11 | Appendix |

## Section 1 — Press Release (Working Backwards)

The following is written as if Wayframe has already launched, reflecting the outcome we are building toward. All product decisions must serve the reality described below.

> **FOR IMMEDIATE RELEASE**
>
> **Wayframe Launches — Describe Your App, Watch the Flow Build Itself, Never Miss a Screen Again**
>
> Wayframe today announced the public launch of an AI-assisted flow-planning tool that lets developers describe an app in plain English and receive a live, editable flow diagram — then chat to refine it while Wayframe checks the flow against a library of proven patterns for commonly missed steps.
>
> Before Wayframe, developers planned flows on whiteboards, in general-purpose diagramming tools, or not at all — sketches that lived outside the codebase and went stale the moment requirements shifted. Screens got forgotten until mid-build, forcing rework: rewired navigation, revisited code, delayed releases.
>
> "I was three days into building a checkout flow before I realized I'd never planned a shipping-address screen," said a beta user and backend developer. "With Wayframe I described the flow, it caught the gap on the first check, and I fixed it before writing a line of code."
>
> Wayframe works simply: developers describe their app, and a flow streams onto the canvas as connected screens. They edit it by chatting — "add a payment step after cart" — and a "Check my flow" action compares the flow against a growing library of flow patterns by app category, surfacing steps that are commonly present elsewhere but missing here. Every flow is versioned, so any edit can be rewound.
>
> Wayframe launches free, accessible from any browser, with sign-in via email.
>
> "Developers already accept that planning is part of building software — we just made sure the plan remembers what a checkout flow is supposed to include," said the Wayframe team.
>
> Sign up at wayframe.app.

## Section 2 — Frequently Asked Questions: Developers (Customers)

**Q: What is Wayframe and how is it different from Figma or Whimsical?**

A: Wayframe isn't a general diagramming tool — it's built specifically for app and user flows. It generates a first draft from a plain-English description and actively checks your flow for commonly missed steps. Figma and Whimsical draw whatever you tell them to; Wayframe also tells you what you might be missing.

**Q: How do I create a flow?**

A: Describe your app in a sentence or two. Wayframe streams back a diagram of screens and connections. From there, edit by chatting — "add a paywall after signup," "remove the tutorial screen."

**Q: How does the completeness check work, and can I trust its suggestions?**

A: Wayframe compares your flow against a curated library of flow patterns for your app's category (e-commerce, SaaS onboarding, social, and more) and surfaces steps that are commonly present in similar flows but absent in yours. Suggestions are proposals, not automatic edits — you review and approve each one individually before it's added to your diagram.

**Q: What happens if I don't like an edit the AI made?**

A: Every applied edit creates a new version. You can rewind to any previous version of your flow from the history panel — nothing is destructive.

**Q: Is my flow private?**

A: Yes. Flows are tied to your account behind sign-in and are never visible to other users.

**Q: Does Wayframe write my app's code?**

A: No. Wayframe stops at the plan — flow diagrams and screen-level structure. Turning that into working code is on you in v1.

## Section 3 — Frequently Asked Questions: Internal / Stakeholders

**Q: Why use RAG for the completeness check instead of just prompting the model with its general knowledge?**

A: The model's general knowledge of "common flow patterns" isn't grounded in anything we control or can update. A curated, retrievable pattern library lets us grow, correct, and version what counts as a "complete" flow per category, without retraining anything or hoping the model remembers correctly.

**Q: Why atomic tool calls instead of regenerating the whole graph on every edit?**

A: A single small edit (rename a node) shouldn't cost re-sending and re-generating the entire flow, and shouldn't risk the model silently rewriting a part of the diagram the user didn't touch.

**Q: Why Google Gemini on a free-tier key rather than a paid provider?**

A: Zero marginal cost is the right tradeoff at this stage — this is a solo/class-scale project, not a funded product. The cost is real rate limits, which we accept and design around with retry/backoff and streaming to mask latency.

**Q: What is the minimum viable product?**

A: Describe → generate → render → chat-edit via tool calls, with basic auth and flow persistence. The RAG completeness check and full version history are the first features added once the core loop is solid — not day-one requirements.

**Q: How do we stop the AI from corrupting a user's diagram?**

A: Every tool call is schema-validated server-side before it's applied — a call referencing a nonexistent node id is rejected, not silently accepted. Completeness-check suggestions never touch the diagram directly; they route through the same validated tool-call path, and only after the user approves them.

**Q: Build vs. buy for the canvas?**

A: Buy — React Flow. Building a node-and-edge canvas from scratch is its own multi-week project and isn't where Wayframe's value is.

## Section 4 — Goals & Non-Goals

### 4.1 Goals

- Help developers map a complete app flow before writing code, reducing mid-build rework.
- Make editing a flow as fast as describing the change in plain English.
- Catch commonly-missed steps automatically, grounded in real patterns rather than guesswork.
- Give every flow a safe edit history so experimentation carries no cost.
- Prove the core loop (describe → generate → chat-edit) works well enough to justify the RAG and persistence investment.

### 4.2 Non-Goals (v1.0)

- Wayframe will NOT generate application code from a flow.
- Wayframe will NOT support real-time multi-user collaborative editing in v1.
- Wayframe will NOT be a general-purpose diagramming tool (org charts, architecture diagrams, etc.).
- Wayframe will NOT offer enterprise SSO or team/role management in v1.
- Wayframe will NOT support offline editing.

## Section 5 — User Types & Stories

### 5.1 User Types

| User Type | Primary Goal | Key Pain Point Solved |
|---|---|---|
| Developer (primary) | Plan and validate an app flow before coding | Flows live only in your head or in a tool disconnected from the build; steps get forgotten mid-build |
| Pattern Library Maintainer (v1: the author) | Keep the flow-pattern library accurate per category | Completeness checks are only as good as the reference patterns behind them |

### 5.2 Developer User Stories

#### Describing & Generating

1. As a developer, I want to describe my app in plain English so that I get a first-draft flow without manually placing boxes and arrows.
2. As a developer, I want to watch the flow diagram stream in so that I get useful signal even before generation finishes on a large flow.

#### Editing

1. As a developer, I want to add, remove, or rename a screen by typing a plain-English instruction so that I don't have to learn a diagramming tool's UI.
2. As a developer, I want a rejected or malformed edit to fail safely and tell me why, so that I never end up with a silently broken diagram.

#### Completeness Check

1. As a developer, I want to check my flow against known patterns for my app's category so that I catch a missing step before I start building.
2. As a developer, I want to review and approve each suggested addition individually so that I stay in control of my diagram.

#### Persistence

1. As a developer, I want to save named flows to my account so that I can return to a project across sessions.
2. As a developer, I want to see and restore a previous version of a flow so that I can experiment without fear of losing a good version.

### 5.3 Pattern Library Maintainer Stories

1. As the maintainer, I want to add a new flow-pattern category (e.g. fintech KYC) so that completeness checks cover more app types over time.
2. As the maintainer, I want to update an existing pattern's steps so that outdated recommendations don't get surfaced to users.

## Section 6 — Functional Requirements

### 6.1 Flow Canvas & Generation (Client)

| Feature | Requirement |
|---|---|
| Description input | Free-text box; submits to `/api/generate`; disabled while a generation is in-flight. |
| Live diagram | Renders nodes/edges via React Flow as JSON streams in (streamObject); auto-layout on initial generation. |
| Node/edge styling | Visually distinguishes node types where relevant; edges show direction only — no labels required in v1. |

### 6.2 Chat Edit & Tool Calling

| Feature | Requirement |
|---|---|
| Command bar | Free-text input tied to `/api/edit`; sends the current graph plus the new instruction as context. |
| Supported edits (v1) | `addNode`, `removeNode`, `renameNode`, `addEdge`, `removeEdge` — no other mutation types in v1. |
| Validation | Every tool call's arguments are validated server-side (Zod) against current graph state before being applied; invalid calls return an error, not a partial edit. |
| Feedback | A successful edit re-renders the diagram; a failed edit shows a plain-English reason and leaves graph state unchanged. |

### 6.3 Completeness Check (RAG)

| Feature | Requirement |
|---|---|
| Trigger | Manual "Check my flow" action — never runs automatically on every edit. |
| Retrieval | Current flow's node labels are embedded at check-time; top-k pattern chunks retrieved from pgvector by app category. |
| Comparison | The LLM compares the current flow to retrieved patterns and returns a structured list of suggested missing steps, each with a one-line rationale. |
| Review | Each suggestion is shown individually with Approve/Reject; approved suggestions apply via the same tool-call path as manual edits (Section 6.2). |

### 6.4 Account, Dashboard & Version History

| Feature | Requirement |
|---|---|
| Auth | Email-based sign in/up via Auth.js; a session is required for all flow-data access. |
| Dashboard | Lists the signed-in user's saved flows, sorted by last edited. |
| Save | Every applied edit (manual or approved suggestion) writes a new `flow_version` row. |
| Version history | Sidebar lists prior versions by timestamp; selecting one restores it as the current state (itself recorded as a new version, not a destructive overwrite). |

## Section 7 — Non-Functional Requirements

### 7.1 Performance

- Initial flow generation: first node visible within roughly 2 seconds of submission (streaming).
- Atomic edit round-trip (tool call → validated → rendered): target ≤2 seconds under normal free-tier API latency.
- Completeness check: acceptable up to roughly 5 seconds, given it chains an embedding call, a retrieval step, and a second LLM call.

### 7.2 Security

- The client never holds the Gemini API key; all model calls happen server-side in API routes.
- All flow data is scoped to the authenticated user; no endpoint returns another user's flow.
- All tool-call arguments are validated server-side before mutating stored state.

### 7.3 Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js / React, React Flow for the canvas |
| API Layer | Next.js API routes deployed as Vercel serverless functions |
| LLM Provider | Google Gemini via Vercel AI SDK v6 (free-tier keys) — chat/tool-calling and embeddings |
| Database | Postgres with the pgvector extension — relational tables (users, flows, flow_versions) and pattern_chunks vectors in one database |
| Auth | Auth.js (NextAuth) |
| Validation | Zod schemas for every tool call and every structured LLM output |

### 7.4 Reliability & Error Handling

- Gemini rate-limit errors trigger automatic retry with backoff; the user sees a "still working" state, not a raw error.
- A malformed tool call (e.g., referencing a nonexistent node id) is rejected before it reaches client state; the diagram never enters an inconsistent state.

## Section 8 — Success Metrics (Early-Stage OKRs)

### Objective 1: Prove the core loop is usable

| Key Result | Target |
|---|---|
| Flows created by test users (classmates/beta users) | ≥20 in the first month |
| Edit commands that resolve to a valid tool call without manual retry | ≥90% |
| Median time from description to first rendered diagram | ≤5 seconds |

### Objective 2: Validate the completeness-check feature adds real value

| Key Result | Target |
|---|---|
| Flow-pattern categories live at first check-in | ≥3 |
| "Check my flow" runs resulting in ≥1 approved suggestion | ≥30% |
| Cases of an unapproved suggestion altering a saved flow | 0 |

### Objective 3: Confirm persistence is trustworthy

| Key Result | Target |
|---|---|
| Applied edits that produce a retrievable version | 100% |
| Data-loss incidents (a saved flow becoming unreadable/unrecoverable) | 0 |

## Section 9 — Milestones & Timeline

| Milestone | Exit Criteria |
|---|---|
| M0: Problem definition & pipeline design | This PRD approved; architecture decided |
| M1: Core loop | Description → generate (streamObject) → render works end-to-end |
| M2: Chat editing | Tool-call defs + Zod validation + client state patching; add/remove/rename/edge commands work reliably |
| M3: Auth & persistence | Flows survive across sessions, scoped per signed-in user |
| M4: Version history | Any saved edit can be restored from the history panel |
| M5: RAG completeness check | "Check my flow" returns grounded suggestions from a live pattern library |
| M6: Beta with real users | A handful of classmates/developers use it on a real project; Section 8 OKRs measured |

## Section 10 — Open Questions

| # | Question | Owner / Target Resolution |
|---|---|---|
| OQ-1 | Which flow-pattern categories to launch with, and where does that reference content come from? | Product — before M5 |
| OQ-2 | What is the practical rate-limit ceiling on the free-tier Gemini key, and does it force a paid key before beta? | Engineering — before M5 |
| OQ-3 | How much version history should be retained per flow (unlimited vs. capped)? | Product — before M4 |
| OQ-4 | Should a rejected suggestion be remembered so it isn't proposed again on the next check? | Product — before M5 |
| OQ-5 | Does the tool-call approach hold up for large flows (50+ screens), or does graph context need pagination/summarization? | Engineering — before M2 exit |

## Section 11 — Appendix

### A. Glossary

| Term | Definition |
|---|---|
| Node | A single screen or step in a flow diagram. |
| Edge | A directed connection between two nodes, representing navigation from one screen to another. |
| Tool call | A model-issued instruction to run one specific, predefined function (e.g., addNode) with structured arguments. |
| RAG (Retrieval-Augmented Generation) | Retrieving relevant reference text at request time and injecting it into the prompt, rather than relying only on the model's trained-in knowledge. |
| Embedding | A numeric vector representation of text used to measure similarity between pieces of content. |
| pgvector | A Postgres extension that stores embeddings and supports similarity search directly in the relational database. |
| Chunk | One retrievable unit of the pattern library — in Wayframe, one flow pattern per chunk. |
| Streaming | Returning a model's output incrementally as it's generated, rather than waiting for the full response. |

### B. Competitive Landscape

| Competitor / Comparison | Wayframe Advantage |
|---|---|
| Figma / Whimsical | General-purpose diagramming; Wayframe generates a first draft from a description and actively flags missing steps, rather than starting from a blank canvas. |
| Miro | Freeform whiteboarding; no concept of a flow's "completeness" against known patterns. |
| Pen and paper / no tool | Free, but the plan exists nowhere durable and is never checked against anything. |

---

*End of Document — Wayframe PRD v1.0*
