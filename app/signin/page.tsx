// app/signin/page.tsx
"use client";

import { SyntheticEvent, useEffect, useState } from "react";
import { ArrowRightIcon, MailIcon, ShieldCheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Crosshair } from "@/components/landing/BlueprintGrid";
import { useSessionStore } from "@/store/useSessionStore";

export default function SignInPage() {
  const router = useRouter();
  const status = useSessionStore((state) => state.status);
  const requestLink = useSessionStore((state) => state.requestLink);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/app");
  }, [router, status]);

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await requestLink(email);
      if (!result.ok) {
        setError(result.error ?? "Enter a valid email address.");
        return;
      }
      router.push("/signin/check-email");
    } catch {
      setError("The sign-in request failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <Crosshair className="-left-2 -top-2" />
      <Crosshair className="-right-2 -top-2" />
      <Crosshair className="-bottom-2 -left-2" />
      <Crosshair className="-bottom-2 -right-2" />

      <section className="border border-border bg-surface">
        <div className="relative border-b border-border bg-bg p-5 sm:p-6">
          <span aria-hidden="true" className="absolute left-0 top-0 h-full w-[3px] bg-accent" />
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-secondary">
            workspace access
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.02em] text-text-primary">
            Sign in to Wayframe
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            Enter your email and we&apos;ll send a secure link to your workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5 sm:p-6">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary">
              Email address
            </span>
            <span className="relative">
              <MailIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
                aria-hidden="true"
              />
              <input
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "signin-error" : undefined}
                className="h-11 w-full border border-border bg-bg pl-9 pr-3 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-accent"
              />
            </span>
          </label>

          {error && (
            <p
              id="signin-error"
              role="alert"
              className="border border-danger/40 bg-danger/10 px-3 py-2 text-xs leading-relaxed text-danger"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !email.trim()}
            className="group inline-flex h-11 items-center justify-center gap-2 border border-accent bg-accent px-3 font-mono text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:border-border disabled:bg-surface-raised disabled:text-text-secondary"
          >
            {isSubmitting ? "Sending link..." : "Email me a sign-in link"}
            {!isSubmitting && (
              <ArrowRightIcon
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            )}
          </button>

          <div className="flex items-start gap-2 border-t border-border pt-4 text-xs leading-relaxed text-text-secondary">
            <ShieldCheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
            <span>No password required. Each link expires after a single use.</span>
          </div>
        </form>
      </section>
    </div>
  );
}
