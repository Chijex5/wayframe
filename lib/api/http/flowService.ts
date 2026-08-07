// lib/api/http/flowService.ts
//
// Real, fetch-backed implementations of the flow service contracts. Swapped in
// for the mock behind ../index.ts, one operation at a time as backend phases
// land. Phase 5 ships `generateFlow` → POST /api/generate; Phase 6 ships
// `editFlow` → POST /api/edit; Phase 7 ships `checkCompleteness` → POST
// /api/check. All three operations are now live — the mock service is fully off
// the live path.
//
// Retry contract: transient statuses (429 rate limit, 503 transient) and network
// failures throw RetryableError so the caller's withRetry() backs off and retries.
// A 422 from /api/edit is an atomic rejection (a malformed batch that a blind
// retry cannot fix) — it throws InvalidToolCallError, which runEdit surfaces as a
// non-retryable "rephrase" message. Everything else throws a plain Error the UI
// surfaces as a non-retryable failure.

import { RetryableError } from "../retry";
import { InvalidToolCallError } from "@/lib/flow/validateToolCalls";
import type {
  CompletenessCheckRequest,
  CompletenessCheckResult,
  EditFlowRequest,
  EditFlowResult,
  GenerateFlowRequest,
  GenerateFlowResult,
} from "../types";

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

/** Reads the server's plain-English error message, falling back to a default. */
async function readErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string" && body.error.trim()) return body.error;
  } catch {
    // Non-JSON error body — use the fallback.
  }
  return fallback;
}

export async function editFlow(
  request: EditFlowRequest,
): Promise<EditFlowResult> {
  let response: Response;
  try {
    response = await fetch("/api/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    // Offline / DNS / aborted transport — worth a retry.
    throw new RetryableError("Network error reaching the edit service.");
  }

  if (response.ok) {
    return (await response.json()) as EditFlowResult;
  }

  // Atomic rejection: the planned batch was invalid against the current graph.
  // A blind retry replans the same invalid calls, so this is non-retryable —
  // InvalidToolCallError routes it to runEdit's "rephrase" branch, carrying the
  // server's plain-English reason.
  if (response.status === 422) {
    throw new InvalidToolCallError(
      await readErrorMessage(response, "That edit was rejected."),
    );
  }

  if (response.status === 429 || response.status === 503) {
    throw new RetryableError(
      `Edit temporarily unavailable (${response.status}).`,
    );
  }

  throw new Error(`Flow edit failed (${response.status}).`);
}

export async function checkCompleteness(
  request: CompletenessCheckRequest,
): Promise<CompletenessCheckResult> {
  let response: Response;
  try {
    response = await fetch("/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    // Offline / DNS / aborted transport — worth a retry.
    throw new RetryableError("Network error reaching the completeness service.");
  }

  if (response.ok) {
    return (await response.json()) as CompletenessCheckResult;
  }

  if (response.status === 429 || response.status === 503) {
    throw new RetryableError(
      `Completeness check temporarily unavailable (${response.status}).`,
    );
  }

  throw new Error(`Completeness check failed (${response.status}).`);
}

