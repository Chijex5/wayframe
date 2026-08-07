// app/signin/layout.tsx
"use client";

import Link from "next/link";
import { ShieldCheckIcon } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";
import { BlueprintGrid, Crosshair } from "@/components/landing/BlueprintGrid";
import { DiagramStage } from "@/components/landing/DiagramStage";
import { stageEdges, stageNodes } from "@/data/landingDemo";

const legend = [
  { label: "core", color: "var(--cat-core)" },
  { label: "commerce", color: "var(--cat-commerce)" },
  { label: "auth", color: "var(--cat-auth)" },
];

/** Static, fully-revealed twin of the landing hero canvas — the auth-side art. */
function CanvasArt() {
  return (
    <figure className="relative w-full border border-border bg-surface" style={{ borderRadius: "2px" }}>
      <figcaption className="flex h-9 items-center justify-between border-b border-border px-3">
        <span className="flex items-center gap-2 font-mono text-xs text-text-secondary">
          <span className="flex gap-1" aria-hidden="true">
            <span className="h-1.5 w-1.5 bg-cat-auth" />
            <span className="h-1.5 w-1.5 bg-cat-core" />
            <span className="h-1.5 w-1.5 bg-cat-commerce" />
          </span>
          canvas · marketplace-flow
        </span>
        <span className="font-mono text-xs text-accent">v0.4</span>
      </figcaption>

      <div
        className="relative px-3 py-4"
        style={{
          backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      >
        <DiagramStage
          nodes={stageNodes}
          edges={stageEdges}
          visibleCount={stageNodes.length}
          ariaLabel="A completed Wayframe marketplace screen flow: Sign In, Onboarding, Home Feed, Item Detail, Cart and Shipping"
        />
        <span
          className="absolute right-3 top-3 flex items-center gap-2 border border-accent bg-surface px-2 py-1"
          style={{ borderRadius: "2px" }}
        >
          <ShieldCheckIcon className="h-3 w-3 text-accent" aria-hidden="true" />
          <span className="font-mono text-xs text-text-primary">+1 suggestion applied</span>
        </span>
      </div>
    </figure>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen w-full bg-bg font-ui text-text-primary">
      {/* Brand / product-canvas panel — carries the visual weight on desktop. */}
      <aside className="relative hidden w-[46%] max-w-[680px] shrink-0 overflow-hidden border-r border-border bg-bg lg:flex lg:flex-col">
        <BlueprintGrid size={56} fade />
        <div className="relative flex h-full flex-col justify-between gap-10 p-10 xl:p-14">
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="h-4 w-[3px] bg-accent" />
            <span className="font-mono text-lg font-semibold leading-none tracking-tight text-text-primary">
              Wayframe
            </span>
            <span
              className="border border-border bg-surface-raised px-1.5 py-0.5 font-mono text-xs leading-none text-text-secondary"
              style={{ borderRadius: "2px" }}
            >
              beta
            </span>
          </div>

          <div>
            <p className="mb-6 inline-flex w-fit items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-text-secondary">
              <span aria-hidden="true" className="h-1.5 w-1.5 bg-accent" />
              flow modelling for engineers
            </p>
            <h2 className="max-w-[18ch] text-3xl font-semibold leading-[1.05] tracking-[-0.03em] text-text-primary xl:text-4xl">
              Describe the app.
              <br />
              <span className="text-text-secondary">Get the screen flow.</span>
            </h2>

            <div className="relative mt-9">
              <Crosshair className="-left-2 -top-2" />
              <Crosshair className="-right-2 -top-2" />
              <Crosshair className="-bottom-2 -left-2" />
              <Crosshair className="-bottom-2 -right-2" />
              <CanvasArt />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-5">
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">
              categories
            </span>
            {legend.map((item) => (
              <span key={item.label} className="flex items-center gap-2 font-mono text-xs text-text-secondary">
                <span aria-hidden="true" className="h-2 w-2" style={{ backgroundColor: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </aside>

      {/* Form column */}
      <div className="relative flex min-h-screen flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center border-b border-border px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 lg:hidden">
            <span aria-hidden="true" className="h-4 w-[3px] bg-accent" />
            <span className="font-mono text-[15px] font-semibold leading-none tracking-tight text-text-primary">
              Wayframe
            </span>
          </Link>
          <div className="ml-auto">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
          <div className="w-full max-w-[400px]">{children}</div>
        </main>

        <footer className="shrink-0 border-t border-border px-5 py-3 sm:px-8">
          <p className="font-mono text-[11px] text-text-secondary">
            no password · dark by default · light one toggle away
          </p>
        </footer>
      </div>
    </div>
  );
}
