// lib/ai/planEditCalls.ts
//
// The single point where Wayframe talks to Gemini for chat editing. Isolated so
// the model API is a one-file concern: the route, client, and UI depend on
// `EditFlowResult`, not on the SDK.
//
// `server-only` guarantees the SDK — and the API key it reads — can never be
// pulled into a client bundle. Like generation, editing uses `generateObject`
// for a validated structured plan; the model plans SEMANTIC operations and the
// pure `buildEditResult` positions any new nodes.

import "server-only";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { env } from "@/lib/env";
import type { EditFlowRequest, EditFlowResult } from "@/lib/api/types";
import { buildEditResult, editPlanSchema } from "./editPlan";

// Gemini free-tier flash model — matches generation (PRD §4).
const GEMINI_MODEL = "gemini-3.1-flash-lite";

const SYSTEM_PROMPT = `You edit an existing screen-navigation flow by planning a batch of graph operations from a user instruction.

Operations (op):
- addNode: create a NEW screen. Give it a new unique kebab-case id, a short human label, and a category. Do NOT reuse an existing id.
- removeNode: delete an EXISTING screen by its id. Its connections are removed automatically.
- renameNode: change an EXISTING screen's label; keep its id.
- addEdge: connect two screens by id (source → target). Both must exist, either already in the graph or added earlier in THIS batch.
- removeEdge: delete an EXISTING connection by source and target id.

Rules:
- Reference existing screens by their EXACT current id (shown below). Never invent ids for screens that already exist.
- Categories: "auth" (sign in, onboarding, account), "commerce" (cart, checkout, payment, orders), "core" (home, feed, detail, profile, search, settings).
- Do NOT include positions or coordinates — layout is handled downstream.
- Plan only what the instruction asks for. If it implies a new screen that should be reachable, also add the edge(s) that connect it.
- Return a short, friendly one-sentence summary of what you changed.`;

/** Renders the current graph as compact context the model plans against. */
function describeGraph(request: EditFlowRequest): string {
  const screens =
    request.nodes.length > 0
      ? request.nodes
          .map(
            (node) =>
              `- ${node.id} "${node.data.label}" (${node.data.category})`,
          )
          .join("\n")
      : "(none)";

  const connections =
    request.edges.length > 0
      ? request.edges
          .map((edge) => `- ${edge.source} -> ${edge.target}`)
          .join("\n")
      : "(none)";

  return `Current screens:\n${screens}\n\nCurrent connections:\n${connections}`;
}

/**
 * Plans an edit from an instruction + current graph via Gemini structured
 * output, then maps the validated plan into the EditFlowResult contract (new
 * nodes positioned server-side). Throws on model/transport failure — the route
 * classifies retryable cases; the route also runs the shared validator on the
 * returned calls and rejects a malformed batch atomically.
 */
export async function planEditCalls(
  request: EditFlowRequest,
): Promise<EditFlowResult> {
  // Read the key request-time (env.GOOGLE_API_KEY is a throwing getter), not at
  // module load, so build-time route collection never requires the secret.
  const google = createGoogleGenerativeAI({ apiKey: env.GOOGLE_API_KEY });

  const { object } = await generateObject({
    model: google(GEMINI_MODEL),
    schema: editPlanSchema,
    schemaName: "FlowEdit",
    schemaDescription: "A batch of graph operations for the described edit.",
    system: SYSTEM_PROMPT,
    prompt: `${describeGraph(request)}\n\nInstruction: ${request.instruction}`,
  });

  return buildEditResult(object, request.nodes);
}
