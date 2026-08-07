// The one and only database connection point. Everything that touches Postgres
// imports `db` from here.
//
// `server-only` makes any accidental import from a Client Component a hard build
// error — the connection string must never reach the browser bundle. DATABASE_URL
// is deliberately unprefixed (never NEXT_PUBLIC_), so Next also refuses to inline it
// client-side. Together: the client can never hold the secret.
//
// Driver: neon-http (stateless HTTP) — the right fit for App Router route handlers
// in Phase 4+. Trade-off: no multi-statement transactions over HTTP. Not needed
// here; switch to the websocket driver only if cross-statement transactions arrive.
import "server-only";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { env } from "../env";
import * as schema from "./schema";

const sql = neon(env.DATABASE_URL);

export const db = drizzle({ client: sql, schema });

export { schema };
