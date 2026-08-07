// lib/auth/mock/authService.ts
//
// Frontend-only implementation of the auth contract. The request and verify
// delays make loading and failure states observable without making UI callers
// depend on a mock. Phase 3 replaces this module with Auth.js + Resend.

import type {
  MagicLinkRequest,
  MagicLinkResult,
  Session,
  SessionUser,
} from "../types";

const SESSION_KEY = "wayframe-session";
const REQUEST_LATENCY_MS = 600;
const VERIFY_LATENCY_MS = 500;
const SIGN_OUT_LATENCY_MS = 200;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function readStoredSession(): Session | null {
  const stored = window.localStorage.getItem(SESSION_KEY);
  if (!stored) return null;

  try {
    const session = JSON.parse(stored) as Session;
    if (!session.user?.email || Date.parse(session.expires) <= Date.now()) {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function nameFromEmail(email: string) {
  const localPart = email.split("@")[0] ?? "";
  const derived = localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
  return derived || "Wayframe user";
}

function saveSession(session: Session) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function getSession(): Promise<Session | null> {
  await delay(0);
  return readStoredSession();
}

export async function requestMagicLink(
  request: MagicLinkRequest,
): Promise<MagicLinkResult> {
  await delay(REQUEST_LATENCY_MS);
  const email = request.email.trim().toLowerCase();
  return isEmail(email)
    ? { ok: true, email }
    : { ok: false, error: "Enter a valid email address." };
}

/** Development-only stand-in for clicking the one-time email link. */
export async function completeMagicLink(email: string): Promise<Session> {
  await delay(VERIFY_LATENCY_MS);
  const user: SessionUser = {
    id: `user_${email.replace(/[^a-z0-9]/gi, "_")}`,
    name: nameFromEmail(email),
    email,
    image: null,
  };
  return saveSession({
    user,
    expires: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  });
}

export async function signOut(): Promise<void> {
  await delay(SIGN_OUT_LATENCY_MS);
  window.localStorage.removeItem(SESSION_KEY);
}

export async function updateProfile(name: string): Promise<Session> {
  await delay(300);
  const current = readStoredSession();
  if (!current) throw new Error("Your session has expired. Sign in again.");
  return saveSession({ ...current, user: { ...current.user, name } });
}
