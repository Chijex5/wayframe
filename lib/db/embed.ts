// lib/db/embed.ts
//
// Standalone Phase 7 backfill: embeds every pattern_chunks row that still has a
// NULL embedding and writes back the 768-dim vector, at which point the HNSW
// cosine index (created in migration 0000) begins serving retrieval.
//
// Like lib/db/seed.ts this builds its OWN Neon client instead of importing
// lib/db, which is guarded by `server-only` and throws outside Next's RSC
// bundler (memory: server-only guards DB client). Run with `npm run db:embed`
// once GOOGLE_API_KEY is set and Neon is reachable.
//
// Idempotent: only NULL-embedding rows are selected, so re-running after adding
// new patterns embeds just the new ones — already-embedded rows are untouched.

import "./load-env";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embedMany } from "ai";
import { eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { env } from "../env";
import * as schema from "./schema";
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  TASK_TYPE_DOCUMENT,
} from "../ai/embeddingConfig";

const db = drizzle({ client: neon(env.DATABASE_URL), schema });

async function embed() {
  const google = createGoogleGenerativeAI({ apiKey: env.GOOGLE_API_KEY });

  const rows = await db
    .select({
      id: schema.patternChunks.id,
      content: schema.patternChunks.content,
    })
    .from(schema.patternChunks)
    .where(isNull(schema.patternChunks.embedding));

  if (rows.length === 0) {
    console.log("No pattern_chunks need embedding — all rows already have one.");
    return;
  }

  // One batched call; embedMany preserves order and auto-splits if the provider
  // caps batch size. Document taskType pairs with the query side at check time.
  const { embeddings } = await embedMany({
    model: google.textEmbedding(EMBEDDING_MODEL),
    values: rows.map((row) => row.content),
    providerOptions: {
      google: {
        outputDimensionality: EMBEDDING_DIMENSIONS,
        taskType: TASK_TYPE_DOCUMENT,
      },
    },
  });

  // neon-http has no multi-statement transaction; update row-by-row. A partial
  // failure just leaves some rows NULL, which the next run picks up (idempotent).
  for (let i = 0; i < rows.length; i += 1) {
    await db
      .update(schema.patternChunks)
      .set({ embedding: embeddings[i] })
      .where(eq(schema.patternChunks.id, rows[i].id));
  }

  console.log(
    `Embedded ${rows.length} pattern_chunk(s) at ${EMBEDDING_DIMENSIONS} dims.`,
  );
}

embed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Embed failed:", error);
    process.exit(1);
  });
