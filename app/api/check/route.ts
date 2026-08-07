// app/api/check/route.ts
//
// POST /api/check — authenticated RAG completeness check (PRD §8). This is the
// server-only boundary the client `checkCompleteness` service calls; the Gemini
// key, the embedding call, and pgvector retrieval live only behind it (see
// lib/ai/runCompletenessCheck). Route handlers are not cached for POST, so every
// check runs fresh against the current graph.
//
// Contract: request { nodes, edges }, response CompletenessCheckResult (200).
// The check never mutates the flow — it only proposes suggestions the user
// reviews and approves through the validated edit path. Transient/rate-limit
// model failures return 429/503 so the client throws RetryableError and withRetry
// backs off; auth/validation/config failures are non-retryable.

import { z } from "zod";
import type { Edge } from "@xyflow/react";
import { auth } from "@/auth";
import { runCompletenessCheck } from "@/lib/ai/runCompletenessCheck";
import type { CompletenessCheckRequest, FlowNode } from "@/lib/api/types";

// nodes/edges are React Flow shapes the client sends from its own live state; we
// validate them as arrays and trust the element shapes at this boundary, matching
// /api/edit. The check reads only node labels/screenIds, so a loose shape is safe.
const requestSchema = z.object({
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
    return Response.json(
      { error: "Sign in to check a flow." },
      { status: 401 },
    );
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
      { error: "Send the current flow to check." },
      { status: 400 },
    );
  }

  const checkRequest: CompletenessCheckRequest = {
    nodes: parsed.data.nodes as FlowNode[],
    edges: parsed.data.edges as Edge[],
  };

  try {
    const result = await runCompletenessCheck(checkRequest);
    return Response.json(result);
  } catch (error) {
    const status = classifyError(error);
    // Log the real cause server-side; never leak model/key details to the client.
    console.error("[/api/check] completeness check failed", error);
    return Response.json(
      { error: "Completeness check failed. Try again." },
      { status },
    );
  }
}
