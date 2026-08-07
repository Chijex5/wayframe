import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangleIcon, CheckIcon, RotateCwIcon, ShieldCheckIcon, XIcon } from "lucide-react";
import { categoryMeta } from "../types/flow";
import type { FlowError } from "../types/flow";
import type { FlowSuggestion } from "../data/suggestions";

type SuggestionsPanelProps = {
  isOpen: boolean;
  isChecking: boolean;
  error: FlowError | null;
  suggestions: FlowSuggestion[];
  onClose: () => void;
  onApprove: (suggestion: FlowSuggestion) => void;
  onReject: (id: string) => void;
  onRetry: () => void;
};

export function SuggestionsPanel({
  isOpen,
  isChecking,
  error,
  suggestions,
  onClose,
  onApprove,
  onReject,
  onRetry,
}: SuggestionsPanelProps) {
  // The bar owns generate/edit errors; this panel only surfaces check failures.
  const checkError = error && error.scope === "check" ? error : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          aria-label="Flow completeness check"
          initial={{ x: 340 }}
          animate={{ x: 0 }}
          exit={{ x: 340 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="absolute inset-y-0 right-0 z-20 flex w-full max-w-[340px] flex-col border-l border-border bg-surface"
        >
          <div className="border-b border-border bg-bg px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
                  pattern check
                </p>
                <h2 className="mt-1 flex items-center gap-2 font-mono text-sm font-semibold text-text-primary">
                  <ShieldCheckIcon className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  Flow check
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close flow check"
                className="flex h-7 w-7 items-center justify-center border border-border text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
              >
                <XIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-3 border border-border bg-surface px-2 py-1.5 font-mono text-[11px] text-text-secondary">
              {isChecking
                ? "analysis running"
                : checkError
                  ? "check failed"
                  : suggestions.length > 0
                    ? `${suggestions.length} possible gap${suggestions.length > 1 ? "s" : ""} found`
                    : "no open suggestions"}
            </div>
          </div>

          {checkError && !isChecking && (
            <div
              role="alert"
              className="flex items-start gap-2 border-b border-danger/40 bg-danger/10 px-3 py-2"
            >
              <AlertTriangleIcon
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-relaxed text-danger">{checkError.message}</p>
                {checkError.retryable && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="mt-2 inline-flex h-6 items-center gap-1 border border-danger/50 px-1.5 font-mono text-[11px] text-danger transition-colors hover:bg-danger hover:text-white"
                  >
                    <RotateCwIcon className="h-3 w-3" aria-hidden="true" />
                    Run check again
                  </button>
                )}
              </div>
            </div>
          )}

          {isChecking ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
              <span className="flex items-center gap-1" aria-hidden="true">
                {[0, 1, 2].map((index) => (
                  <motion.span
                    key={index}
                    className="h-1.5 w-1.5 bg-accent"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{
                      duration: 1.1,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.18,
                    }}
                  />
                ))}
              </span>
              <p
                className="text-center font-mono text-xs leading-relaxed text-text-secondary"
                role="status"
                aria-live="polite"
              >
                Analyzing your flow against known app patterns...
              </p>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {suggestions.length === 0 ? (
                <p className="border border-border bg-bg p-3 text-sm leading-relaxed text-text-secondary">
                  {checkError
                    ? "The check didn't finish, so no suggestions were produced. Retry above to run it again."
                    : "Every suggestion has been handled. Run the check again after editing the flow."}
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  <AnimatePresence initial={false}>
                    {suggestions.map((suggestion) => (
                      <motion.li
                        key={suggestion.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 24 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="border border-border bg-bg p-3"
                      >
                        <div className="mb-2 flex items-start gap-2">
                          <span
                            aria-hidden="true"
                            className="mt-1.5 h-1.5 w-1.5 shrink-0"
                            style={{
                              backgroundColor: categoryMeta[suggestion.category].colorVar,
                            }}
                          />
                          <div className="min-w-0">
                            <h3 className="text-sm font-medium leading-tight text-text-primary">
                              {suggestion.title}
                            </h3>
                            <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-text-secondary">
                              {categoryMeta[suggestion.category].label} / {suggestion.screenId}
                            </p>
                          </div>
                        </div>
                        <p className="mb-3 pl-3.5 text-sm leading-snug text-text-secondary">
                          {suggestion.rationale}
                        </p>
                        <div className="flex items-center gap-1.5 pl-3.5">
                          <button
                            type="button"
                            onClick={() => onApprove(suggestion)}
                            className="inline-flex h-7 items-center gap-1 border border-accent bg-accent px-2 font-mono text-xs text-white transition-opacity hover:opacity-90"
                          >
                            <CheckIcon className="h-3 w-3" aria-hidden="true" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => onReject(suggestion.id)}
                            className="inline-flex h-7 items-center gap-1 border border-border bg-surface px-2 font-mono text-xs text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
                          >
                            <XIcon className="h-3 w-3" aria-hidden="true" />
                            Reject
                          </button>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
