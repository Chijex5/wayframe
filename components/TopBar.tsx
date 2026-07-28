import React from 'react';
import Link from 'next/link';
import { HistoryIcon, ShieldCheckIcon } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import type { Theme } from '../hooks/useTheme';

type TopBarProps = {
  theme: Theme;
  onToggleTheme: () => void;
  isHistoryOpen: boolean;
  onToggleHistory: () => void;
  versionLabel: string | null;
  canCheckFlow: boolean;
  isChecking: boolean;
  onCheckFlow: () => void;
};

export function TopBar({
  theme,
  onToggleTheme,
  isHistoryOpen,
  onToggleHistory,
  versionLabel,
  canCheckFlow,
  isChecking,
  onCheckFlow
}: TopBarProps) {
  return (
    <header className="z-30 flex h-12 w-full shrink-0 items-center justify-between border-b border-border bg-surface px-3">
      <div className="flex items-center gap-2.5">
        <Link
          href="/"
          aria-label="Back to Wayframe home"
          className="flex items-center gap-2.5">
          
          <span aria-hidden="true" className="h-3.5 w-[3px] bg-accent" />
          <h1 className="font-mono text-lg font-semibold leading-none tracking-tight text-text-primary">
            Wayframe
          </h1>
        </Link>
        <span
          className="border border-border bg-surface-raised px-1.5 py-0.5 font-mono text-xs leading-none text-text-secondary"
          style={{ borderRadius: '2px' }}>
          
          {versionLabel ?? 'draft'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCheckFlow}
          disabled={!canCheckFlow || isChecking}
          aria-label="Check my flow against known patterns"
          className={[
          'inline-flex h-7 items-center gap-2 border px-2.5 text-xs transition-colors',
          canCheckFlow && !isChecking ?
          'border-accent bg-accent text-white hover:opacity-90' :
          'cursor-not-allowed border-border bg-surface text-text-secondary opacity-60'].
          join(' ')}
          style={{ borderRadius: '2px' }}>
          
          <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="font-mono font-medium">
            {isChecking ? 'Analyzing…' : 'Check my flow'}
          </span>
        </button>

        <span aria-hidden="true" className="h-5 w-px bg-border" />

        <button
          type="button"
          onClick={onToggleHistory}
          aria-expanded={isHistoryOpen}
          aria-label="Toggle version history"
          className={[
          'inline-flex h-7 items-center gap-2 border px-2 text-xs transition-colors',
          isHistoryOpen ?
          'border-accent bg-surface-raised text-accent' :
          'border-border bg-surface text-text-secondary hover:bg-surface-raised hover:text-text-primary'].
          join(' ')}
          style={{ borderRadius: '2px' }}>
          
          <HistoryIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="font-mono uppercase tracking-wide">History</span>
        </button>

        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </header>);

}