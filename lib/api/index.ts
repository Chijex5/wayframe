// Client service entrypoint.
//
// UI code imports operations from this module only. Each operation is swapped
// from mock to real independently as backend phases land — callers never change.
//   - generateFlow → POST /api/generate (Phase 5, live)
//   - editFlow     → POST /api/edit (Phase 6, live)
//   - checkCompleteness → mock (Phase 7 replaces this)

export { editFlow, generateFlow } from "./http/flowService";

export { checkCompleteness } from "./mock/flowService";

export { RetryableError, withRetry } from "./retry";

export type {
  CompletenessCheckRequest,
  CompletenessCheckResult,
  EditFlowRequest,
  EditFlowResult,
  FlowEdgeSeed,
  FlowGraph,
  FlowNode,
  GenerateFlowRequest,
  GenerateFlowResult,
  ProjectPatch,
  ProjectSummary,
} from "./types";
