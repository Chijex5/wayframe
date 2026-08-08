"use server";

// lib/account/actions.ts
//
// Account-level mutations behind the settings page. Same contract as
// lib/auth/actions.ts and lib/api/projectsActions.ts: authenticate via the real
// session, enforce ownership in the WHERE clause (server actions are POST-only
// and directly reachable — never trust the caller), write through Drizzle only.
//
// neon-http has no multi-statement transactions; each statement here is a single
// idempotent write, so no cross-statement atomicity is assumed.

import { cookies } from "next/headers";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth, signOut } from "@/auth";
import { db, schema } from "@/lib/db";

const EXPIRED = "Your session has expired. Sign in again." as const;

export type AccountActionResult =
  | { ok: true; revoked: number }
  | { ok: false; error: string };

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; error: string };

const SESSION_COOKIE = "authjs.session-token";
const SECURE_SESSION_COOKIE = "__Secure-authjs.session-token";

async function currentSessionToken(): Promise<string | null> {
  const store = await cookies();
  return (
    store.get(SESSION_COOKIE)?.value ??
    store.get(SECURE_SESSION_COOKIE)?.value ??
    null
  );
}

/**
 * "Sign out everywhere else" — deletes every session row for the user except the
 * one backing this browser, so other devices are logged out on their next request
 * (the database strategy validates the cookie against a session row every time).
 * The current session is preserved by excluding its token; if the token can't be
 * resolved we refuse rather than risk logging the user out of their own tab.
 */
export async function revokeOtherSessions(): Promise<AccountActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: EXPIRED };

  const token = await currentSessionToken();
  if (!token) {
    return {
      ok: false,
      error: "We couldn't identify this session. Reload and try again.",
    };
  }

  const revoked = await db
    .delete(schema.sessions)
    .where(
      and(
        eq(schema.sessions.userId, session.user.id),
        ne(schema.sessions.sessionToken, token),
      ),
    )
    .returning({ token: schema.sessions.sessionToken });

  revalidatePath("/app/settings/account");
  return { ok: true, revoked: revoked.length };
}

/**
 * Permanently deletes the account. The user row is the root: accounts, sessions,
 * flows, and flow_versions all cascade on their FKs (onDelete: "cascade"), so a
 * single delete clears every owned record. We then clear the auth cookie via
 * signOut so the now-orphaned cookie doesn't linger. Irreversible — the UI gates
 * this behind an explicit type-to-confirm.
 */
export async function deleteAccount(): Promise<DeleteAccountResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: EXPIRED };

  const [deleted] = await db
    .delete(schema.users)
    .where(eq(schema.users.id, session.user.id))
    .returning({ id: schema.users.id });

  if (!deleted) {
    return { ok: false, error: "We couldn't find your account. Sign in again." };
  }

  // Cookie now points at a session row that cascaded away; drop it so the browser
  // isn't left holding a dead token. redirect:false — the client navigates.
  await signOut({ redirect: false });

  return { ok: true };
}
