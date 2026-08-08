// components/settings/SignOutButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { useSession } from "@/hooks/useSession";

// Signs out the current device only. Kept as its own island so the Account page
// can stay a server component while this owns the click, the pending state, and
// the redirect back to /signin.
export function SignOutButton() {
  const router = useRouter();
  const { status, signOut } = useSession();
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
    <div className="flex flex-col gap-2">
      {error && (
        <p
          role="alert"
          className="border border-danger/40 bg-danger/10 px-3 py-2 font-mono text-xs text-danger"
        >
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleSignOut}
        disabled={status !== "authenticated" || isSigningOut}
        className="inline-flex h-9 w-fit items-center justify-center gap-2 border border-border bg-bg px-3 font-mono text-xs font-medium text-text-primary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:text-text-secondary disabled:hover:border-border"
      >
        <LogOutIcon className="h-3.5 w-3.5" aria-hidden="true" />
        {isSigningOut ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
