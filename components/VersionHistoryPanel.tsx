import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  MessageSquareIcon,
  PencilIcon,
  ShieldCheckIcon,
  XIcon } from
'lucide-react';
import type { FlowVersion } from '../types/flow';

type VersionHistoryPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  versions: FlowVersion[];
};

export function VersionHistoryPanel({
  isOpen,
  onClose,
  versions
}: VersionHistoryPanelProps) {
  const latestId = versions[0]?.id ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeId = versions.some((version) => version.id === selectedId)
    ? selectedId
    : latestId;

  return (
    <AnimatePresence>
      {isOpen &&
      <motion.aside
        aria-label="Version history"
        initial={{ x: 260 }}
        animate={{ x: 0 }}
        exit={{ x: 260 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="absolute inset-y-0 right-0 z-20 flex w-[260px] flex-col border-l border-border bg-surface">
        
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3">
            <h2 className="font-mono text-xs uppercase tracking-wide text-text-secondary">
              History
            </h2>
            <button
            type="button"
            onClick={onClose}
            aria-label="Close version history"
            className="flex h-5 w-5 items-center justify-center text-text-secondary transition-colors hover:text-text-primary">
            
              <XIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          {versions.length === 0 ?
        <p className="p-3 font-mono text-xs leading-relaxed text-text-secondary">
              No versions yet. Generate a flow to start the log.
            </p> :

        <ul className="min-h-0 flex-1 overflow-y-auto">
              {versions.map((version) => {
            const isActive = version.id === activeId;
            return (
              <li key={version.id}>
                    <button
                  type="button"
                  onClick={() => setSelectedId(version.id)}
                  aria-current={isActive ? 'true' : undefined}
                  className={[
                  'flex w-full flex-col items-start gap-1 border-b border-border px-3 py-2.5 text-left transition-colors',
                  isActive ? 'bg-surface-raised' : 'hover:bg-surface-raised'].
                  join(' ')}>
                  
                      <span className="flex w-full items-center gap-2">
                        <span
                      className={[
                      'font-mono text-xs',
                      isActive ? 'text-accent' : 'text-text-primary'].
                      join(' ')}>
                      
                          {version.label}
                        </span>
                        {version.source === 'chat' &&
                    <MessageSquareIcon
                      className="h-3 w-3 text-text-secondary"
                      aria-label="From chat" />

                    }
                        {version.source === 'manual' &&
                    <PencilIcon
                      className="h-3 w-3 text-text-secondary"
                      aria-label="Manual edit" />

                    }
                        {version.source === 'suggestion' &&
                    <ShieldCheckIcon
                      className="h-3 w-3 text-accent"
                      aria-label="From flow check" />

                    }
                        <span className="ml-auto font-mono text-xs text-text-secondary">
                          {version.timestamp}
                        </span>
                      </span>
                      <span className="text-sm leading-snug text-text-secondary">
                        {version.summary}
                      </span>
                      {version.id === latestId &&
                  <span className="font-mono text-xs text-text-secondary">
                          current
                        </span>
                  }
                    </button>
                  </li>);

          })}
            </ul>
        }
        </motion.aside>
      }
    </AnimatePresence>);

}
