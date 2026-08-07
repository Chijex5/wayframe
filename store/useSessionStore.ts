// store/useSessionStore.ts
"use client";

import { create } from "zustand";
import { getSession, signIn, signOut as authSignOut } from "next-auth/react";
import { updateDisplayName } from "@/lib/auth/actions";
import type { Session, SessionStatus } from "@/lib/auth";

// Client seam over Auth.js. State is read through next-auth/react (getSession polls
// /api/auth/session, which validates the cookie against the database session row),
// sign-in requests a Resend magic link, and profile edits go through a server action.
// The UI contract (Session/status/pendingEmail + the same method names) is unchanged
// from the mock, so no page had to change how it talks to the store.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Auth.js sessions carry name/email/image (+ our id from the session callback) but
// as optional fields; map to the app's stricter Session shape at this boundary.
function toAppSession(
  raw: Awaited<ReturnType<typeof getSession>>,
): Session | null {
  if (!raw?.user?.email) return null;
  const user = raw.user as {
    id?: string;
    name?: string | null;
    email: string;
    image?: string | null;
  };
  return {
    user: {
      id: user.id ?? "",
      name: user.name ?? "",
      email: user.email,
      image: user.image ?? null,
    },
    expires: raw.expires,
  };
}

type SessionStore = {
  session: Session | null;
  status: SessionStatus;
  pendingEmail: string | null;
  hydrate: () => Promise<void>;
  requestLink: (email: string) => Promise<{ ok: boolean; error?: string }>;
  updateProfile: (name: string) => Promise<Session>;
  signOut: () => Promise<void>;
};

export const useSessionStore = create<SessionStore>((set, get) => ({
  session: null,
  status: "loading",
  pendingEmail: null,

  hydrate: async () => {
    const session = toAppSession(await getSession());
    set({ session, status: session ? "authenticated" : "unauthenticated" });
  },

  requestLink: async (email) => {
    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      return { ok: false, error: "Enter a valid email address." };
    }
    try {
      const result = await signIn("resend", {
        email: trimmed,
        redirect: false,
        redirectTo: "/app",
      });
      if (result?.error) {
        return { ok: false, error: "We couldn't send your link. Try again." };
      }
      set({ pendingEmail: trimmed });
      return { ok: true };
    } catch {
      return { ok: false, error: "We couldn't send your link. Try again." };
    }
  },

  updateProfile: async (name) => {
    const result = await updateDisplayName(name);
    if (!result.ok) throw new Error(result.error);
    await get().hydrate();
    const session = get().session;
    if (!session) throw new Error("Your session has expired. Sign in again.");
    return session;
  },

  signOut: async () => {
    await authSignOut({ redirect: false });
    set({ session: null, status: "unauthenticated", pendingEmail: null });
  },
}));
