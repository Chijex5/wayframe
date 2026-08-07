// lib/ai/runCompletenessCheck.ts
//
// The single point where Wayframe talks to Gemini for the completeness check.
// Isolated so the model API is a one-file concern: the route, client, and UI
// depend on `CompletenessCheckResult`, not on the SDK.
//
// `server-only` guarantees the SDK — and the API key it reads — can never be
// pulled into a client bundle. This is the RAG orchestrator: embed the current
// flow (RETRIEVAL_QUERY), retrieve semantically-nearest pattern chunks from
// pgvector, then ask Gemini to curate which are genuinely missing. The pure
// `buildCheckResult` maps the validated curation into FlowSuggestion[].

import "server-only";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed, generateObject } from "ai";
import { env } from "@/lib/env";
import type { CompletenessCheckRequest, CompletenessCheckResult } from "@/lib/api/types";
import { retrievePatterns } from "@/lib/patterns/retrieve";
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  TASK_TYPE_QUERY,
} from "./embeddingConfig";
import {
  buildCheckResult,
  buildQueryText,
  completenessSchema,
  formatCandidates,
  formatPresentScreens,
} from "./completenessCheck";

// Gemini free-tier flash model — matches generation/editing (PRD §4).
const GEMINI_MODEL = "gemini-3.1-flash-lite";

const SYSTEM_PROMPT = `You audit a screen-navigation flow for missing screens, choosing ONLY from a provided list of candidate patterns.

Rules:
- Suggest a screen only if it is a genuine, meaningful gap given the screens the flow ALREADY has. Do not suggest a screen the flow already contains (by name or obvious synonym).
- Choose suggestions strictly from the candidate patterns provided. Do not invent screens outside that list.
- Prefer a small, high-value set (0-5). If the flow already looks complete, return an empty list — do not pad.
- Write each rationale specifically for THIS flow, referencing what it has and what the gap enables. Avoid generic filler.
- Assign each suggestion a node category: "auth", "commerce", or "core".
- For each suggestion, set "anchorId" to the id of the existing screen it should connect FROM — the screen a user would be on immediately before navigating to the new one. Copy the id verbatim from the "Screens already in the flow" list; never invent an id.`;

/**
 * Runs the RAG completeness check: embed → retrieve → curate. Returns
 * `{ suggestions: [] }` early (no model call) when the flow is empty or no
 * candidates come back — the latter happens before embeddings are backfilled,
 * so the feature degrades to "no suggestions" rather than erroring. Throws on
 * model/transport failure; the route classifies retryable cases.
 */
export async function runCompletenessCheck(
  request: CompletenessCheckRequest,
): Promise<CompletenessCheckResult> {
  if (request.nodes.length === 0) return { suggestions: [] };

  // Read the key request-time (env.GOOGLE_API_KEY is a throwing getter), not at
  // module load, so build-time route collection never requires the secret.
  const google = createGoogleGenerativeAI({ apiKey: env.GOOGLE_API_KEY });

  const { embedding } = await embed({
    model: google.textEmbedding(EMBEDDING_MODEL),
    value: buildQueryText(request.nodes),
    providerOptions: {
      google: {
        outputDimensionality: EMBEDDING_DIMENSIONS,
        taskType: TASK_TYPE_QUERY,
      },
    },
  });

  const candidates = await retrievePatterns(embedding);
  if (candidates.length === 0) return { suggestions: [] };

  const present = formatPresentScreens(request.nodes);

  const { object } = await generateObject({
    model: google(GEMINI_MODEL),
    schema: completenessSchema,
    schemaName: "CompletenessCheck",
    schemaDescription: "Screens missing from the flow, chosen from the candidates.",
    system: SYSTEM_PROMPT,
    prompt: `Screens already in the flow (id "label"):\n${present}\n\nCandidate patterns to choose from:\n${formatCandidates(candidates)}`,
  });

  const presentScreenIds = new Set(
    request.nodes.map((node) => node.data.screenId),
  );
  const presentNodeIds = new Set(request.nodes.map((node) => node.id));
  return buildCheckResult(object, presentScreenIds, presentNodeIds);
}
