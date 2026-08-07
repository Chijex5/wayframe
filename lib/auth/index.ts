// lib/auth/index.ts
// Client auth entrypoint. Replace these exports with Auth.js-backed operations
// in Phase 3 without changing UI callers.

export {
  completeMagicLink,
  getSession,
  requestMagicLink,
  signOut,
  updateProfile,
} from "./mock/authService";

export type {
  MagicLinkRequest,
  MagicLinkResult,
  Session,
  SessionStatus,
  SessionUser,
} from "./types";
