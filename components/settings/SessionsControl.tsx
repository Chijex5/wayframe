// components/settings/SessionsControl.tsx
"use client";

import { useState } from "react";
import { LaptopIcon, LoaderIcon, MonitorSmartphoneIcon } from "lucide-react";
import { revokeOtherSessions } from "@/lib/account/actions";

// Interactive slice of the Account "Active sessions" card. The count and current
// session come from the server read model (data.ts); this island owns only the
// "sign out everywhere else" action, its pending/result state, and an optimistic
// local count so the UI settles without a full navigation.
type SessionsControlProps = {
  total: number;
  otherCount: number;
  currentExpires: string | null;
};

function formatExpiry(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function SessionsControl({
  total,
  otherCount,
  currentExpires,
}: SessionsControlProps) {
  const [others, setOthers] = useState(otherCount);
  const [active, setActive] = useState(total);
  const [isRevoking, setIsRevoking] = useState(false);
  const [message, setMessage] = useState<
    { kind: "ok" | "error"; text: string } | null
  >(null);

  const handleRevoke = async () => {
    setMessage(null);
    setIsRevoking(true);
    try {
      const result = await revokeOtherSessions();
      if (result.ok) {
        setOthers(0);
        setActive((count) => Math.max(count - result.revoked, 1));
        setMessage({
          kind: "ok",
          text:
            result.revoked === 0
              ? "No other sessions were active."
              : `Signed out of ${result.revoked} other session${result.revoked === 1 ? "" : "s"}.`,
        });
      } else {
        setMessage({ kind: "error", text: result.error });
      }
    } catch {
      setMessage({ kind: "error", text: "Something went wrong. Try again." });
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-border bg-bg text-accent">
            <LaptopIcon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-text-primary">This device</p>
            <p className="mt-0.5 font-mono text-xs text-text-secondary">
              {currentExpires
                ? `Session valid until ${formatExpiry(currentExpires)}`
                : "Active now"}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 border border-accent/40 bg-accent/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          current
        </span>
      </div>

      <div className="flex items-center gap-3 border-t border-border pt-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-border bg-bg text-text-secondary">
          <MonitorSmartphoneIcon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium text-text-primary">
            {others === 0
              ? "No other active sessions"
              : `${others} other active session${others === 1 ? "" : "s"}`}
          </p>
          <p className="mt-0.5 font-mono text-xs text-text-secondary">
            {active} total across all devices
          </p>
        </div>
        <button
          type="button"
          onClick={handleRevoke}
          disabled={isRevoking || others === 0}
          className="inline-flex h-8 shrink-0 items-center gap-2 border border-border bg-bg px-2.5 font-mono text-xs font-medium text-text-primary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:text-text-secondary disabled:hover:border-border"
        >
          {isRevoking && (
            <LoaderIcon className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          )}
          {isRevoking ? "Signing out…" : "Sign out others"}
        </button>
      </div>

      {message && (
        <p
          role="status"
          className={`border px-3 py-2 font-mono text-xs ${
            message.kind === "ok"
              ? "border-accent/40 bg-accent/10 text-text-primary"
              : "border-danger/40 bg-danger/10 text-danger"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
