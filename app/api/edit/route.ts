// app/api/edit/route.ts
//
// POST /api/edit — authenticated chat editing via Gemini tool calling (PRD §7).
// This is the server-only boundary the client `editFlow` service calls; the
// Gemini key and SDK live only behind it (see lib/ai/planEditCalls). Route
// handlers are not cached for POST, so every edit is planned fresh.
//
// Contract: request { instruction, nodes, edges }, response EditFlowResult (200).
// The planned batch is validated against the submitted graph with the SAME pure
// validator the client uses; a malformed batch is rejected atomically as 422
// with a plain-English reason and NOTHING is applied. Transient/rate-limit model
// failures return 429/503 so the client throws RetryableError and withRetry
// backs off; auth/validation/config failures are non-retryable.

import { z } from "zod";
import type { Edge } from "@xyflow/react";
import { auth } from "@/auth";
import { planEditCalls } from "@/lib/ai/planEditCalls";
import {
  InvalidToolCallError,
  validateToolCalls,
} from "@/lib/flow/validateToolCalls";
import type { EditFlowRequest, FlowNode } from "@/lib/api/types";

// nodes/edges are React Flow shapes the client sends from its own live state; we
// validate the instruction strictly and the graph as arrays, then trust the
// element shapes at this boundary. Correctness of the resulting edit is enforced
// by validateToolCalls below, not by re-deriving the full node/edge schema here.
const requestSchema = z.object({
  instruction: z.string().trim().min(1).max(2000),
  nodes: z.array(z.unknown()),
  edges: z.array(z.unknown()),
});

/** Pull a numeric HTTP status off an unknown SDK/transport error, if present. */
function readStatusCode(error: unknown): number | null {
  if (typeof error === "object" && error !== null) {
    const e = error as Record<string, unknown>;
    if (typeof e.statusCode === "number") return e.statusCode;
    if (typeof e.status === "number") return e.status;
  }
  return null;
}

/** 429 = rate limited, 503 = transient (retry), 500 = unexpected/config (don't). */
function classifyError(error: unknown): 429 | 503 | 500 {
  const status = readStatusCode(error);
  if (status === 429) return 429;
  if (status !== null && status >= 500) return 503;
  // No transport status usually means a schema-validation miss from the SDK — a
  // re-roll can fix model nondeterminism, so treat it as transient.
  if (status === null) return 503;
  // A provider 4xx other than 429 (bad key, bad request) won't fix on retry.
  return 500;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Sign in to edit a flow." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Describe the change you want to make." },
      { status: 400 },
    );
  }

  const editRequest: EditFlowRequest = {
    instruction: parsed.data.instruction,
    nodes: parsed.data.nodes as FlowNode[],
    edges: parsed.data.edges as Edge[],
  };

  let result: Awaited<ReturnType<typeof planEditCalls>>;
  try {
    result = await planEditCalls(editRequest);
  } catch (error) {
    const status = classifyError(error);
    // Log the real cause server-side; never leak model/key details to the client.
    console.error("[/api/edit] edit planning failed", error);
    return Response.json({ error: "Flow edit failed. Try again." }, { status });
  }

  // Atomic guard (PRD §7.4): the planned batch is validated against the graph it
  // will apply to. A single bad call rejects the whole batch with a plain reason
  // and leaves the flow untouched. Kept outside the model try/catch so a
  // rejection is never misclassified as a transient failure.
  try {
    validateToolCalls(result.calls, {
      nodes: editRequest.nodes,
      edges: editRequest.edges,
    });
  } catch (error) {
    if (error instanceof InvalidToolCallError) {
      return Response.json({ error: error.message }, { status: 422 });
    }
    throw error;
  }

  return Response.json(result);
}
