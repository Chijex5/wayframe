// lib/flow/validateToolCalls.ts
//
// Frontend + server guard mirroring PRD §7.4: a malformed tool call
// (referencing a nonexistent node id, duplicating an id, leaving a required
// field empty, or connecting an edge that already exists) is rejected before it
// reaches canvas state, so the diagram never enters an inconsistent state. The
// same validation runs server-side in /api/edit; keeping it pure means both
// paths share one definition and reject identically.

import type { FlowToolCall, ScreenNodeType } from "@/types/flow";
import type { Edge } from "@xyflow/react";

export class InvalidToolCallError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidToolCallError";
  }
}

type Graph = { nodes: ScreenNodeType[]; edges: Edge[] };

const edgeKey = (source: string, target: string) => `${source}->${target}`;

/**
 * Validates a batch against the graph it will be applied to. Effects of earlier
 * calls are visible to later ones: a node added earlier in the batch can be
 * connected to, a node removed earlier can no longer be referenced, and an edge
 * added earlier cannot be added again. Throws InvalidToolCallError on the first
 * problem — batches are all-or-nothing, so one bad call rejects the whole set.
 */
export function validateToolCalls(calls: FlowToolCall[], graph: Graph): void {
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  const edgeKeys = new Set(
    graph.edges.map((edge) => edgeKey(edge.source, edge.target)),
  );

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
      case "removeNode": {
        const { id } = call.payload;
        if (!nodeIds.has(id)) {
          throw new InvalidToolCallError(
            "Cannot remove a screen that does not exist.",
          );
        }
        // Removing a node cascades to its incident edges (see reducer), so drop
        // them here too — a later call cannot reference the gone node or edges.
        nodeIds.delete(id);
        for (const key of edgeKeys) {
          const [source, target] = key.split("->");
          if (source === id || target === id) edgeKeys.delete(key);
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
      case "addEdge": {
        const { source, target } = call.payload;
        if (source === target) {
          throw new InvalidToolCallError("A screen cannot connect to itself.");
        }
        if (!nodeIds.has(source) || !nodeIds.has(target)) {
          throw new InvalidToolCallError(
            "A connection references a screen that does not exist.",
          );
        }
        if (edgeKeys.has(edgeKey(source, target))) {
          throw new InvalidToolCallError(
            "That connection already exists.",
          );
        }
        edgeKeys.add(edgeKey(source, target));
        break;
      }
      case "removeEdge": {
        const { source, target } = call.payload;
        if (!edgeKeys.has(edgeKey(source, target))) {
          throw new InvalidToolCallError(
            "Cannot remove a connection that does not exist.",
          );
        }
        edgeKeys.delete(edgeKey(source, target));
        break;
      }
    }
  }
}
