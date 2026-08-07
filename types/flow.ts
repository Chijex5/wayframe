import type { Edge, Node } from "@xyflow/react";

export type ScreenCategory = "core" | "commerce" | "auth";

export type ScreenNodeData = {
  label: string;
  screenId: string;
  category: ScreenCategory;
  isConnectionTarget?: boolean;
  onDelete?: (id: string) => void;
};

export type ScreenNodeType = Node<ScreenNodeData, "screen">;

export type CategoryMeta = {
  label: string;
  /** CSS custom property holding the flat category color. */
  colorVar: string;
};

export const categoryMeta: Record<ScreenCategory, CategoryMeta> = {
  core: { label: "core", colorVar: "var(--cat-core)" },
  commerce: { label: "commerce", colorVar: "var(--cat-commerce)" },
  auth: { label: "auth", colorVar: "var(--cat-auth)" },
};

/**
 * Tool-call shape a real model response is mapped into. These are the five PRD
 * §7 graph operations; the model plans them, `validateToolCalls` checks the
 * whole batch against the current graph, and `applyCallToGraph` folds each over
 * the canvas. `addNode` carries a server-computed `position` (the model returns
 * semantics only); the other four reference existing nodes by id.
 */
export type FlowToolCall =
  | {
      type: "addNode";
      payload: {
        id: string;
        label: string;
        screenId: string;
        category: ScreenCategory;
        position: { x: number; y: number };
      };
    }
  | {
      type: "removeNode";
      payload: { id: string };
    }
  | {
      type: "renameNode";
      payload: { id: string; label: string };
    }
  | {
      type: "addEdge";
      payload: { source: string; target: string };
    }
  | {
      type: "removeEdge";
      payload: { source: string; target: string };
    };

/** Immutable graph snapshot captured at the moment a version is recorded. */
export type FlowSnapshot = {
  nodes: ScreenNodeType[];
  edges: Edge[];
};

export type FlowVersion = {
  id: string;
  label: string;
  summary: string;
  timestamp: string;
  source: "chat" | "manual" | "suggestion" | "restore";
  /**
   * Full graph as it stood when this version was recorded. Restoring a version
   * replays this snapshot onto the canvas. Optional so a version can be logged
   * before its post-commit graph is captured (see useFlowEngine).
   */
  snapshot?: FlowSnapshot;
};

/** Which operation failed, so the UI can attach the error to the right surface. */
export type FlowErrorScope = "generate" | "edit" | "check";

/**
 * A user-facing operation failure. `retryable` distinguishes transient failures
 * (worth a retry button) from rejections a blind retry cannot fix — e.g. a
 * malformed edit — where the flow was preserved and the user should rephrase.
 */
export type FlowError = {
  scope: FlowErrorScope;
  message: string;
  retryable: boolean;
};
