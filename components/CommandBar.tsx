import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpIcon, ChevronDownIcon, MessageSquareIcon } from "lucide-react";
import type { ChatMessage } from "../data/mockProjects";

type CommandBarProps = {
  isBusy: boolean;
  isGenerating: boolean;
  chatMessages: ChatMessage[];
  replyText: string;
  isReplyStreaming: boolean;
  onSubmit: (instruction: string) => void;
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
  chatMessages,
  replyText,
  isReplyStreaming,
  onSubmit,
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

  const latestMessage = visibleMessages[visibleMessages.length - 1] ?? null;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 72)}px`;
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
              className="border border-border bg-surface shadow-none"
            >
              <div className="flex items-center justify-between border-b border-border bg-bg px-3 py-2">
                <div className="flex items-center gap-2">
                  <MessageSquareIcon className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  <span className="font-mono text-xs uppercase tracking-wide text-text-primary">
                    Chat history
                  </span>
                </div>
                <span className="font-mono text-[11px] text-text-secondary">
                  {visibleMessages.length} messages
                </span>
              </div>

              <div ref={transcriptRef} className="max-h-[260px] overflow-y-auto p-2">
                <div className="flex flex-col gap-2">
                  {visibleMessages.map((message) => (
                    <div
                      key={message.id}
                      className={[
                        "border px-3 py-2",
                        message.role === "user"
                          ? "border-accent/60 bg-bg"
                          : "border-border bg-surface-raised",
                      ].join(" ")}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
                          {roleLabel(message.role)}
                        </span>
                        <span className="font-mono text-[10px] text-text-secondary">
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
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

        <div className="border border-border bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-border bg-bg px-2.5 py-1.5">
            <button
              type="button"
              onClick={() => setIsChatOpen((open) => !open)}
              disabled={visibleMessages.length === 0}
              className="inline-flex h-7 items-center gap-2 font-mono text-xs text-text-secondary transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MessageSquareIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Chat
              <span className="border border-border bg-surface px-1.5 py-0.5 text-[10px] leading-none">
                {visibleMessages.length}
              </span>
              <ChevronDownIcon
                className={`h-3 w-3 transition-transform ${isChatOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>

            <p className="min-w-0 flex-1 truncate text-right font-mono text-[11px] text-text-secondary">
              {isGenerating
                ? "generating flow - streaming screens"
                : latestMessage?.text ?? "describe your app or next edit"}
            </p>
          </div>

          <div className="flex items-end gap-2 p-2">
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
              placeholder="Describe a change... e.g. add a payment step after cart"
              className="max-h-[72px] flex-1 resize-none bg-transparent px-1 py-1 text-sm leading-relaxed text-text-primary placeholder:text-text-secondary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />

            {isBusy ? (
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center"
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
                  "flex h-7 w-7 shrink-0 items-center justify-center border transition-colors",
                  hasText
                    ? "border-accent bg-accent text-white hover:opacity-90"
                    : "cursor-not-allowed border-border bg-surface text-text-secondary",
                ].join(" ")}
              >
                <ArrowUpIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
