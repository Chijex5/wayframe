// app/app/settings/account/page.tsx
//
// Server component: reads the account overview at request time and renders it,
// delegating every interaction (copy id, revoke sessions, sign out, delete) to
// small client islands. Nesting a server component under the client RequireAuth
// gate is fine — the gate receives already-rendered children as a prop.
import Link from "next/link";
import {
  BadgeCheckIcon,
  BoxesIcon,
  GitBranchIcon,
  HistoryIcon,
  KeyRoundIcon,
  LayersIcon,
  MailIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { getAccountOverview } from "@/lib/account/data";
import { initialsFromName } from "@/lib/auth/initials";
import { CopyableValue } from "@/components/settings/CopyableValue";
import { SessionsControl } from "@/components/settings/SessionsControl";
import { SignOutButton } from "@/components/settings/SignOutButton";
import { DeleteAccount } from "@/components/settings/DeleteAccount";
import {
  Avatar,
  FieldRow,
  SettingsHeader,
  SettingsSection,
  StatTile,
} from "@/components/settings/primitives";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export default async function AccountPage() {
  const overview = await getAccountOverview();

  // Signed-out fallback. RequireAuth (client) redirects to /signin; this only
  // shows for the instant before that, and never leaks data.
  if (!overview) {
    return (
      <>
        <SettingsHeader
          eyebrow="settings / account"
          title="Account"
          description="Manage your login, sessions, and account data."
        />
        <SettingsSection label="session">
          <p className="text-sm text-text-secondary">
            You&apos;re not signed in. Redirecting to sign in…
          </p>
        </SettingsSection>
      </>
    );
  }

  const { user, loginMethods, sessions, workspace } = overview;
  const displayName = user.name?.trim() || "Wayframe user";

  return (
    <>
      <SettingsHeader
        eyebrow="settings / account"
        title="Account"
        description="Your identity, how you sign in, active sessions, and account data — all in one place."
      />

      {/* -- Identity ----------------------------------------------------------- */}
      <SettingsSection
        label="identity"
        action={
          <span className="inline-flex items-center gap-1.5 border border-border bg-bg px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-text-secondary">
            <KeyRoundIcon className="h-3 w-3 text-accent" aria-hidden="true" />
            passwordless
          </span>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Avatar
              name={displayName}
              image={user.image}
              initials={initialsFromName(displayName)}
              size="lg"
            />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-text-primary">
                {displayName}
              </p>
              <p className="mt-0.5 flex items-center gap-2 font-mono text-xs text-text-secondary">
                <MailIcon className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="truncate">{user.email}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <FieldRow label="user id">
              <CopyableValue value={user.id} label="Copy user ID" />
            </FieldRow>
            <FieldRow label="email">
              {user.emailVerified ? (
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-text-primary">
                  <BadgeCheckIcon className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  Verified {formatDate(user.emailVerified)}
                </span>
              ) : (
                <span className="font-mono text-xs text-text-secondary">
                  Not yet verified
                </span>
              )}
            </FieldRow>
          </div>
        </div>
      </SettingsSection>

      {/* -- Login methods ------------------------------------------------------ */}
      <SettingsSection label="login methods">
        <div className="flex flex-col gap-2">
          {loginMethods.map((method) => (
            <div
              key={method.id}
              className="flex items-start gap-3 border border-border bg-bg p-3"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-border bg-surface text-accent">
                {method.kind === "email" ? (
                  <MailIcon className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium text-text-primary">
                  {method.label}
                  {method.verified && (
                    <span className="inline-flex items-center gap-1 border border-accent/40 bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-accent">
                      <BadgeCheckIcon className="h-3 w-3" aria-hidden="true" />
                      active
                    </span>
                  )}
                </p>
                <p className="mt-1 truncate font-mono text-xs text-text-secondary">
                  {method.detail}
                </p>
              </div>
            </div>
          ))}
          <p className="mt-1 flex items-start gap-2 font-mono text-[11px] leading-relaxed text-text-secondary">
            <KeyRoundIcon className="mt-0.5 h-3 w-3 shrink-0 text-text-secondary" aria-hidden="true" />
            No password to create, remember, or reset — you sign in with a secure,
            single-use link sent to your email.
          </p>
        </div>
      </SettingsSection>

      {/* -- Active sessions ---------------------------------------------------- */}
      <SettingsSection label="active sessions">
        <SessionsControl
          total={sessions.total}
          otherCount={sessions.otherCount}
          currentExpires={sessions.current?.expires ?? null}
        />
      </SettingsSection>

      {/* -- Workspace ---------------------------------------------------------- */}
      <SettingsSection
        label="workspace"
        action={
          <Link
            href="/app"
            className="font-mono text-[11px] uppercase tracking-wide text-text-secondary transition-colors hover:text-accent"
          >
            open →
          </Link>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile label="projects" value={workspace.projects} icon={BoxesIcon} />
            <StatTile label="screens" value={workspace.screens} icon={LayersIcon} />
            <StatTile label="connections" value={workspace.connections} icon={GitBranchIcon} />
            <StatTile label="versions" value={workspace.versions} icon={HistoryIcon} />
          </div>
          <p className="font-mono text-[11px] text-text-secondary">
            {workspace.lastActive
              ? `last edit · ${formatDate(workspace.lastActive)}`
              : "no projects yet"}
          </p>
        </div>
      </SettingsSection>

      {/* -- Session (sign out this device) ------------------------------------ */}
      <SettingsSection label="session">
        <div className="flex flex-col gap-3">
          <p className="text-xs leading-relaxed text-text-secondary">
            Sign out on this device only. You can return with a new email link at
            any time.
          </p>
          <SignOutButton />
        </div>
      </SettingsSection>

      {/* -- Danger zone -------------------------------------------------------- */}
      <SettingsSection label="danger zone" tone="danger">
        <DeleteAccount email={user.email} />
      </SettingsSection>
    </>
  );
}
