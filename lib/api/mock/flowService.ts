// lib/api/mock/flowService.ts
//
// Mock implementation of the flow service contracts. Wraps the existing in-repo
// mock engine (data/flowPayload, data/suggestions) behind the async, promise-
// returning shapes defined in ../types. Callers never import this directly —
// they go through ../index, so swapping to real /api/* fetch calls later is a
// one-file change with zero caller churn.

import { generationPayload, planToolCalls } from "@/data/flowPayload";
import { describeToolCall } from "@/lib/flow/describeToolCall";
import { mockSuggestions } from "@/data/suggestions";
import { deriveProjectName } from "@/lib/flow/deriveProjectName";
import type {
  CompletenessCheckRequest,
  CompletenessCheckResult,
  EditFlowRequest,
  EditFlowResult,
  GenerateFlowRequest,
  GenerateFlowResult,
} from "../types";

/** Simulated network/model latency so loading states behave like production. */
const GENERATE_LATENCY_MS = 220;
const EDIT_LATENCY_MS = 180;
const CHECK_LATENCY_MS = 1800;

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => window.setTimeout(() => resolve(value), ms));
}

export async function generateFlow(
  request: GenerateFlowRequest,
): Promise<GenerateFlowResult> {
  return delay(
    {
      projectName: deriveProjectName(request.description),
      nodes: generationPayload.nodes,
      edges: generationPayload.edges,
    },
    GENERATE_LATENCY_MS,
  );
}

export async function editFlow(
  request: EditFlowRequest,
): Promise<EditFlowResult> {
  const calls = planToolCalls(request.instruction, request.nodes);
  const summaries = calls.map((call) => describeToolCall(call, request.nodes));
  const summary = `Applied ${calls.length} change${
    calls.length > 1 ? "s" : ""
  }: ${summaries.join("; ")}.`;

  return delay({ calls, summaries, summary }, EDIT_LATENCY_MS);
}

export async function checkCompleteness(
  request: CompletenessCheckRequest,
): Promise<CompletenessCheckResult> {
  // Don't suggest a screen the flow already contains. Approximates what the
  // real RAG check does after retrieval: dedupe proposals against present nodes.
  const present = new Set(request.nodes.map((node) => node.data.screenId));
  const suggestions = mockSuggestions.filter(
    (suggestion) => !present.has(suggestion.screenId),
  );

  return delay({ suggestions }, CHECK_LATENCY_MS);
}
