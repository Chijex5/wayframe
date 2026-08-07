// components/SessionProvider.tsx
"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/store/useSessionStore";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useSessionStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return children;
}
