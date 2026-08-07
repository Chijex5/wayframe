// hooks/useSession.ts
"use client";

import { useSessionStore } from "@/store/useSessionStore";
import type { Session, SessionStatus } from "@/lib/auth";

/**
 * Auth.js-shaped session accessor. Phase 3 swaps the store-backed source for
 * next-auth/react `useSession()` without changing consumers.
 */
export function useSession(): {
  session: Session | null;
  status: SessionStatus;
  signOut: () => Promise<void>;
} {
  const session = useSessionStore((state) => state.session);
  const status = useSessionStore((state) => state.status);
  const signOut = useSessionStore((state) => state.signOut);
  return { session, status, signOut };
}
