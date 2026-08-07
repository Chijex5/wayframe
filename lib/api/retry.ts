// lib/api/retry.ts
//
// Retry-with-backoff wrapper for service calls. PRD §7.4: transient model
// failures (Gemini rate limits) should retry automatically with backoff while
// the user sees a "still working" state, never a raw error. UI callers wrap a
// service call with this and get an onRetry hook to drive that state.
//
// During the frontend phase the mock never throws, so this is inert; Phase 5/6
// services throw RetryableError on 429/5xx and this begins to do real work.

export class RetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RetryableError";
  }
}

type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  /** Called before each retry with the upcoming attempt number (1-based). */
  onRetry?: (attempt: number) => void;
  /** Injectable sleep so this stays deterministic under test. */
  sleep?: (ms: number) => Promise<void>;
};

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** Only RetryableError is retried; anything else fails fast and unchanged. */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    retries = 3,
    baseDelayMs = 500,
    onRetry,
    sleep = defaultSleep,
  } = options;

  let attempt = 0;
  for (;;) {
    try {
      return await operation();
    } catch (error) {
      if (!(error instanceof RetryableError) || attempt >= retries) throw error;
      attempt += 1;
      onRetry?.(attempt);
      // Exponential backoff: 500ms, 1s, 2s.
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }
}
