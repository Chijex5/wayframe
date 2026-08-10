"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpIcon, ChevronUpIcon, MessageSquareIcon, RotateCwIcon, XIcon } from "lucide-react";
import type { ChatMessage } from "../data/mockProjects";
import type { FlowError } from "../types/flow";

type CommandBarProps = {
  isBusy: boolean;
  isGenerating: boolean;
  isRetrying: boolean;
  error: FlowError | null;
  chatMessages: ChatMessage[];
  replyText: string;
  isReplyStreaming: boolean;
  onSubmit: (text: string) => void;
  onRetry: () => void;
  onDismissError: () => void;
};

/**
 * Floating dock pattern (v0 / Lovable style):
 * - Collapsed: a slim pill, input-height only, centered, well clear of
 *   canvas chrome on every edge.
 * - Expanded: grows UPWARD with a capped max-height so it never spans the
 *   full viewport height or covers top-left canvas controls.
 * - Never full-width: max-w keeps it centered with breathing room either side.
 */
export function CommandBar({
  isBusy,
  isGenerating,
  isRetrying,
  error,
  chatMessages,
  replyText,
  isReplyStreaming,
  onSubmit,
  onRetry,
  onDismissError,
}: CommandBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const genError = error && error.scope !== "check" ? error : null;

  const submit = () => {
    const text = draft.trim();
    if (!text || isBusy) return;
    onSubmit(text);
    setDraft("");
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="pointer-events-auto w-full max-w-[640px]">
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, y: 12, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: 12, height: 0 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="mb-2 max-h-[45vh] overflow-y-auto rounded-2xl border border-white/10 bg-surface/90 p-3 shadow-2xl backdrop-blur-xl"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-text-secondary">
                  {chatMessages.length} messages
                </span>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              <ul className="flex flex-col gap-2">
                {chatMessages.map((m) => (
                  <li
                    key={m.id}
                    className={[
                      "max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                      m.role === "user"
                        ? "ml-auto bg-accent text-white"
                        : "bg-surface-raised text-text-primary",
                    ].join(" ")}
                  >
                    {m.text}
                  </li>
                ))}
                {isReplyStreaming && (
                  <li className="max-w-[85%] rounded-xl bg-surface-raised px-3 py-2 text-sm text-text-secondary">
                    {replyText || "Thinking…"}
                  </li>
                )}
              </ul>

              {genError && (
                <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-danger/10 px-2.5 py-2 text-xs text-danger">
                  <span>{genError.message}</span>
                  <div className="flex items-center gap-1">
                    {genError.retryable && (
                      <button
                        type="button"
                        onClick={onRetry}
                        disabled={isRetrying}
                        className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-danger/20"
                      >
                        <RotateCwIcon className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onDismissError}
                      className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-danger/20"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-surface/95 px-2 py-2 shadow-xl backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Collapse chat" : "Expand chat"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
          >
            {expanded ? (
              <ChevronUpIcon className="h-4 w-4 rotate-180" />
            ) : (
              <MessageSquareIcon className="h-4 w-4" />
            )}
          </button>

          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => setExpanded(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Describe your app, or a change… e.g. add a payment step after cart"
            className="min-w-0 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
          />

          <button
            type="button"
            onClick={submit}
            disabled={isBusy || !draft.trim()}
            aria-label="Send"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowUpIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}