// store/useSessionStore.ts
"use client";

import { create } from "zustand";
import {
  completeMagicLink,
  getSession,
  requestMagicLink,
  signOut as serviceSignOut,
} from "@/lib/auth";
import type { Session, SessionStatus } from "@/lib/auth";

type SessionStore = {
  session: Session |null;
  status: SessionStatus;
  pendingEmail: string |null;
  hydrate: () => Promise<void>;
  requestLink: (email: string) => Promise<{ ok: boolean; error?: string }>;
  verifyLink: () => Promise<void>;
  signOut: () => Promise<void>;
  setSession: (session: Session) => void;
};

export const useSessionStore = create<SessionStore>((set, get) => ({
  session:null,
  status: "loading",
  pendingEmail:null,

  hydrate: async () => {
    const session = await getSession();
    set({ session, status: session ? "authenticated" : "unauthenticated" });
  },

  requestLink: async (email) => {
    const result = await requestMagicLink({ email });
    if (result.ok) set({ pendingEmail: result.email });
    return result;
  },

  verifyLink: async () => {
    const email = get().pendingEmail;
    if (!email) throw new Error("No pending sign-in request.");
    const session = await completeMagicLink(email);
    set({ session, status: "authenticated", pendingEmail:null });
  },

  signOut: async () => {
    await serviceSignOut();
    set({ session:null, status: "unauthenticated", pendingEmail:null });
  },

  setSession: (session) => set({ session, status: "authenticated" }),
}));
