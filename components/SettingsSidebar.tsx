// components/SettingsSidebar.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRightIcon,
  PaletteIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";

// Grouped settings navigation. Each item carries a one-line description so the
// rail reads like a map of the section (Vercel-dashboard style) rather than a
// bare link list. Active state is a left accent rail + raised surface, matching
// the app's blueprint chrome.
const NAV_GROUP = {
  label: "account",
  items: [
    {
      href: "/app/settings/profile",
      label: "Profile",
      description: "Identity & display name",
      icon: UserIcon,
    },
    {
      href: "/app/settings/account",
      label: "Account",
      description: "Login, sessions, danger zone",
      icon: SettingsIcon,
    },
    {
      href: "/app/settings/appearance",
      label: "Appearance",
      description: "Theme & interface",
      icon: PaletteIcon,
    },
  ],
};

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Settings"
      className="shrink-0 border-b border-border bg-surface md:h-full md:w-64 md:border-b-0 md:border-r"
    >
      <div className="hidden px-4 pb-2 pt-5 md:block">
        <span className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
          {NAV_GROUP.label}
        </span>
      </div>
      <div className="flex gap-1 overflow-x-auto p-2 md:flex-col md:overflow-visible md:px-2 md:pt-0">
        {NAV_GROUP.items.map(({ href, label, description, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`group flex shrink-0 items-center gap-3 border-l-2 px-3 py-2.5 transition-colors ${
                isActive
                  ? "border-accent bg-surface-raised"
                  : "border-transparent hover:bg-surface-raised"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center border transition-colors ${
                  isActive
                    ? "border-accent/50 bg-accent/15 text-accent"
                    : "border-border bg-bg text-text-secondary group-hover:text-text-primary"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="hidden min-w-0 flex-col md:flex">
                <span
                  className={`text-sm font-medium ${
                    isActive ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary"
                  }`}
                >
                  {label}
                </span>
                <span className="truncate font-mono text-[10px] text-text-secondary">
                  {description}
                </span>
              </span>
              <span className="text-sm font-medium text-text-primary md:hidden">
                {label}
              </span>
              <ChevronRightIcon
                className={`ml-auto hidden h-3.5 w-3.5 shrink-0 transition-colors md:block ${
                  isActive ? "text-accent" : "text-transparent group-hover:text-text-secondary"
                }`}
                aria-hidden="true"
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
