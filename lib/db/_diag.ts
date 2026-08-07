import "./load-env";
import { neon } from "@neondatabase/serverless";

// Throwaway connectivity probe. Prints diagnosis only — never the connection
// string or credentials. Delete after use.
async function main() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    console.log("RESULT: DATABASE_URL is not set in the loaded environment.");
    process.exit(2);
  }

  // Masked shape check — no host, no credentials.
  let shape = "unparseable";
  try {
    const u = new URL(raw);
    shape = [
      `protocol=${u.protocol}`,
      `pooler=${u.host.includes("-pooler")}`,
      `sslmode=${u.searchParams.get("sslmode") ?? "(none)"}`,
      `channel_binding=${u.searchParams.get("channel_binding") ?? "(none)"}`,
    ].join(" ");
  } catch {
    shape = "URL() failed to parse DATABASE_URL";
  }
  console.log("URL shape:", shape);

  const sql = neon(raw);
  try {
    const one = await sql`select 1 as ok`;
    console.log("CONNECT: ok ->", JSON.stringify(one));
  } catch (e) {
    console.log("CONNECT: FAILED");
    console.log("  name:", (e as Error)?.name);
    console.log("  message:", (e as Error)?.message);
    console.log("  cause:", JSON.stringify((e as { cause?: unknown })?.cause ?? null));
    process.exit(1);
  }

  try {
    const reg = await sql`select
      to_regclass('"user"')          as user_tbl,
      to_regclass('pattern_chunks')  as pattern_tbl,
      to_regclass('flows')           as flows_tbl,
      to_regclass('flow_versions')   as versions_tbl`;
    console.log("TABLES:", JSON.stringify(reg[0]));

    const counts = await sql`select
      (select count(*) from "user")          as users,
      (select count(*) from pattern_chunks)  as patterns`;
    console.log("COUNTS:", JSON.stringify(counts[0]));
  } catch (e) {
    console.log("SCHEMA CHECK: FAILED");
    console.log("  name:", (e as Error)?.name);
    console.log("  message:", (e as Error)?.message);
    process.exit(1);
  }

  console.log("RESULT: connectivity + schema OK");
}

main();
