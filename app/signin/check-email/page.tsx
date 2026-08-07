// app/signin/check-email/page.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MailCheckIcon } from "lucide-react";
import { Crosshair } from "@/components/landing/BlueprintGrid";
import { useSessionStore } from "@/store/useSessionStore";

export default function CheckEmailPage() {
  const router = useRouter();
  const status = useSessionStore((state) => state.status);
  const pendingEmail = useSessionStore((state) => state.pendingEmail);

  // The magic link is opened from the user's inbox in a fresh tab, which lands on
  // the Auth.js callback and creates the session. If this tab is still open when
  // that happens, a later hydrate flips status to authenticated — forward to /app.
  useEffect(() => {
    if (status === "authenticated") router.replace("/app");
  }, [router, status]);

  return (
    <div className="relative">
      <Crosshair className="-left-2 -top-2" />
      <Crosshair className="-right-2 -top-2" />
      <Crosshair className="-bottom-2 -left-2" />
      <Crosshair className="-bottom-2 -right-2" />

      <section className="border border-border bg-surface">
        <div className="flex flex-col items-center gap-3 border-b border-border bg-bg p-6 text-center">
          <span className="flex h-11 w-11 items-center justify-center border border-border bg-surface text-accent">
            <MailCheckIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-secondary">
            link sent
          </p>
          <h1 className="text-xl font-semibold tracking-[-0.02em] text-text-primary">
            Check your email
          </h1>
          {pendingEmail ? (
            <p className="text-sm leading-relaxed text-text-secondary">
              We sent a sign-in link to{" "}
              <span className="font-medium text-text-primary">{pendingEmail}</span>. Open it to
              continue to your workspace.
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-text-secondary">
              Your sign-in link is on its way. Open it to continue to your workspace.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="border border-dashed border-border bg-bg p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary">
              didn&apos;t get it?
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
              The link can take a minute to arrive. Check your spam folder, or request a new one —
              each link can only be used once and expires after a short while.
            </p>
          </div>

          <p className="text-center font-mono text-[11px] text-text-secondary">
            Wrong address?{" "}
            <Link href="/signin" className="text-accent transition-opacity hover:opacity-80">
              Use a different email
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
