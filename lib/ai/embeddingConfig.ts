// lib/ai/embeddingConfig.ts
//
// Shared embedding constants for the RAG completeness check (Phase 7). Kept in a
// ZERO-IMPORT module on purpose: it is imported both by the server orchestrator
// (via the `@/` alias) and by the standalone `tsx` backfill script (via a
// relative path, like lib/db/seed.ts) — a dependency-free file resolves cleanly
// under either loader.
//
// The document/query split is Gemini's asymmetric-retrieval recommendation: the
// stored pattern chunks are embedded as RETRIEVAL_DOCUMENT, the live flow query
// as RETRIEVAL_QUERY. Both MUST use the same model and outputDimensionality (768)
// so the vectors are comparable and match the pgvector column (see
// lib/db/schema.ts patternChunks.embedding). Centralized here so backfill and
// query can never drift apart.

/** Gemini embedding model (structured-output capable, MRL-truncatable). */
export const EMBEDDING_MODEL = "gemini-embedding-001" as const;

/** MRL truncation length — must equal the `vector(768)` column width. */
export const EMBEDDING_DIMENSIONS = 768;

/** taskType for the stored pattern chunks (backfill side). */
export const TASK_TYPE_DOCUMENT = "RETRIEVAL_DOCUMENT" as const;

/** taskType for the live flow query (retrieval side). */
export const TASK_TYPE_QUERY = "RETRIEVAL_QUERY" as const;
