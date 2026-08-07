// lib/auth/types.ts
//
// Session-shaped auth contracts for the Wayframe client.
//
// These mirror the shape Auth.js exposes so the frontend can be built against a
// real-looking session today and swapped to Auth.js email magic-link auth in a
// later phase by replacing only lib/auth/mock/* behind lib/auth/index — with no
// change to callers. Keep this file free of implementation and free of React.

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
