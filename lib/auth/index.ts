// lib/auth — client-facing auth contract (types only).
//
// Phase 3 replaced the mock service with real Auth.js:
//   • session read / sign-in / sign-out → next-auth/react (see store/useSessionStore)
//   • profile updates → updateDisplayName server action (see lib/auth/actions)
//   • server config / handlers → auth.ts + app/api/auth/[...nextauth]
// These types remain the shared vocabulary between the store, the hook, and the UI.

export type {
  MagicLinkRequest,
  MagicLinkResult,
  Session,
  SessionStatus,
  SessionUser,
} from "./types";
