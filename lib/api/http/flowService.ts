// lib/api/http/flowService.ts
//
// Real, fetch-backed implementations of the flow service contracts. Swapped in
// for the mock behind ../index.ts, one operation at a time as backend phases
// land. Phase 5 ships `generateFlow` → POST /api/generate; editFlow and
// checkCompleteness stay mock-backed until Phases 6-7.
//
// Retry contract: transient statuses (429 rate limit, 503 transient) and network
// failures throw RetryableError so the caller's withRetry() backs off and retries.
// Everything else throws a plain Error the UI surfaces as a non-retryable failure.

import { RetryableError } from "../retry";
import type { GenerateFlowRequest, GenerateFlowResult } from "../types";

export async function generateFlow(
  request: GenerateFlowRequest,
): Promise<GenerateFlowResult> {
  let response: Response;
  try {
    response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    // Offline / DNS / aborted transport — worth a retry.
    throw new RetryableError("Network error reaching the generation service.");
  }

  if (response.ok) {
    return (await response.json()) as GenerateFlowResult;
  }

  if (response.status === 429 || response.status === 503) {
    throw new RetryableError(
      `Generation temporarily unavailable (${response.status}).`,
    );
  }

  throw new Error(`Flow generation failed (${response.status}).`);
}
