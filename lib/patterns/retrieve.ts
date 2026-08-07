// lib/patterns/retrieve.ts
//
// Server-only pgvector retrieval for the completeness check (Phase 7). The HNSW
// cosine index on pattern_chunks.embedding (migration 0000) serves the
// ORDER BY cosineDistance — ascending distance is nearest-first.
//
// `server-only` keeps the DB client out of any client bundle; this module is
// reached only through the /api/check route via runCompletenessCheck.

import "server-only";
import { cosineDistance, isNotNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { RetrievedPattern } from "@/lib/ai/completenessCheck";

// Over-fetch, then narrow to one product domain (below). k is the vector top-k
// before category filtering; the model sees the filtered subset.
const DEFAULT_K = 20;

// Auth screens (sign in, password reset, 2FA) are cross-domain — always eligible
// alongside the dominant retrieved domain so we don't drop them as "off-domain".
const CROSS_DOMAIN_CATEGORY = "authentication";

/**
 * Retrieves the patterns most similar to `queryVector`, then focuses the result
 * on a single coherent product domain: it keeps only chunks whose seed category
 * is the most common among the top-k (plus cross-domain auth patterns). This is
 * the "category-aware" retrieval the PRD calls for — it prevents a flow that
 * leans e-commerce from being offered social-network or healthcare screens that
 * happened to land in the neighbor set.
 *
 * Returns [] when no rows have embeddings yet (pre-backfill) — a correct,
 * non-erroring "no suggestions" rather than a failure.
 */
export async function retrievePatterns(
  queryVector: number[],
  k: number = DEFAULT_K,
): Promise<RetrievedPattern[]> {
  const distance = cosineDistance(schema.patternChunks.embedding, queryVector);

  const rows = await db
    .select({
      title: schema.patternChunks.title,
      category: schema.patternChunks.category,
      content: schema.patternChunks.content,
    })
    .from(schema.patternChunks)
    .where(isNotNull(schema.patternChunks.embedding))
    .orderBy(distance)
    .limit(k);

  if (rows.length === 0) return [];

  // Dominant category = the modal seed category among the nearest rows.
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.category, (counts.get(row.category) ?? 0) + 1);
  }
  let dominant = rows[0].category;
  let best = 0;
  for (const [category, count] of counts) {
    if (count > best) {
      best = count;
      dominant = category;
    }
  }

  return rows.filter(
    (row) =>
      row.category === dominant || row.category === CROSS_DOMAIN_CATEGORY,
  );
}
