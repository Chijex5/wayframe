// components/RequireAuth.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";

// Client-side authoritative gate for the /app workspace. proxy.ts does an
// optimistic cookie-presence check; this catches the gap it can't see — a cookie
// that's present but no longer backs a valid database session (expired, signed
// out elsewhere, row deleted). getSession() (via the store's hydrate) returns
// null in that case, flipping status to "unauthenticated", and we redirect.
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const status = useSessionStore((state) => state.status);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/signin");
  }, [router, status]);

  if (status !== "authenticated") {
    return (
      <div
        className="flex min-h-screen w-full items-center justify-center bg-bg"
        aria-label="Loading workspace"
        aria-busy="true"
      >
        <span className="h-8 w-32 animate-pulse border border-border bg-surface-raised" />
      </div>
    );
  }

  return children;
}
