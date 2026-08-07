// lib/auth/types.ts
//
// Session-shaped auth contracts for the Wayframe client.
//
// These mirror the shape Auth.js exposes. Phase 3 swapped the mock service for
// real Auth.js behind the session store and the updateDisplayName action; these
// types stayed put as the shared contract between the store, the useSession hook,
// and the UI. Keep this file free of implementation and free of React.

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  /** Avatar URL. Null until the user sets one; UI falls back to initials. */
  image?: string | null;
};

/** Auth.js-shaped session. `expires` is an ISO timestamp. */
export type Session = {
  user: SessionUser;
  expires: string;
};

/** Matches next-auth's useSession() status union. */
export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

// ── Email magic-link sign-in ────────────────────────────────────────────────
// Auth.js maps this to signIn("email", { email }): request a one-time link.

export type MagicLinkRequest = { email: string };

export type MagicLinkResult =
  | { ok: true; email: string }
  | { ok: false; error: string };
