// components/settings/DeleteAccount.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangleIcon, LoaderIcon, Trash2Icon } from "lucide-react";
import { deleteAccount } from "@/lib/account/actions";
import { useSessionStore } from "@/store/useSessionStore";

// Irreversible action, so it's gated twice: the destructive form is collapsed
// behind a button, and arming it requires typing the exact confirmation phrase.
// The server action does the cascade delete (user row → accounts/sessions/flows/
// versions) and clears the auth cookie; here we just collect intent and, on
// success, reset client session state and send the user to the marketing home.
const CONFIRM_PHRASE = "delete my account";

type DeleteAccountProps = {
  email: string;
};

export function DeleteAccount({ email }: DeleteAccountProps) {
  const router = useRouter();
  const resetSession = useSessionStore((state) => state.signOut);
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const armed = confirmText.trim().toLowerCase() === CONFIRM_PHRASE;

  const handleDelete = async () => {
    if (!armed) return;
    setError(null);
    setIsDeleting(true);
    try {
      const result = await deleteAccount();
      if (!result.ok) {
        setError(result.error);
        setIsDeleting(false);
        return;
      }
      // Clear the client store's cached session, then leave the app entirely.
      await resetSession().catch(() => {});
      router.push("/");
    } catch {
      setError("We couldn't delete your account. Try again.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <AlertTriangleIcon
          className="mt-0.5 h-4 w-4 shrink-0 text-danger"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-medium text-text-primary">Delete account</p>
          <p className="mt-1 text-xs leading-relaxed text-text-secondary">
            Permanently removes <span className="font-mono text-text-primary">{email}</span>,
            every project, its version history, and all active sessions. This cannot be undone.
          </p>
        </div>
      </div>

      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex h-9 w-fit items-center justify-center gap-2 border border-danger/50 bg-danger/5 px-3 font-mono text-xs font-medium text-danger transition-colors hover:bg-danger/15"
        >
          <Trash2Icon className="h-3.5 w-3.5" aria-hidden="true" />
          Delete this account
        </button>
      ) : (
        <div className="flex flex-col gap-3 border border-danger/40 bg-danger/5 p-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
              Type “{CONFIRM_PHRASE}” to confirm
            </span>
            <input
              value={confirmText}
              onChange={(event) => {
                setConfirmText(event.target.value);
                setError(null);
              }}
              autoComplete="off"
              spellCheck={false}
              disabled={isDeleting}
              className="h-9 border border-border bg-bg px-3 font-mono text-sm text-text-primary outline-none focus:border-danger disabled:cursor-not-allowed disabled:text-text-secondary"
            />
          </label>

          {error && (
            <p
              role="alert"
              className="border border-danger/40 bg-danger/10 px-3 py-2 font-mono text-xs text-danger"
            >
              {error}
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!armed || isDeleting}
              className="inline-flex h-9 items-center justify-center gap-2 border border-danger bg-danger px-3 font-mono text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-raised disabled:text-text-secondary"
            >
              {isDeleting && (
                <LoaderIcon className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              )}
              {isDeleting ? "Deleting…" : "Permanently delete"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setConfirmText("");
                setError(null);
              }}
              disabled={isDeleting}
              className="inline-flex h-9 items-center justify-center border border-border bg-bg px-3 font-mono text-xs font-medium text-text-secondary transition-colors hover:text-text-primary disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
