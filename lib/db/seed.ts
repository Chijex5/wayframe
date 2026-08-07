import "./load-env";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { env } from "../env";
import * as schema from "./schema";
import { seedSuggestions } from "../../data/suggestions";

// Standalone script: build our own Neon client rather than importing lib/db,
// which is guarded by `server-only` and throws outside Next's RSC bundler.
const db = drizzle({ client: neon(env.DATABASE_URL), schema });

async function seed() {
  const rows = seedSuggestions.map((pattern) => ({
    category: pattern.category,
    title: pattern.title,
    content: pattern.content,
    // embedding stays null — backfilled in Phase 7 (Gemini, 768-dim).
  }));

  await db
    .insert(schema.patternChunks)
    .values(rows)
    .onConflictDoUpdate({
      target: schema.patternChunks.id,
      set: {
        category: sql`excluded.category`,
        title: sql`excluded.title`,
        content: sql`excluded.content`,
      },
    });

  const count = await db.$count(schema.patternChunks);
  console.log(`Seeded pattern_chunks — ${count} row(s) present.`);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
