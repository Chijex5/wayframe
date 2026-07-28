import React from 'react';
import { MoonIcon, SunIcon } from 'lucide-react';
import type { Theme } from '../hooks/useTheme';

type ThemeToggleProps = {
  theme: Theme;
  onToggle: () => void;
};

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={isDark}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className="inline-flex h-7 items-center gap-2 rounded-sm border border-border bg-surface px-2 text-xs text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary">
      
      {isDark ?
      <MoonIcon className="h-3.5 w-3.5" aria-hidden="true" /> :

      <SunIcon className="h-3.5 w-3.5" aria-hidden="true" />
      }
      <span className="font-mono uppercase tracking-wide">
        {isDark ? 'dark' : 'light'}
      </span>
    </button>);

}