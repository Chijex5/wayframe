// components/SettingsSidebar.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserIcon, SettingsIcon, PaletteIcon } from "lucide-react";

const NAV_ITEMS = [
  { href: "/app/settings/profile", label: "Profile", icon: UserIcon },
  { href: "/app/settings/account", label: "Account", icon: SettingsIcon },
  { href: "/app/settings/appearance", label: "Appearance", icon: PaletteIcon },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-surface p-2 md:h-full md:w-56 md:flex-col md:overflow-visible md:border-b-0 md:border-r">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex shrink-0 items-center gap-2.5 border-l-2 px-2.5 py-2 text-sm transition-colors ${
              isActive
                ? "border-accent bg-surface-raised text-text-primary font-medium"
                : "border-transparent text-text-secondary hover:bg-surface-raised hover:text-text-primary"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
