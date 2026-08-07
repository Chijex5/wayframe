// lib/ai/completenessCheck.ts
//
// Pure contract + builders for the RAG completeness check (PRD §8). No `ai`/db
// imports live here — this file type-checks and is reasoned about without the
// provider SDK or a database, mirroring lib/ai/flowGraph.ts and lib/ai/editPlan.ts.
// `runCompletenessCheck.ts` embeds the flow, retrieves candidate patterns, calls
// Gemini with `completenessSchema`, and hands the validated object to
// `buildCheckResult`.
//
// Design mirrors generation/editing: the model chooses SEMANTICS ONLY — which
// retrieved patterns are genuinely missing, a flow-specific rationale, and a node
// category. It never invents a screenId; the builder derives that from the title
// with the same `toScreenId` slug generation the rest of the pipeline uses.

import { z } from "zod";
import type { CompletenessCheckResult, FlowNode } from "@/lib/api/types";
import type { FlowSuggestion } from "@/data/suggestions";
import { SCREEN_CATEGORIES, toScreenId } from "./flowGraph";

/** A pattern chunk retrieved from pgvector, as the model sees it. */
export type RetrievedPattern = {
  title: string;
  category: string;
  content: string;
};

const suggestionSchema = z.object({
  title: z
    .string()
    .min(1)
    .describe(
      "The screen name to add — chosen from the candidate patterns, e.g. 'Password Reset'. Human-facing, Title Case.",
    ),
  rationale: z
    .string()
    .min(1)
    .describe(
      "One sentence, specific to THIS flow, explaining why the screen is a meaningful gap given the screens already present.",
    ),
  category: z
    .enum(SCREEN_CATEGORIES)
    .describe(
      "Node category for the suggested screen: core (home, feed, detail, profile, search, settings), commerce (cart, checkout, payment, orders), or auth (sign in, onboarding, account).",
    ),
  anchorId: z
    .string()
    .min(1)
    .describe(
      "The exact id (copied verbatim from the 'Screens already in the flow' list) of the existing screen this new screen should connect FROM — the screen a user is on right before navigating to it. Pick the single most logical predecessor.",
    ),
});

/** Structured output shape Gemini must return for a completeness check. */
export const completenessSchema = z.object({
  suggestions: z
    .array(suggestionSchema)
    .max(8)
    .describe(
      "Screens genuinely missing from the flow, drawn from the candidate patterns. Empty if the flow is already complete. Never include a screen the flow already has.",
    ),
});

export type CompletenessOutput = z.infer<typeof completenessSchema>;

/** Compact flow description used as the retrieval query (RETRIEVAL_QUERY side). */
export function buildQueryText(nodes: FlowNode[]): string {
  if (nodes.length === 0) return "An app with no screens yet.";
  const labels = nodes.map((node) => node.data.label).join(", ");
  return `An app with these screens: ${labels}.`;
}

/**
 * Lists the flow's current screens by id + label so the model can name a valid
 * `anchorId` for each suggestion. Ids are the graph's real node ids — the same
 * ids `approveSuggestion` resolves against — so an echoed id connects to the
 * right node.
 */
export function formatPresentScreens(nodes: FlowNode[]): string {
  return nodes.map((node) => `- ${node.id} "${node.data.label}"`).join("\n");
}

/** Renders retrieved candidates into the prompt's numbered candidate list. */
export function formatCandidates(patterns: RetrievedPattern[]): string {
  return patterns
    .map(
      (pattern) =>
        `- ${pattern.title} (${pattern.category}): ${pattern.content}`,
    )
    .join("\n");
}

/**
 * Validated model output → the CompletenessCheckResult client contract. Derives
 * screenId from the title (same slug rule as generation/editing), builds a stable
 * suggestion id, and drops — defensively — any suggestion whose screen the flow
 * already contains. Never throws on model sloppiness; it sanitizes instead.
 */
export function buildCheckResult(
  output: CompletenessOutput,
  presentScreenIds: Set<string>,
  presentNodeIds: Set<string>,
): CompletenessCheckResult {
  const seen = new Set<string>();
  const suggestions: FlowSuggestion[] = [];

  for (const item of output.suggestions) {
    const title = item.title.trim();
    if (!title) continue;
    const screenId = toScreenId(title);
    // Skip screens already in the flow, and de-dupe repeats within the batch.
    if (presentScreenIds.has(screenId) || seen.has(screenId)) continue;
    seen.add(screenId);
    // Keep the anchor only if it names a real present node; otherwise drop it
    // and let approval fall back to attaching at the end of the flow.
    const anchorId = item.anchorId?.trim();
    suggestions.push({
      id: `sug_${screenId.replace(/^scr_/, "")}`,
      title,
      rationale: item.rationale.trim(),
      screenId,
      category: item.category,
      anchorId: anchorId && presentNodeIds.has(anchorId) ? anchorId : undefined,
    });
  }

  return { suggestions };
}
