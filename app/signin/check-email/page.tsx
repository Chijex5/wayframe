// app/signin/check-email/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MailCheckIcon } from "lucide-react";
import { Crosshair } from "@/components/landing/BlueprintGrid";
import { useSessionStore } from "@/store/useSessionStore";

export default function CheckEmailPage() {
  const router = useRouter();
  const status = useSessionStore((state) => state.status);
  const pendingEmail = useSessionStore((state) => state.pendingEmail);
  const verifyLink = useSessionStore((state) => state.verifyLink);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") router.replace("/app");
  }, [router, status]);

  const handleOpenLink = async () => {
    setError(null);
    setIsVerifying(true);
    try {
      await verifyLink();
      router.push("/app");
    } catch {
      setError("That link could not be verified. Request a new one.");
      setIsVerifying(false);
    }
  };

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
          {error && (
            <p
              role="alert"
              className="border border-danger/40 bg-danger/10 px-3 py-2 text-xs leading-relaxed text-danger"
            >
              {error}
            </p>
          )}

          <div className="border border-dashed border-border bg-bg p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary">
              frontend preview
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
              Email delivery is wired up alongside Auth.js. For now, open the link here to finish
              signing in.
            </p>
            <button
              type="button"
              onClick={handleOpenLink}
              disabled={isVerifying || !pendingEmail}
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 border border-accent bg-accent px-3 font-mono text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:border-border disabled:bg-surface-raised disabled:text-text-secondary"
            >
              {isVerifying ? "Opening workspace..." : "Open sign-in link"}
            </button>
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
