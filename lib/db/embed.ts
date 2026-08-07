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
//
// Batched + paced: rows are embedded and written to the DB in small batches
// (default 20) with a delay between batches, to stay under the Gemini free-tier
// quota (100 embed requests/min). Each batch is written to the DB immediately
// after its embed call succeeds, so a later quota/network failure only loses
// the *current* batch's progress, not everything — just re-run the script and
// it picks up wherever it left off, since already-embedded rows are skipped.

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

// Tune these if you keep hitting quota errors, or raise BATCH_SIZE if you're
// on a paid Gemini tier with a higher rate limit.
const BATCH_SIZE = 20;
const DELAY_BETWEEN_BATCHES_MS = 20_000; // 20s -> well under 100 req/min

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

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

  const batches = chunk(rows, BATCH_SIZE);
  console.log(
    `Embedding ${rows.length} pattern_chunk(s) in ${batches.length} batch(es) of up to ${BATCH_SIZE}...`,
  );

  let embeddedCount = 0;

  for (let b = 0; b < batches.length; b += 1) {
    const batch = batches[b];
    console.log(`Batch ${b + 1}/${batches.length} (${batch.length} rows)...`);

    let embeddings: number[][];
    try {
      const result = await embedMany({
        model: google.textEmbedding(EMBEDDING_MODEL),
        values: batch.map((row) => row.content),
        providerOptions: {
          google: {
            outputDimensionality: EMBEDDING_DIMENSIONS,
            taskType: TASK_TYPE_DOCUMENT,
          },
        },
      });
      embeddings = result.embeddings;
    } catch (error) {
      console.error(
        `Batch ${b + 1} failed — stopping here. ${embeddedCount} row(s) were already saved before this batch and will be skipped on the next run.`,
      );
      console.error(error);
      // Re-throw so the outer .catch() logs it and exits non-zero, but
      // everything embedded so far is already committed to the DB (each
      // batch is written immediately below, not buffered till the end).
      throw error;
    }

    // neon-http has no multi-statement transaction; update row-by-row. Written
    // immediately after this batch succeeds, so progress survives a later
    // batch failing (e.g. rate limit) — re-running the script just picks up
    // the remaining NULL rows.
    for (let i = 0; i < batch.length; i += 1) {
      await db
        .update(schema.patternChunks)
        .set({ embedding: embeddings[i] })
        .where(eq(schema.patternChunks.id, batch[i].id));
    }

    embeddedCount += batch.length;
    console.log(`  -> saved (${embeddedCount}/${rows.length} total so far)`);

    const isLastBatch = b === batches.length - 1;
    if (!isLastBatch) {
      await sleep(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  console.log(
    `Embedded ${embeddedCount} pattern_chunk(s) at ${EMBEDDING_DIMENSIONS} dims.`,
  );
}

embed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Embed failed:", error);
    process.exit(1);
  });