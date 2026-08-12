// app/signin/layout.tsx
"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen w-full flex-col bg-bg font-ui text-text-primary">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5 sm:px-8">
        <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-xs font-semibold text-white">
          W
        </Link>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-[380px]">{children}</div>
      </main>
    </div>
  );
}