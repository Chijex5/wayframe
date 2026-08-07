// app/app/settings/appearance/page.tsx
"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";

export default function AppearancePage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex flex-col gap-4">
      <header className="border border-border bg-surface p-4">
        <p className="font-mono text-xs uppercase tracking-wide text-text-secondary">
          settings / display
        </p>
        <h1 className="mt-2 text-xl font-bold text-text-primary">Appearance</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Switch between light and dark mode.
        </p>
      </header>

      <section className="border border-border bg-surface">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-text-primary">
            interface
          </h2>
        </div>
        <div className="flex items-center justify-between gap-4 p-4">
          <div>
            <span className="text-sm font-medium text-text-primary">Theme</span>
            <p className="mt-1 font-mono text-xs text-text-secondary">
              current: {theme}
            </p>
          </div>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </section>
    </div>
  );
}
