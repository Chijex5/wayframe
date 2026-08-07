// lib/flow/validateToolCalls.ts
//
// Frontend guard mirroring PRD §7.4: a malformed tool call (referencing a
// nonexistent node id, duplicating an id, or leaving a required field empty) is
// rejected before it reaches canvas state, so the diagram never enters an
// inconsistent state. The same validation runs server-side in a later phase;
// keeping it pure means both paths share one definition.

import type { FlowToolCall, ScreenNodeType } from "@/types/flow";
import type { Edge } from "@xyflow/react";

export class InvalidToolCallError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidToolCallError";
  }
}

type Graph = { nodes: ScreenNodeType[]; edges: Edge[] };

/**
 * Validates a batch against the graph it will be applied to. Node ids created
 * earlier in the same batch are visible to later calls, so an addNode followed
 * by a connect to it is valid. Throws InvalidToolCallError on the first
 * problem — batches are all-or-nothing, so one bad call rejects the whole set.
 */
export function validateToolCalls(calls: FlowToolCall[], graph: Graph): void {
  const nodeIds = new Set(graph.nodes.map((node) => node.id));

  for (const call of calls) {
    switch (call.type) {
      case "addNode": {
        const { id, label, screenId } = call.payload;
        if (!id || !label.trim() || !screenId.trim()) {
          throw new InvalidToolCallError(
            "A new screen is missing a name or identifier.",
          );
        }
        if (nodeIds.has(id)) {
          throw new InvalidToolCallError(
            `A screen with id "${id}" already exists.`,
          );
        }
        nodeIds.add(id);
        break;
      }
      case "connect": {
        const { source, target } = call.payload;
        if (source === target) {
          throw new InvalidToolCallError("A screen cannot connect to itself.");
        }
        if (!nodeIds.has(source) || !nodeIds.has(target)) {
          throw new InvalidToolCallError(
            "A connection references a screen that does not exist.",
          );
        }
        break;
      }
      case "renameNode": {
        const { id, label } = call.payload;
        if (!nodeIds.has(id)) {
          throw new InvalidToolCallError(
            "Cannot rename a screen that does not exist.",
          );
        }
        if (!label.trim()) {
          throw new InvalidToolCallError("A screen name cannot be empty.");
        }
        break;
      }
    }
  }
}
