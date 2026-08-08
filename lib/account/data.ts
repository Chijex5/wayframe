// lib/account/data.ts
//
// Read model for the Account settings page. A server component calls
// `getAccountOverview()` at request time; the page renders the result and hands
// serializable slices to small client islands (revoke sessions, delete account).
//
// `server-only` keeps `db` — and everything it reaches — out of any client
// bundle. This module never mutates; every mutation lives in ./actions.ts as a
// "use server" action, so the read path stays a plain (non-RPC) function.
//
// What's real here vs. what the schema simply doesn't store:
//   • Magic-link sign-in creates `user` + `session` + `verificationToken` rows,
//     but NEVER an `account` row — those come only from OAuth linkAccount. So for
//     an email-only user `accounts` is empty, and the sole login method is the
//     email magic link. We surface OAuth accounts too, for the day one is linked.
//   • `session` stores only { sessionToken, userId, expires } — no device, IP, or
//     created-at. We can therefore report how many sessions are active, when each
//     expires, and which one is THIS browser (by matching the auth cookie), but we
//     honestly cannot show device/location. We don't invent them.
//   • `user` has no createdAt, so there's no "member since". We lead with
//     email-verified instead, which we do have.
//
// Dates cross the server→client boundary as ISO strings (same convention as
// lib/api/projectsActions' toSummary/toVersion) so every island prop is trivially
// serializable and formatting is the client's concern.
import "server-only";
import { cookies } from "next/headers";
import { eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db, schema } from "@/lib/db";

/** A way the account can sign in. Email is always present; OAuth entries appear per linked account. */
export type LoginMethod = {
  id: string;
  kind: "email" | "oauth";
  /** Auth.js provider id — "resend" for the magic link, or the OAuth provider (e.g. "github"). */
  provider: string;
  label: string;
  detail: string;
  verified: boolean;
};

export type AccountOverview = {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    /** ISO timestamp of email verification, or null if never verified. */
    emailVerified: string | null;
  };
  loginMethods: LoginMethod[];
  sessions: {
    /** Total live session rows for this user (unexpired ones the DB still holds). */
    total: number;
    /** The session backing THIS request, matched by the auth cookie. Null if it can't be resolved. */
    current: { expires: string } | null;
    /** Sessions other than the current one — the count "sign out everywhere else" would revoke. */
    otherCount: number;
  };
  workspace: {
    projects: number;
    screens: number;
    connections: number;
    versions: number;
    /** Most recent flow edit across the workspace, ISO — the closest thing to "last active". */
    lastActive: string | null;
  };
};

// Auth.js database-strategy cookie: its value IS the session token (not a JWT).
// The name is prefixed with __Secure- when Auth.js uses secure cookies (https).
const SESSION_COOKIE = "authjs.session-token";
const SECURE_SESSION_COOKIE = "__Secure-authjs.session-token";

/** Reads the current session token from whichever cookie name is in play. */
async function currentSessionToken(): Promise<string | null> {
  const store = await cookies();
  return (
    store.get(SESSION_COOKIE)?.value ??
    store.get(SECURE_SESSION_COOKIE)?.value ??
    null
  );
}

/** Presents a raw OAuth provider id as a human label ("github" → "GitHub"). */
function providerLabel(provider: string): string {
  const known: Record<string, string> = {
    github: "GitHub",
    google: "Google",
    gitlab: "GitLab",
    apple: "Apple",
  };
  return known[provider] ?? provider.charAt(0).toUpperCase() + provider.slice(1);
}

/**
 * Assembles everything the Account page shows, all scoped to the signed-in user.
 * Returns null when there's no session — the page renders a signed-out fallback
 * and the client RequireAuth gate redirects. Every query filters by the owner's
 * id; nothing here trusts a client-supplied identifier.
 */
export async function getAccountOverview(): Promise<AccountOverview | null> {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) return null;

  const token = await currentSessionToken();

  // The authoritative user row (fresher than the session snapshot for image/name/verified).
  const [userRow] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      image: schema.users.image,
      emailVerified: schema.users.emailVerified,
    })
    .from(schema.users)
    .where(eq(schema.users.id, uid));

  if (!userRow) return null;

  // Linked OAuth accounts (empty for email-only users — expected, not an error).
  const accountRows = await db
    .select({
      provider: schema.accounts.provider,
      providerAccountId: schema.accounts.providerAccountId,
      type: schema.accounts.type,
    })
    .from(schema.accounts)
    .where(eq(schema.accounts.userId, uid));

  // Live sessions. Only counts and the current-session flag leave this module —
  // session tokens are secrets and never cross to the client.
  const sessionRows = await db
    .select({
      sessionToken: schema.sessions.sessionToken,
      expires: schema.sessions.expires,
    })
    .from(schema.sessions)
    .where(eq(schema.sessions.userId, uid));

  // Workspace flows — pulled with their graphs so we can total screens/connections
  // the same way the dashboard does (bounded: a single user's own projects).
  const flowRows = await db
    .select({
      id: schema.flows.id,
      nodes: schema.flows.nodes,
      edges: schema.flows.edges,
      updatedAt: schema.flows.updatedAt,
    })
    .from(schema.flows)
    .where(eq(schema.flows.userId, uid));

  const flowIds = flowRows.map((row) => row.id);

  // Version count across all owned flows (append-only history). Skip the query
  // entirely when there are no flows to reference.
  const versionRows = flowIds.length
    ? await db
        .select({ id: schema.flowVersions.id })
        .from(schema.flowVersions)
        .where(inArray(schema.flowVersions.flowId, flowIds))
    : [];

  // -- Derive the presentation model --------------------------------------------

  const loginMethods: LoginMethod[] = [
    {
      id: "email",
      kind: "email",
      provider: "resend",
      label: "Email magic link",
      detail: userRow.email,
      verified: Boolean(userRow.emailVerified),
    },
    ...accountRows.map((account) => ({
      id: `${account.provider}:${account.providerAccountId}`,
      kind: "oauth" as const,
      provider: account.provider,
      label: providerLabel(account.provider),
      detail: `Connected · ${account.type}`,
      verified: true,
    })),
  ];

  const currentSession =
    token && sessionRows.some((row) => row.sessionToken === token)
      ? {
          expires: sessionRows
            .find((row) => row.sessionToken === token)!
            .expires.toISOString(),
        }
      : null;

  const screens = flowRows.reduce((sum, row) => sum + row.nodes.length, 0);
  const connections = flowRows.reduce((sum, row) => sum + row.edges.length, 0);
  const lastActive = flowRows.reduce<Date | null>((latest, row) => {
    return !latest || row.updatedAt.getTime() > latest.getTime()
      ? row.updatedAt
      : latest;
  }, null);

  return {
    user: {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      image: userRow.image,
      emailVerified: userRow.emailVerified ? userRow.emailVerified.toISOString() : null,
    },
    loginMethods,
    sessions: {
      total: sessionRows.length,
      current: currentSession,
      otherCount: currentSession ? Math.max(sessionRows.length - 1, 0) : sessionRows.length,
    },
    workspace: {
      projects: flowRows.length,
      screens,
      connections,
      versions: versionRows.length,
      lastActive: lastActive ? lastActive.toISOString() : null,
    },
  };
}
