"use server";

// Profile mutation as a server action — the secure replacement for the mock's
// updateProfile. It authenticates via the real session, re-validates input on the
// server (never trusting the client), and writes through Drizzle (ORM only, no raw
// SQL). The client calls this from the session store and then re-hydrates.
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, schema } from "@/lib/db";
import type { SessionUser } from "./types";

export type UpdateProfileResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: string };

export async function updateDisplayName(
  name: string,
): Promise<UpdateProfileResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Your session has expired. Sign in again." };
  }

  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 64) {
    return {
      ok: false,
      error: "Display name must be between 2 and 64 characters.",
    };
  }

  const [updated] = await db
    .update(schema.users)
    .set({ name: trimmed })
    .where(eq(schema.users.id, session.user.id))
    .returning();

  if (!updated) {
    return { ok: false, error: "We couldn't find your account. Sign in again." };
  }

  return {
    ok: true,
    user: {
      id: updated.id,
      name: updated.name ?? trimmed,
      email: updated.email,
      image: updated.image ?? null,
    },
  };
}
