// app/api/generate/route.ts
//
// POST /api/generate — authenticated flow generation. This is the server-only
// boundary the client `generateFlow` service calls; the Gemini key and SDK live
// only behind it (see lib/ai/generateFlowGraph). Route handlers are not cached
// for POST, so every generation runs fresh.
//
// Contract: request { description }, response GenerateFlowResult (200). Auth is
// required — no anonymous access to the model. Transient/rate-limit failures are
// returned as 429/503 so the client can throw RetryableError and withRetry backs
// off; auth/validation/config failures are non-retryable.

import { z } from "zod";
import { auth } from "@/auth";
import { generateFlowGraph } from "@/lib/ai/generateFlowGraph";

const requestSchema = z.object({
  description: z.string().trim().min(3).max(2000),
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
      { error: "Sign in to generate a flow." },
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
      { error: "Describe the app in a sentence or two." },
      { status: 400 },
    );
  }

  try {
    const result = await generateFlowGraph(parsed.data.description);
    return Response.json(result);
  } catch (error) {
    const status = classifyError(error);
    // Log the real cause server-side; never leak model/key details to the client.
    console.error("[/api/generate] generation failed", error);
    return Response.json(
      { error: "Flow generation failed. Try again." },
      { status },
    );
  }
}
