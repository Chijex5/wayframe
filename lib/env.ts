// Validated environment accessor. Dependency-free on purpose: this is read by the
// server-only DB client (lib/db/index.ts) and by tooling (drizzle config, seed),
// and it must fail loudly with a clear message the moment a required variable is
// missing rather than surfacing an opaque driver error later.
//
// Zod is the project's locked validator, but it is introduced with request-body
// validation in Phase 5 — pulling it forward just for presence checks would add a
// dependency to the DB boot path for no benefit. Extend `env` below as later phases
// add RESEND_API_KEY / AUTH_SECRET.
//
// GOOGLE_API_KEY (Phase 5) is deliberately unprefixed (never NEXT_PUBLIC_), so it
// is readable only in the server-only /api/generate route and Next refuses to
// inline it into the client bundle — the Gemini key never reaches the browser.

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

  // Lazy: a getter, not an eager field. `env` is imported by the DB client and
  // drizzle tooling, which need only DATABASE_URL — evaluating the Gemini key at
  // module load would force every db:migrate/db:seed run to set it too. As a
  // getter it throws only when the generation route actually reads it.
  get GOOGLE_API_KEY(): string {
    return required("GOOGLE_API_KEY");
  },
};
