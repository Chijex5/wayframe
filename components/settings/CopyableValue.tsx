// components/settings/CopyableValue.tsx
"use client";

import { useCallback, useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

// Small island: renders a monospace value (a user id, an email) with a
// copy-to-clipboard affordance. Server components can't hold the click handler or
// the "copied" state, so this lives on the client and receives the value as a prop.
type CopyableValueProps = {
  value: string;
  /** Screen-reader / tooltip label, e.g. "Copy user ID". */
  label: string;
  className?: string;
};

export function CopyableValue({ value, label, className }: CopyableValueProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard denied (insecure context / permissions) — leave the value shown.
    }
  }, [value]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={label}
      aria-label={label}
      className={`group inline-flex max-w-full items-center gap-2 border border-border bg-bg px-2.5 py-1.5 font-mono text-xs text-text-secondary transition-colors hover:border-accent hover:text-text-primary ${className ?? ""}`}
    >
      <span className="truncate">{value}</span>
      {copied ? (
        <CheckIcon className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
      ) : (
        <CopyIcon
          className="h-3.5 w-3.5 shrink-0 text-text-secondary transition-colors group-hover:text-accent"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
