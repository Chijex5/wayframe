// app/signin/check-email/page.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MailCheckIcon } from "lucide-react";
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
    <div className="rounded-2xl border border-border bg-surface">
      <div className="flex flex-col items-center gap-3 px-6 pb-2 pt-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <MailCheckIcon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">Check your inbox</h1>
        {pendingEmail ? (
          <p className="text-sm text-text-secondary">
            We sent a link to <span className="font-medium text-text-primary">{pendingEmail}</span>.
          </p>
        ) : (
          <p className="text-sm text-text-secondary">Your sign-in link is on its way.</p>
        )}
      </div>

      <div className="flex flex-col gap-4 p-6">
        <div className="rounded-xl bg-surface-raised p-3.5 text-xs leading-relaxed text-text-secondary">
          It can take a minute or two to arrive. Check your spam folder if you don&apos;t see it.
          The link stops working after it&apos;s used once.
        </div>

        <p className="text-center text-xs text-text-secondary">
          Wrong address?{" "}
          <Link href="/signin" className="font-medium text-accent transition-opacity hover:opacity-80">
            Use a different email
          </Link>
        </p>
      </div>
    </div>
  );
}