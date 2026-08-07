// lib/flow/describeToolCall.ts
//
// Pure, one-line human summary for each of the five PRD §7 tool calls. Lives in
// lib/flow (not data/flowPayload) so both the mock service and the server
// /api/edit route can produce summaries without importing @xyflow/react's
// runtime MarkerType. `nodes` is the graph as it stood BEFORE the batch, used
// only to resolve ids to their display labels.

import type { FlowToolCall, ScreenNodeType } from "@/types/flow";

export function describeToolCall(
  call: FlowToolCall,
  nodes: ScreenNodeType[],
): string {
  const labelOf = (id: string) =>
    nodes.find((node) => node.id === id)?.data.label ?? id;

  switch (call.type) {
    case "addNode":
      return `Added ${call.payload.label} node`;
    case "removeNode":
      return `Removed ${labelOf(call.payload.id)} node`;
    case "renameNode":
      return `Renamed node to ${call.payload.label}`;
    case "addEdge":
      return `Connected ${labelOf(call.payload.source)} → ${labelOf(
        call.payload.target,
      )}`;
    case "removeEdge":
      return `Disconnected ${labelOf(call.payload.source)} → ${labelOf(
        call.payload.target,
      )}`;
    default:
      return "Applied change";
  }
}
