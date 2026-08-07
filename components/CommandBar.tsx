import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangleIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  MessageSquareIcon,
  RotateCwIcon,
  XIcon,
} from "lucide-react";
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
  onSubmit: (instruction: string) => void;
  onRetry: () => void;
  onDismissError: () => void;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function roleLabel(role: ChatMessage["role"]) {
  if (role === "user") return "you";
  if (role === "system") return "system";
  return "wayframe";
}

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
  const [value, setValue] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const hasText = value.trim().length > 0;

  const visibleMessages = useMemo(() => {
    if (!isReplyStreaming || replyText.length === 0) return chatMessages;

    return [
      ...chatMessages,
      {
        id: "streaming_reply",
        role: "assistant" as const,
        text: replyText,
        createdAt: new Date().toISOString(),
      },
    ];
  }, [chatMessages, isReplyStreaming, replyText]);

  const busyStatus = isRetrying
    ? "retrying"
    : isGenerating
      ? "generating flow"
      : isBusy
        ? "working"
        : null;

  // Check-scope failures surface in the SuggestionsPanel; the bar only owns
  // generate/edit errors so the two don't render the same message twice.
  const barError = error && error.scope !== "check" ? error : null;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [value]);

  useEffect(() => {
    if (!isBusy) textareaRef.current?.focus();
  }, [isBusy]);

  useEffect(() => {
    if (!isChatOpen) return;
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [isChatOpen, visibleMessages.length, replyText]);

  const handleSubmit = () => {
    if (!hasText || isBusy) return;
    onSubmit(value.trim());
    setValue("");
    setIsChatOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-[720px] flex-col gap-2">
        <AnimatePresence>
          {isChatOpen && visibleMessages.length > 0 && (
            <motion.div
              key="transcript"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="overflow-hidden border border-border bg-surface shadow-[0_2px_24px_rgba(0,0,0,0.35)]"
            >
              <div className="flex items-center justify-between border-b border-border bg-bg px-3 py-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary">
                  Conversation
                </span>
                <button
                  type="button"
                  onClick={() => setIsChatOpen(false)}
                  aria-label="Collapse conversation"
                  className="flex h-5 w-5 items-center justify-center text-text-secondary transition-colors hover:text-text-primary"
                >
                  <XIcon className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>

              <div ref={transcriptRef} className="max-h-[320px] overflow-y-auto px-4 py-4">
                <div className="flex flex-col gap-5">
                  {visibleMessages.map((message) => (
                    <div key={message.id} className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={[
                            "font-mono text-[10px] font-semibold uppercase tracking-[0.14em]",
                            message.role === "user"
                              ? "text-accent"
                              : message.role === "system"
                                ? "text-text-secondary"
                                : "text-text-primary",
                          ].join(" ")}
                        >
                          {roleLabel(message.role)}
                        </span>
                        <span className="font-mono text-[10px] text-text-secondary">
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                      <p
                        className={[
                          "whitespace-pre-wrap text-sm leading-relaxed",
                          message.role === "system"
                            ? "text-text-secondary"
                            : "text-text-primary",
                        ].join(" ")}
                      >
                        {message.text}
                        {message.id === "streaming_reply" && (
                          <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-accent" />
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="border border-border bg-surface shadow-[0_2px_24px_rgba(0,0,0,0.35)]">
          {barError && (
            <div
              role="alert"
              className="flex items-start gap-2 border-b border-danger/40 bg-danger/10 px-3 py-2"
            >
              <AlertTriangleIcon
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger"
                aria-hidden="true"
              />
              <p className="min-w-0 flex-1 text-xs leading-relaxed text-danger">
                {barError.message}
              </p>
              {barError.retryable && (
                <button
                  type="button"
                  onClick={onRetry}
                  disabled={isBusy}
                  className="inline-flex h-6 shrink-0 items-center gap-1 border border-danger/50 px-1.5 font-mono text-[11px] text-danger transition-colors hover:bg-danger hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCwIcon className="h-3 w-3" aria-hidden="true" />
                  Retry
                </button>
              )}
              <button
                type="button"
                onClick={onDismissError}
                aria-label="Dismiss error"
                className="flex h-6 w-6 shrink-0 items-center justify-center text-danger transition-opacity hover:opacity-70"
              >
                <XIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          )}

          <div className="px-3 pt-3">
            <label className="sr-only" htmlFor="wayframe-command-input">
              Describe your app or a change to the flow
            </label>
            <textarea
              id="wayframe-command-input"
              ref={textareaRef}
              rows={1}
              value={value}
              disabled={isBusy}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your app, or a change... e.g. add a payment step after cart"
              className="block max-h-[140px] w-full resize-none bg-transparent text-sm leading-relaxed text-text-primary placeholder:text-text-secondary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="flex items-center justify-between gap-2 px-2.5 pb-2 pt-1.5">
            <button
              type="button"
              onClick={() => setIsChatOpen((open) => !open)}
              disabled={visibleMessages.length === 0}
              aria-expanded={isChatOpen}
              className="inline-flex h-7 items-center gap-1.5 px-1 font-mono text-[11px] text-text-secondary transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <MessageSquareIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Chat
              {visibleMessages.length > 0 && (
                <span className="border border-border bg-bg px-1.5 py-0.5 text-[10px] leading-none">
                  {visibleMessages.length}
                </span>
              )}
              <ChevronDownIcon
                className={`h-3 w-3 transition-transform ${isChatOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>

            <div className="flex items-center gap-2.5">
              {busyStatus && (
                <span className="font-mono text-[11px] text-text-secondary">
                  {busyStatus}
                </span>
              )}

              {isBusy ? (
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center"
                  aria-label="Working"
                  role="status"
                >
                  <span className="flex items-center gap-1">
                    {[0, 1, 2].map((index) => (
                      <motion.span
                        key={index}
                        className="h-1 w-1 bg-text-secondary"
                        animate={{ opacity: [0.25, 1, 0.25] }}
                        transition={{
                          duration: 0.9,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: index * 0.15,
                        }}
                      />
                    ))}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!hasText}
                  aria-label="Send instruction"
                  className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center border transition-colors",
                    hasText
                      ? "border-accent bg-accent text-white hover:opacity-90"
                      : "cursor-not-allowed border-border bg-surface text-text-secondary",
                  ].join(" ")}
                >
                  <ArrowUpIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
