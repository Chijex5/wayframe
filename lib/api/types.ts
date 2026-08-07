// lib/api/types.ts
//
// Transport-shaped contracts for the Wayframe client service layer.
//
// These are the request/response shapes the UI exchanges with the "backend".
// Today the backend is the in-repo mock engine (see ./mock/*); later phases
// replace the implementations behind ./index.ts with real /api/* fetch calls,
// WITHOUT changing these shapes or any caller. Keep this file free of mock data
// and free of React — it is the wire contract, nothing more.

import type { Edge } from "@xyflow/react";
import type {
  FlowToolCall,
  FlowVersion,
  ScreenNodeType,
} from "@/types/flow";
import type { ChatMessage } from "@/data/mockProjects";
import type { FlowSuggestion } from "@/data/suggestions";

/** A single node as produced by generation (position + screen data). */
export type FlowNode = ScreenNodeType;

/** A directed connection, pre-styling. Matches the generation payload edge. */
export type FlowEdgeSeed = {
  id: string;
  source: string;
  target: string;
};

/** The canvas graph a project persists / a generation returns. */
export type FlowGraph = {
  nodes: FlowNode[];
  edges: Edge[];
};

// ── Generation ────────────────────────────────────────────────────────────
// POST /api/generate — describe an app, stream back a flow.

export type GenerateFlowRequest = {
  /** Plain-English description of the app to plan. */
  description: string;
};

export type GenerateFlowResult = {
  /** Derived human-facing name for the generated flow. */
  projectName: string;
  nodes: FlowNode[];
  edges: FlowEdgeSeed[];
};

// ── Chat edit (tool calling) ────────────────────────────────────────────────
// POST /api/edit — send current graph + instruction, get validated tool calls.

export type EditFlowRequest = {
  instruction: string;
  /** Current graph state, sent as context for the planner. */
  nodes: FlowNode[];
  edges: Edge[];
};

export type EditFlowResult = {
  /** Server-validated tool calls to apply, in order. */
  calls: FlowToolCall[];
  /** One concise description per tool call, in the same order as `calls`. */
  summaries: string[];
  /** One assistant-facing sentence summarizing what was applied. */
  summary: string;
};

// ── Completeness check (RAG) ────────────────────────────────────────────────
// POST /api/check — compare current flow to retrieved patterns.

export type CompletenessCheckRequest = {
  nodes: FlowNode[];
  edges: Edge[];
};

export type CompletenessCheckResult = {
  suggestions: FlowSuggestion[];
};

// ── Projects persistence ────────────────────────────────────────────────────
// Later backed by the ORM (users → flows → flow_versions). The repository
// interface below is what the UI depends on; the in-memory implementation is
// swapped for a DB-backed one in a later phase.

export type ProjectSummary = {
  id: string;
  name: string;
  updatedAt: string;
  nodes: FlowNode[];
  edges: Edge[];
  chatMessages: ChatMessage[];
};

export type ProjectPatch = Partial<
  Pick<ProjectSummary, "name" | "nodes" | "edges" | "chatMessages">
>;

export type { FlowVersion };

// ── Server-action results ─────────────────────────────────────────────────
// Discriminated result the persistence server actions return. Lives here (not
// in the "use server" module) because a "use server" file may only export async
// functions — types must be declared in a plain module and imported.

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** Fields the client supplies when appending a version row. */
export type PersistVersionInput = {
  label: string;
  summary: string;
  source: FlowVersion["source"];
  snapshot?: FlowVersion["snapshot"];
};
