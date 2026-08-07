import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckIcon,
  MessageSquareIcon,
  PencilIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  XIcon,
} from "lucide-react";
import type { FlowVersion } from "../types/flow";

type VersionHistoryPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  versions: FlowVersion[];
  onRestore: (id: string) => boolean;
};

const sourceIcon = {
  chat: MessageSquareIcon,
  manual: PencilIcon,
  suggestion: ShieldCheckIcon,
  restore: RotateCcwIcon,
};

// Versions carry an ISO timestamp (optimistic + reloaded rows share the format);
// show wall-clock HH:MM. Falls back to the raw value if it isn't parseable.
function formatVersionTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function VersionHistoryPanel({
  isOpen,
  onClose,
  versions,
  onRestore,
}: VersionHistoryPanelProps) {
  const latestId = versions[0]?.id ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const selected = versions.find((version) => version.id === selectedId) ?? null;

  const selectVersion = (id: string) => {
    setSelectedId(id);
    setConfirmId(null);
    setStatus(null);
  };

  const confirmRestore = () => {
    if (!confirmId) return;
    const version = versions.find((item) => item.id === confirmId);
    const restored = onRestore(confirmId);
    setConfirmId(null);
    setSelectedId(null);
    setStatus(
      restored
        ? `${version?.label ?? "Version"} restored as a new version.`
        : "This version is still preparing its snapshot.",
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          aria-label="Version history"
          initial={{ x: 320 }}
          animate={{ x: 0 }}
          exit={{ x: 320 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="absolute inset-y-0 right-0 z-20 flex w-full max-w-[320px] flex-col border-l border-border bg-surface shadow-none"
        >
          <div className="border-b border-border bg-bg px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
                  version log
                </p>
                <h2 className="mt-1 font-mono text-sm font-semibold text-text-primary">
                  History
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close version history"
                className="flex h-7 w-7 items-center justify-center border border-border text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
              >
                <XIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[11px] text-text-secondary">
              <div className="border border-border bg-surface px-2 py-1.5">
                {versions.length} entries
              </div>
              <div className="border border-border bg-surface px-2 py-1.5">
                {versions[0]?.label ?? "draft"}
              </div>
            </div>
          </div>

          {status && (
            <div
              role="status"
              className="flex items-start gap-2 border-b border-border bg-surface-raised px-3 py-2.5 text-xs leading-relaxed text-text-secondary"
            >
              <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
              {status}
            </div>
          )}

          {versions.length === 0 ? (
            <p className="p-3 font-mono text-xs leading-relaxed text-text-secondary">
              No versions yet. Generate a flow to start the log.
            </p>
          ) : (
            <ul className="min-h-0 flex-1 overflow-y-auto p-2">
              {versions.map((version) => {
                const isCurrent = version.id === latestId;
                const isSelected = version.id === selectedId;
                const Icon = sourceIcon[version.source];

                return (
                  <li key={version.id}>
                    <button
                      type="button"
                      onClick={() => selectVersion(version.id)}
                      aria-pressed={isSelected}
                      className={[
                        "mb-2 flex w-full flex-col items-start gap-2 border p-3 text-left transition-colors",
                        isSelected
                          ? "border-accent bg-surface-raised"
                          : "border-border bg-bg hover:bg-surface-raised",
                      ].join(" ")}
                    >
                      <span className="flex w-full items-center gap-2">
                        <Icon
                          className={[
                            "h-3.5 w-3.5",
                            version.source === "suggestion" || version.source === "restore"
                              ? "text-accent"
                              : "text-text-secondary",
                          ].join(" ")}
                          aria-hidden="true"
                        />
                        <span
                          className={[
                            "font-mono text-xs",
                            isSelected ? "text-accent" : "text-text-primary",
                          ].join(" ")}
                        >
                          {version.label}
                        </span>
                        <span className="ml-auto font-mono text-[11px] text-text-secondary">
                          {formatVersionTime(version.timestamp)}
                        </span>
                      </span>
                      <span className="text-sm leading-snug text-text-secondary">
                        {version.summary}
                      </span>
                      <span className="flex min-h-5 items-center gap-1.5">
                        {isCurrent && (
                          <span className="border border-border bg-bg px-1.5 py-0.5 font-mono text-[10px] uppercase text-text-secondary">
                            current
                          </span>
                        )}
                        {!version.snapshot && (
                          <span className="font-mono text-[10px] uppercase text-text-secondary">
                            preparing
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {selected && selected.id !== latestId && (
            <div className="border-t border-border bg-bg p-3">
              {confirmId === selected.id ? (
                <div>
                  <p className="text-xs leading-relaxed text-text-secondary">
                    Restore {selected.label}? Your current canvas will remain in history.
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="h-8 border border-border bg-surface font-mono text-xs text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmRestore}
                      disabled={!selected.snapshot}
                      className="inline-flex h-8 items-center justify-center gap-2 border border-accent bg-accent px-3 font-mono text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:border-border disabled:bg-surface-raised disabled:text-text-secondary"
                    >
                      <RotateCcwIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      Confirm
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmId(selected.id)}
                  disabled={!selected.snapshot}
                  className="inline-flex h-8 w-full items-center justify-center gap-2 border border-accent bg-accent px-3 font-mono text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:border-border disabled:bg-surface-raised disabled:text-text-secondary"
                >
                  <RotateCcwIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {selected.snapshot ? `Restore ${selected.label}` : "Preparing snapshot"}
                </button>
              )}
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
