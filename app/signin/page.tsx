// app/signin/page.tsx
"use client";

import { SyntheticEvent, useEffect, useState } from "react";
import { ArrowRightIcon, MailIcon } from "lucide-react";
import { useRouter } from "next/navigation";
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
    <div className="rounded-2xl border border-border bg-surface">
      <div className="px-6 pt-6">
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">Sign in</h1>
        <p className="mt-1.5 text-sm text-text-secondary">We&apos;ll email you a link to sign in.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-primary">Email</span>
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
              className="h-11 w-full rounded-xl border border-border bg-bg pl-9 pr-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-accent"
            />
          </span>
        </label>

        {error && (
          <p id="signin-error" role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !email.trim()}
          className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-50"
        >
          {isSubmitting ? "Sending…" : "Continue with email"}
          {!isSubmitting && (
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          )}
        </button>

        <p className="text-center text-xs text-text-secondary">
          No password to remember. The link is valid for one sign-in.
        </p>
      </form>
    </div>
  );
}