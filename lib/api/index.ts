// Client service entrypoint.
//
// UI code imports operations from this module only. Each operation is swapped
// from mock to real independently as backend phases land — callers never change.
// All three are now live; the mock service (./mock/flowService) is fully off the
// live path and kept only for reference/tests until Phase 8 cleanup.
//   - generateFlow → POST /api/generate (Phase 5, live)
//   - editFlow     → POST /api/edit (Phase 6, live)
//   - checkCompleteness → POST /api/check (Phase 7, live)

export { checkCompleteness, editFlow, generateFlow } from "./http/flowService";

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
