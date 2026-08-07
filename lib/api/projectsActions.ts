"use server";

// Phase 4 persistence layer — the authenticated backend behind the projects
// store. Every function mirrors lib/auth/actions.ts: authenticate via the real
// session, verify ownership on the server (never trust the client), and write
// through Drizzle (ORM only, no raw SQL). Server actions are POST-only and
// reachable directly, so ownership is enforced on EVERY call — a caller can hit
// these without going through our UI.
//
// neon-http has no multi-statement transactions, so flow updates and version
// inserts are independent, idempotent writes: the flow row is the source of
// truth for the graph; a version row is an append-only audit entry.
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db, schema } from "@/lib/db";
import { sanitizeNodes } from "@/lib/flow/sanitizeNodes";
import type {
  ActionResult,
  PersistVersionInput,
  ProjectPatch,
  ProjectSummary,
} from "./types";
import type { FlowVersion } from "@/types/flow";

type FlowRow = typeof schema.flows.$inferSelect;
type VersionRow = typeof schema.flowVersions.$inferSelect;

const EXPIRED = "Your session has expired. Sign in again." as const;

/** Row → ProjectSummary. DB `updatedAt` is a Date; the wire shape is ISO. */
function toSummary(row: FlowRow): ProjectSummary {
  return {
    id: row.id,
    name: row.name,
    updatedAt: row.updatedAt.toISOString(),
    nodes: row.nodes,
    edges: row.edges,
    chatMessages: row.chatMessages,
  };
}

/** Row → FlowVersion. DB `timestamp` is a Date; the wire shape is ISO. */
function toVersion(row: VersionRow): FlowVersion {
  return {
    id: row.id,
    label: row.label,
    summary: row.summary,
    source: row.source,
    timestamp: row.timestamp.toISOString(),
    snapshot: row.snapshot ?? undefined,
  };
}

/**
 * Ownership guard: resolves the flow row only if it belongs to `uid`, else null.
 * Written once and reused by every action that mutates a flow or its versions,
 * so the scoping check is never forgotten.
 */
async function ownedFlow(uid: string, flowId: string): Promise<FlowRow | null> {
  const [row] = await db
    .select()
    .from(schema.flows)
    .where(and(eq(schema.flows.id, flowId), eq(schema.flows.userId, uid)));
  return row ?? null;
}

export async function listProjects(): Promise<ActionResult<ProjectSummary[]>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: EXPIRED };

  const rows = await db
    .select()
    .from(schema.flows)
    .where(eq(schema.flows.userId, session.user.id))
    .orderBy(desc(schema.flows.updatedAt));

  return { ok: true, data: rows.map(toSummary) };
}

export async function getProject(
  id: string,
): Promise<ActionResult<ProjectSummary>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: EXPIRED };

  const row = await ownedFlow(session.user.id, id);
  if (!row) return { ok: false, error: "Project not found." };

  return { ok: true, data: toSummary(row) };
}

export async function createProject(): Promise<ActionResult<ProjectSummary>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: EXPIRED };

  const [row] = await db
    .insert(schema.flows)
    .values({
      userId: session.user.id,
      name: "Untitled Project",
      nodes: [],
      edges: [],
      chatMessages: [],
    })
    .returning();

  if (!row) return { ok: false, error: "Couldn't create the project." };

  revalidatePath("/app");
  return { ok: true, data: toSummary(row) };
}

export async function updateProject(
  id: string,
  patch: ProjectPatch,
): Promise<ActionResult<ProjectSummary>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: EXPIRED };

  // Authoritative transient-field strip: even if a caller forgets, onDelete /
  // isConnectionTarget never reach the DB. Only sanitize when nodes are present.
  const set: Partial<typeof schema.flows.$inferInsert> = {
    ...patch,
    updatedAt: new Date(),
  };
  if (patch.nodes) set.nodes = sanitizeNodes(patch.nodes);

  // Ownership lives in the WHERE: a non-owner update matches 0 rows.
  const [row] = await db
    .update(schema.flows)
    .set(set)
    .where(and(eq(schema.flows.id, id), eq(schema.flows.userId, session.user.id)))
    .returning();

  if (!row) return { ok: false, error: "Project not found." };

  revalidatePath("/app");
  return { ok: true, data: toSummary(row) };
}

export async function deleteProject(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: EXPIRED };

  // flow_versions cascade on the FK, so a single delete clears the history too.
  const [row] = await db
    .delete(schema.flows)
    .where(and(eq(schema.flows.id, id), eq(schema.flows.userId, session.user.id)))
    .returning({ id: schema.flows.id });

  if (!row) return { ok: false, error: "Project not found." };

  revalidatePath("/app");
  return { ok: true, data: { id: row.id } };
}

export async function listVersions(
  flowId: string,
): Promise<ActionResult<FlowVersion[]>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: EXPIRED };

  const parent = await ownedFlow(session.user.id, flowId);
  if (!parent) return { ok: false, error: "Project not found." };

  const rows = await db
    .select()
    .from(schema.flowVersions)
    .where(eq(schema.flowVersions.flowId, flowId))
    .orderBy(desc(schema.flowVersions.timestamp));

  return { ok: true, data: rows.map(toVersion) };
}

export async function persistVersion(
  flowId: string,
  input: PersistVersionInput,
): Promise<ActionResult<FlowVersion>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: EXPIRED };

  const parent = await ownedFlow(session.user.id, flowId);
  if (!parent) return { ok: false, error: "Project not found." };

  const [row] = await db
    .insert(schema.flowVersions)
    .values({
      flowId,
      label: input.label,
      summary: input.summary,
      source: input.source,
      snapshot: input.snapshot ?? null,
    })
    .returning();

  if (!row) return { ok: false, error: "Couldn't save the version." };

  return { ok: true, data: toVersion(row) };
}
