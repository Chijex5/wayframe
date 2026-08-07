// Client service entrypoint.
//
// UI code imports operations from this module only. During the frontend phase
// they resolve to mock-backed services; backend phases replace these exports
// with fetch-based implementations for /api/generate, /api/edit, and /api/check.

export {
  checkCompleteness,
  editFlow,
  generateFlow,
} from "./mock/flowService";

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
