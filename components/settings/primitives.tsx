// components/settings/primitives.tsx
//
// Server-safe presentational building blocks shared across the settings pages.
// No "use client" — these are pure markup so they render inside server components
// (the Account page) and client ones alike. They encode the app's blueprint look
// (sharp corners, mono labels, bordered surfaces) once, so each page composes
// sections instead of re-deriving the chrome.
import React from "react";
import type { LucideIcon } from "lucide-react";

/** Page-level heading block: breadcrumb-style eyebrow, title, and lead copy. */
export function SettingsHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="relative overflow-hidden border border-border bg-surface">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative p-5">
        <p className="font-mono text-xs uppercase tracking-wide text-accent">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-bold leading-tight text-text-primary">
          {title}
        </h1>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-text-secondary">
          {description}
        </p>
      </div>
    </header>
  );
}

/** A bordered card with a mono section label header and free-form body. */
export function SettingsSection({
  label,
  action,
  children,
  tone = "default",
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  tone?: "default" | "danger";
}) {
  const headerBorder = tone === "danger" ? "border-danger/30" : "border-border";
  const cardBorder = tone === "danger" ? "border-danger/30" : "border-border";
  return (
    <section className={`border ${cardBorder} bg-surface`}>
      <div
        className={`flex items-center justify-between gap-3 border-b ${headerBorder} px-4 py-3`}
      >
        <h2
          className={`font-mono text-xs font-semibold uppercase tracking-wide ${
            tone === "danger" ? "text-danger" : "text-text-primary"
          }`}
        >
          {label}
        </h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

/** A labelled metric tile (value + mono caption), used in stat grids. */
export function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
}) {
  return (
    <div className="border border-border bg-bg p-3">
      <Icon className="h-3.5 w-3.5 text-text-secondary" aria-hidden={true} />
      <div className="mt-3 font-mono text-xl font-semibold leading-none text-text-primary">
        {value}
      </div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-wide text-text-secondary">
        {label}
      </div>
    </div>
  );
}

/**
 * Avatar: user image when set, otherwise mono initials on the accent block.
 * Sharp-cornered to match the app (no rounded-full), matching the blueprint feel.
 */
export function Avatar({
  name,
  image,
  initials,
  size = "md",
}: {
  name: string;
  image?: string | null;
  initials: string;
  size?: "md" | "lg";
}) {
  const dim = size === "lg" ? "h-16 w-16 text-xl" : "h-12 w-12 text-base";
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element -- avatar is a remote user URL, not a build asset
    return (
      <img
        src={image}
        alt={name}
        className={`${dim} shrink-0 border border-border object-cover`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`${dim} flex shrink-0 items-center justify-center border border-accent/50 bg-accent/15 font-mono font-semibold text-accent`}
    >
      {initials}
    </span>
  );
}

/** A definition row: mono uppercase key on the left, value on the right. */
export function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
