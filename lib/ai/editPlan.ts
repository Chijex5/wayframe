// lib/ai/editPlan.ts
//
// Pure contract + builder for AI chat editing (PRD §7). No `ai`/model imports
// live here: this file type-checks and is reasoned about without the provider
// SDK. `planEditCalls.ts` calls Gemini with `editPlanSchema` and hands the
// validated object to `buildEditResult`.
//
// Design mirrors generation: the model plans SEMANTIC operations only. For a new
// screen it supplies an id/label/category but NEVER a position — the server owns
// layout, placing new nodes in a fresh column to the right of the current graph.
// The five operations are exactly the PRD graph ops; the resulting FlowToolCall[]
// is validated against the live graph by the shared `validateToolCalls` before
// anything is returned, so a malformed plan is rejected atomically.

import { z } from "zod";
import type { EditFlowResult, FlowNode } from "@/lib/api/types";
import type { FlowToolCall } from "@/types/flow";
import { describeToolCall } from "@/lib/flow/describeToolCall";
import { SCREEN_CATEGORIES, toScreenId } from "./flowGraph";

// New-node placement. New screens land in a single column just past the current
// graph's rightmost node, stacked top-to-bottom in plan order.
const NEW_NODE_X_GAP = 260;
const NEW_NODE_Y_STEP = 140;

/**
 * One planned graph operation. Flat (not a discriminated union) because Gemini
 * structured output is most reliable with a single object shape + an `op`
 * discriminant; fields not used by a given `op` are simply omitted. Correctness
 * (required fields present, ids exist, no duplicate/self edges) is enforced
 * downstream by `validateToolCalls`, not by this schema.
 */
const editOperationSchema = z.object({
  op: z
    .enum(["addNode", "removeNode", "renameNode", "addEdge", "removeEdge"])
    .describe("Which graph operation to perform."),
  id: z
    .string()
    .optional()
    .describe(
      "Target screen id. For addNode: a NEW unique kebab-case id (e.g. 'order-history'). For removeNode/renameNode: the id of an EXISTING screen.",
    ),
  label: z
    .string()
    .optional()
    .describe("Human-facing screen name. Required for addNode and renameNode."),
  category: z
    .enum(SCREEN_CATEGORIES)
    .optional()
    .describe("Screen category. Used by addNode; defaults to core if omitted."),
  source: z
    .string()
    .optional()
    .describe("addEdge/removeEdge: id of the screen the connection starts from."),
  target: z
    .string()
    .optional()
    .describe("addEdge/removeEdge: id of the screen the connection leads to."),
});

/** Structured output shape Gemini must return for an edit instruction. */
export const editPlanSchema = z.object({
  summary: z
    .string()
    .min(1)
    .describe(
      "One short sentence, addressed to the user, describing what was changed.",
    ),
  operations: z
    .array(editOperationSchema)
    .min(1)
    .max(20)
    .describe("The graph operations to apply, in order."),
});

export type EditPlan = z.infer<typeof editPlanSchema>;

/**
 * Maps a validated model plan into positioned FlowToolCall[]. New nodes get a
 * server-computed position (a fresh right-hand column); screenId is derived from
 * the id the same way generation derives it. Missing string fields collapse to
 * "" so the shared validator — not this builder — issues the plain-English
 * rejection for anything malformed.
 */
export function buildToolCalls(
  plan: EditPlan,
  nodes: FlowNode[],
): FlowToolCall[] {
  const maxX = nodes.reduce((max, node) => Math.max(max, node.position.x), 0);
  const columnX = nodes.length > 0 ? maxX + NEW_NODE_X_GAP : 0;
  let addedSlot = 0;

  return plan.operations.map((op): FlowToolCall => {
    switch (op.op) {
      case "addNode": {
        const id = (op.id ?? "").trim();
        const label = (op.label ?? "").trim();
        const position = { x: columnX, y: addedSlot * NEW_NODE_Y_STEP };
        addedSlot += 1;
        return {
          type: "addNode",
          payload: {
            id,
            label,
            screenId: toScreenId(id || label),
            category: op.category ?? "core",
            position,
          },
        };
      }
      case "removeNode":
        return { type: "removeNode", payload: { id: (op.id ?? "").trim() } };
      case "renameNode":
        return {
          type: "renameNode",
          payload: { id: (op.id ?? "").trim(), label: (op.label ?? "").trim() },
        };
      case "addEdge":
        return {
          type: "addEdge",
          payload: {
            source: (op.source ?? "").trim(),
            target: (op.target ?? "").trim(),
          },
        };
      case "removeEdge":
        return {
          type: "removeEdge",
          payload: {
            source: (op.source ?? "").trim(),
            target: (op.target ?? "").trim(),
          },
        };
    }
  });
}

/**
 * Validated model plan → the EditFlowResult client contract. Summaries are
 * derived from the pre-edit `nodes` (ids resolve to their current labels). Does
 * not validate — the route runs `validateToolCalls` on the returned calls and
 * rejects atomically before applying anything.
 */
export function buildEditResult(
  plan: EditPlan,
  nodes: FlowNode[],
): EditFlowResult {
  const calls = buildToolCalls(plan, nodes);
  const summaries = calls.map((call) => describeToolCall(call, nodes));
  const summary =
    plan.summary.trim() ||
    `Applied ${calls.length} change${calls.length === 1 ? "" : "s"}.`;
  return { calls, summaries, summary };
}
