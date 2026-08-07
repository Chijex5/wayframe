// drizzle-kit config. Runs in a standalone Node process (not the Next runtime), so
// the first import is the load-env side-effect that populates process.env from
// .env.local before we read DATABASE_URL below.
//
// This reads process.env.DATABASE_URL directly rather than lib/env.ts, because that
// module pulls in the `server-only` boundary via lib/db and would throw outside a
// Next server context. The non-null assertion is safe: load-env has already run, and
// a missing URL surfaces as a clear drizzle-kit connection error.
import "./lib/db/load-env";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
