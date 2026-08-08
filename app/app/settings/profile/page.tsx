// app/app/settings/profile/page.tsx
"use client";

import { SyntheticEvent, useState } from "react";
import { CheckCircle2Icon, SaveIcon } from "lucide-react";
import { initialsFromName } from "@/lib/auth/initials";
import { useSessionStore } from "@/store/useSessionStore";
import {
  Avatar,
  SettingsHeader,
  SettingsSection,
} from "@/components/settings/primitives";

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

  const displayName = session?.user.name?.trim() || "Wayframe user";
  const displayEmail = session?.user.email ?? "Sign in to edit your profile";
  const previewName = trimmedName.length >= 2 ? trimmedName : displayName;

  return (
    <>
      <SettingsHeader
        eyebrow="settings / profile"
        title="Profile"
        description="This is how you appear across Wayframe. Your display name shows on the workspace and in shared views."
      />

      {/* Live identity preview — updates as you type the display name. */}
      <SettingsSection label="identity">
        <div className="flex items-center gap-4">
          <Avatar
            name={previewName}
            image={session?.user.image}
            initials={initialsFromName(previewName)}
            size="lg"
          />
          <div className="min-w-0">
            <span className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
              active identity
            </span>
            <p className="mt-0.5 truncate text-lg font-semibold text-text-primary">
              {previewName}
            </p>
            <p className="truncate font-mono text-xs text-text-secondary">
              {displayEmail}
            </p>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection label="display name">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
              Name shown to others
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
            <span
              id="profile-name-hint"
              className="flex items-center justify-between font-mono text-[10px] text-text-secondary"
            >
              <span>2–64 characters</span>
              <span>{trimmedName.length}/64</span>
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
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </SettingsSection>
    </>
  );
}
