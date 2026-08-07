import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MessageSquareIcon,
  PencilIcon,
  ShieldCheckIcon,
  XIcon,
} from "lucide-react";
import type { FlowVersion } from "../types/flow";

type VersionHistoryPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  versions: FlowVersion[];
};

const sourceIcon = {
  chat: MessageSquareIcon,
  manual: PencilIcon,
  suggestion: ShieldCheckIcon,
};

export function VersionHistoryPanel({
  isOpen,
  onClose,
  versions,
}: VersionHistoryPanelProps) {
  const latestId = versions[0]?.id ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeId = versions.some((version) => version.id === selectedId)
    ? selectedId
    : latestId;

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

          {versions.length === 0 ? (
            <p className="p-3 font-mono text-xs leading-relaxed text-text-secondary">
              No versions yet. Generate a flow to start the log.
            </p>
          ) : (
            <ul className="min-h-0 flex-1 overflow-y-auto p-2">
              {versions.map((version) => {
                const isActive = version.id === activeId;
                const Icon = sourceIcon[version.source];

                return (
                  <li key={version.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(version.id)}
                      aria-current={isActive ? "true" : undefined}
                      className={[
                        "mb-2 flex w-full flex-col items-start gap-2 border p-3 text-left transition-colors",
                        isActive
                          ? "border-accent bg-surface-raised"
                          : "border-border bg-bg hover:bg-surface-raised",
                      ].join(" ")}
                    >
                      <span className="flex w-full items-center gap-2">
                        <Icon
                          className={[
                            "h-3.5 w-3.5",
                            version.source === "suggestion"
                              ? "text-accent"
                              : "text-text-secondary",
                          ].join(" ")}
                          aria-hidden="true"
                        />
                        <span
                          className={[
                            "font-mono text-xs",
                            isActive ? "text-accent" : "text-text-primary",
                          ].join(" ")}
                        >
                          {version.label}
                        </span>
                        <span className="ml-auto font-mono text-[11px] text-text-secondary">
                          {version.timestamp}
                        </span>
                      </span>
                      <span className="text-sm leading-snug text-text-secondary">
                        {version.summary}
                      </span>
                      {version.id === latestId && (
                        <span className="border border-border bg-bg px-1.5 py-0.5 font-mono text-[10px] uppercase text-text-secondary">
                          current
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
