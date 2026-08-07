// Validated environment accessor. Dependency-free on purpose: this is read by the
// server-only DB client (lib/db/index.ts) and by tooling (drizzle config, seed),
// and it must fail loudly with a clear message the moment a required variable is
// missing rather than surfacing an opaque driver error later.
//
// Zod is the project's locked validator, but it is introduced with request-body
// validation in Phase 5 — pulling it forward just for presence checks would add a
// dependency to the DB boot path for no benefit. Extend `env` below as later phases
// add GOOGLE_API_KEY / RESEND_API_KEY / AUTH_SECRET.

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Add it to .env.local (see ROADMAP.md Phase 2).`,
    );
  }
  return value;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
};
