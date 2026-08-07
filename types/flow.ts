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

/** Tool-call shape a real model response would be mapped into. */
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
      type: "connect";
      payload: { source: string; target: string };
    }
  | {
      type: "renameNode";
      payload: { id: string; label: string };
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
