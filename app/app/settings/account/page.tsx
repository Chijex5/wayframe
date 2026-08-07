// app/app/settings/account/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRoundIcon, LogOutIcon, MailIcon } from "lucide-react";
import { useSession } from "@/hooks/useSession";

export default function AccountPage() {
  const router = useRouter();
  const { session, status, signOut } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setError(null);
    setIsSigningOut(true);
    try {
      await signOut();
      router.push("/signin");
    } catch {
      setError("Sign out failed. Try again.");
      setIsSigningOut(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="border border-border bg-surface p-4">
        <p className="font-mono text-xs uppercase tracking-wide text-text-secondary">
          settings / account
        </p>
        <h1 className="mt-2 text-xl font-bold text-text-primary">Account</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your login and account-level preferences.
        </p>
      </header>

      <section className="border border-border bg-surface">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-text-primary">
            login
          </h2>
        </div>
        <div className="flex flex-col gap-4 p-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-wide text-text-secondary">
              Email
            </span>
            <input
              disabled
              readOnly
              value={status === "loading" ? "Loading..." : (session?.user.email ?? "Not signed in")}
              className="h-10 border border-border bg-surface-raised px-3 text-sm text-text-secondary outline-none"
            />
          </label>

          <div className="grid gap-px border border-border bg-border sm:grid-cols-2">
            <div className="flex items-start gap-3 bg-bg p-3">
              <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-text-primary">Email magic link</p>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                  Sign in from a secure, single-use link sent to this address.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-bg p-3">
              <KeyRoundIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-text-primary">Passwordless</p>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                  There is no password to create, remember, or reset.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border border-border bg-surface">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-text-primary">
            session
          </h2>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <p className="text-xs text-text-secondary">
            Sign out on this device. You can return with a new email link at any time.
          </p>
          {error && (
            <p role="alert" className="border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={status !== "authenticated" || isSigningOut}
            className="inline-flex h-9 w-fit items-center justify-center gap-2 border border-border bg-bg px-3 font-mono text-xs font-medium text-text-primary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:text-text-secondary"
          >
            <LogOutIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </section>
    </div>
  );
}
