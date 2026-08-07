// app/app/settings/profile/page.tsx
"use client";

import { SyntheticEvent, useState } from "react";
import { CheckCircle2Icon, SaveIcon } from "lucide-react";
import { initialsFromName } from "@/lib/auth/initials";
import { useSessionStore } from "@/store/useSessionStore";

export default function ProfilePage() {
  const session = useSessionStore((state) => state.session);
  const status = useSessionStore((state) => state.status);
  const updateProfile = useSessionStore((state) => state.updateProfile);
  // `null` means "unedited" — fall back to the session name so the field stays
  // in sync with the store without a render-triggering effect.
  const [draft, setDraft] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const sessionName = session?.user.name ?? "";
  const name = draft ?? sessionName;
  const trimmedName = name.trim();
  const isValid = trimmedName.length >= 2 && trimmedName.length <= 64;
  const hasChanges = trimmedName !== sessionName;

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSaved(false);

    if (!isValid) {
      setError("Display name must be between 2 and 64 characters.");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile(trimmedName);
      setDraft(null);
      setIsSaved(true);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Your profile could not be saved. Try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-label="Loading profile settings">
        <div className="h-28 animate-pulse border border-border bg-surface-raised" />
        <div className="h-24 animate-pulse border border-border bg-surface-raised" />
        <div className="h-44 animate-pulse border border-border bg-surface-raised" />
      </div>
    );
  }

  const displayName = session?.user.name ?? "Wayframe user";
  const displayEmail = session?.user.email ?? "Sign in to edit your profile";

  return (
    <div className="flex flex-col gap-4">
      <header className="border border-border bg-surface p-4">
        <p className="font-mono text-xs uppercase tracking-wide text-text-secondary">
          settings / user
        </p>
        <h1 className="mt-2 text-xl font-bold text-text-primary">Profile</h1>
        <p className="mt-1 text-sm text-text-secondary">
          This is how others will see you across Wayframe.
        </p>
      </header>

      <section className="flex items-center gap-4 border border-border bg-surface p-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent font-mono text-lg font-semibold text-white">
          {initialsFromName(displayName)}
        </span>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
            active identity
          </span>
          <span className="text-sm font-semibold text-text-primary">{displayName}</span>
          <span className="font-mono text-xs text-text-secondary">{displayEmail}</span>
        </div>
      </section>

      <section className="border border-border bg-surface">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-text-primary">
            public details
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-wide text-text-secondary">
              Display name
            </span>
            <input
              value={name}
              onChange={(event) => {
                setDraft(event.target.value);
                setError(null);
                setIsSaved(false);
              }}
              minLength={2}
              maxLength={64}
              disabled={!session || isSaving}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "profile-error" : "profile-name-hint"}
              className="h-10 border border-border bg-bg px-3 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-accent disabled:cursor-not-allowed disabled:bg-surface-raised disabled:text-text-secondary"
            />
            <span id="profile-name-hint" className="font-mono text-[10px] text-text-secondary">
              2-64 characters
            </span>
          </label>

          <div aria-live="polite">
            {error && (
              <p
                id="profile-error"
                role="alert"
                className="border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger"
              >
                {error}
              </p>
            )}
            {isSaved && (
              <p className="flex items-center gap-2 border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-text-primary">
                <CheckCircle2Icon className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                Profile saved.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!session || !isValid || !hasChanges || isSaving}
            className="inline-flex h-9 w-fit items-center justify-center gap-2 border border-accent bg-accent px-3 font-mono text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-raised disabled:text-text-secondary"
          >
            <SaveIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </section>
    </div>
  );
}
