import type { ScreenNodeType } from "@/types/flow";

/**
 * Strips transient UI fields from nodes before persistence. The DB schema
 * mandates this at the repository seam (flows.nodes comment): onDelete and
 * isConnectionTarget are runtime-only callbacks/flags that must never reach
 * the database. Also forces selected:false so restored snapshots are clean.
 */
export function sanitizeNodes(nodes: ScreenNodeType[]): ScreenNodeType[] {
  return nodes.map((node) => ({
    ...node,
    selected: false,
    data: {
      label: node.data.label,
      screenId: node.data.screenId,
      category: node.data.category,
    },
  }));
}
