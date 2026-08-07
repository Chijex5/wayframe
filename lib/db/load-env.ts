// Side-effect module: populates process.env for tooling that runs OUTSIDE the
// Next.js runtime — the drizzle-kit config and the seed script. Next auto-loads
// .env files for app/route code, but standalone `tsx`/`drizzle-kit` processes do
// not, so they must import this FIRST (before lib/db/index.ts evaluates and reads
// env.DATABASE_URL). ES module evaluation order makes "imported first" deterministic.
//
// This is the pattern the installed Next docs prescribe for "a root config file
// for an ORM" — see node_modules/next/dist/docs environment-variables guide.
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
