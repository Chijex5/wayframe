// app/app/layout.tsx
import React from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen w-full bg-bg font-ui text-text-primary">{children}</div>;
}