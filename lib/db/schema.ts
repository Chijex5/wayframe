// Drizzle schema — the single source of truth for every table.
//
// Type-only imports use RELATIVE paths (not the `@/` alias) on purpose: drizzle-kit
// loads this file outside the Next/tsconfig resolver and does not reliably resolve
// path aliases here. Type imports are erased at load, so relative paths are safe
// regardless of who imports the file.
//
// Auth tables follow the canonical @auth/drizzle-adapter shape (singular table names,
// camelCase columns) so Phase 3 can drop the adapter in without a migration. App
// tables use snake_case. `type` on accounts is plain text to avoid importing
// @auth/core before Phase 3 — reconciled against the installed adapter then.
import {
  index,
  integer,
  jsonb,
  pgEnum,
  uuid,
  pgTable,
  primaryKey,
  text,
  timestamp,
  vector,
} from "drizzle-orm/pg-core";
import type { Edge } from "@xyflow/react";
import type { FlowSnapshot, ScreenNodeType } from "../../types/flow";
import type { ChatMessage } from "../../data/mockProjects";

// -- Auth.js (canonical Drizzle adapter shape) -------------------------------

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  // Unique: email is the magic-link identity key, and it matches the canonical
  // @auth/drizzle-adapter pg shape (adapter getUserByEmail resolves one row).
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (token) => [primaryKey({ columns: [token.identifier, token.token] })],
);

// -- Flows (↔ ProjectSummary) ------------------------------------------------

// nodes/edges/chatMessages are notNull with an empty-array default: a flow always
// has these collections (empty, never null), which keeps Phase 4 read code free of
// null guards. Transient node fields (onDelete, isConnectionTarget) are stripped
// before persistence — handled at the repository seam in Phase 4, not here.
export const flows = pgTable("flows", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  nodes: jsonb("nodes").$type<ScreenNodeType[]>().notNull().default([]),
  edges: jsonb("edges").$type<Edge[]>().notNull().default([]),
  chatMessages: jsonb("chat_messages")
    .$type<ChatMessage[]>()
    .notNull()
    .default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// -- Flow versions (↔ FlowVersion; net-new, not persisted in the mock today) --

export const flowVersionSource = pgEnum("flow_version_source", [
  "chat",
  "manual",
  "suggestion",
  "restore",
]);

export const flowVersions = pgTable("flow_versions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  flowId: text("flow_id")
    .notNull()
    .references(() => flows.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  summary: text("summary").notNull(),
  source: flowVersionSource("source").notNull(),
  // Nullable: a version can be logged before its post-commit graph is captured
  // (see useFlowEngine), matching the optional `snapshot` on the FlowVersion type.
  snapshot: jsonb("snapshot").$type<FlowSnapshot>(),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// -- Pattern chunks (RAG completeness library) -------------------------------

// `content` is the text embedded in Phase 7; `embedding` stays NULL until then.
// 768 dims sits under pgvector's 2000-dim HNSW ceiling (MRL-truncated from
// gemini-embedding-001). The HNSW cosine index is created now but indexes nothing
// until embeddings are backfilled — the seed inserts text/category only.
export const patternChunks = pgTable(
  "pattern_chunks",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),
    category: text("category").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 768 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("pattern_chunks_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
);

