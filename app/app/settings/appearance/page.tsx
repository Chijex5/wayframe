// app/app/settings/appearance/page.tsx
"use client";

import { CheckIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme, type Theme } from "@/hooks/useTheme";
import { SettingsHeader, SettingsSection } from "@/components/settings/primitives";

// Each option carries the actual token values for its theme so the preview
// renders that palette faithfully regardless of the theme currently applied —
// you see light and dark side by side, then pick one.
type Palette = {
  bg: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
};

const OPTIONS: {
  value: Theme;
  label: string;
  hint: string;
  icon: typeof SunIcon;
  palette: Palette;
}[] = [
  {
    value: "dark",
    label: "Dark",
    hint: "Default · low-light blueprint",
    icon: MoonIcon,
    palette: {
      bg: "#0b0f14",
      surface: "#131820",
      border: "#2a323d",
      text: "#e4e7eb",
      muted: "#8b95a1",
      accent: "#4c8dff",
    },
  },
  {
    value: "light",
    label: "Light",
    hint: "Bright · high-contrast paper",
    icon: SunIcon,
    palette: {
      bg: "#f7f8fa",
      surface: "#ffffff",
      border: "#dce0e5",
      text: "#14181f",
      muted: "#5b6470",
      accent: "#2563eb",
    },
  },
];

/** A miniature of the app chrome painted in a fixed palette (not `currentColor`). */
function ThemePreview({ palette }: { palette: Palette }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none flex h-28 flex-col gap-2 border p-2.5"
      style={{ backgroundColor: palette.bg, borderColor: palette.border }}
    >
      <div className="flex items-center gap-1.5">
        <span style={{ width: 3, height: 12, backgroundColor: palette.accent }} />
        <span
          className="h-1.5 w-14 rounded-sm"
          style={{ backgroundColor: palette.muted }}
        />
        <span
          className="ml-auto h-4 w-8 rounded-sm"
          style={{ backgroundColor: palette.surface, border: `1px solid ${palette.border}` }}
        />
      </div>
      <div className="flex flex-1 gap-2">
        {[palette.accent, palette.text, palette.muted].map((c, i) => (
          <div
            key={i}
            className="flex flex-1 flex-col gap-1.5 rounded-sm p-1.5"
            style={{ backgroundColor: palette.surface, border: `1px solid ${palette.border}` }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} />
            <span className="h-1 w-full rounded-sm" style={{ backgroundColor: palette.border }} />
            <span className="h-1 w-2/3 rounded-sm" style={{ backgroundColor: palette.border }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AppearancePage() {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <SettingsHeader
        eyebrow="settings / appearance"
        title="Appearance"
        description="Choose how Wayframe looks. Your selection is saved to this browser and applied instantly."
      />

      <SettingsSection label="theme">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {OPTIONS.map((option) => {
            const isActive = theme === option.value;
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                aria-pressed={isActive}
                className={`group flex flex-col gap-3 border bg-bg p-2.5 text-left transition-colors ${
                  isActive
                    ? "border-accent ring-1 ring-accent"
                    : "border-border hover:border-text-secondary"
                }`}
              >
                <ThemePreview palette={option.palette} />
                <div className="flex items-center gap-2.5 px-0.5">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center border ${
                      isActive
                        ? "border-accent/50 bg-accent/15 text-accent"
                        : "border-border bg-surface text-text-secondary"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-text-primary">
                      {option.label}
                    </span>
                    <span className="block truncate font-mono text-[10px] text-text-secondary">
                      {option.hint}
                    </span>
                  </span>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center border transition-colors ${
                      isActive
                        ? "border-accent bg-accent text-white"
                        : "border-border text-transparent"
                    }`}
                  >
                    <CheckIcon className="h-3 w-3" aria-hidden="true" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <p className="mt-3 font-mono text-[11px] text-text-secondary">
          active theme · {theme}
        </p>
      </SettingsSection>
    </>
  );
}
