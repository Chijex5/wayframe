// Auth.js (NextAuth v5) — the single server-side auth entrypoint.
//
// Email magic-link sign-in over Resend, backed by the Drizzle adapter against the
// Phase 2 schema (the adapter's default table shape is identical to ours, so the
// tables drop in unchanged). Sessions use the database strategy: a session row per
// sign-in, looked up by the `authjs.session-token` cookie.
//
// Secrets are read from the environment by Auth.js itself and never appear in code:
//   AUTH_SECRET       — signs/encrypts the session cookie (required)
//   AUTH_RESEND_KEY   — Resend API key used to deliver the link
//   AUTH_RESEND_FROM  — verified "from" address for the sign-in email
//
// This module is server-only (it imports lib/db, which is `server-only`). Client
// code talks to auth through next-auth/react (see store/useSessionStore) and the
// profile server action (see lib/auth/actions) — never by importing this file.
import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, schema } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  session: { strategy: "database" },
  // Self-hosted / non-Vercel: trust the deployment host for callback URL building.
  trustHost: true,
  pages: {
    signIn: "/signin",
    // Where Auth.js sends the user after a link is requested, and where link
    // errors (expired / already-used / malformed) surface — see check-email page.
    verifyRequest: "/signin/check-email",
    error: "/signin",
  },
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      // Resend's shared sandbox sender works without domain verification while the
      // real domain is being set up; override with a verified address in prod.
      from: process.env.AUTH_RESEND_FROM ?? "onboarding@resend.dev",
    }),
  ],
  callbacks: {
    // Database strategy: `user` is the persisted row. Surface its id so server
    // reads (and the client session mapping) can scope data to the owner in Phase 4.
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
