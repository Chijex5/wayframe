"use client";

import React, { useRef, useState } from 'react';
import type { Edge } from '@xyflow/react';
import { ChevronDownIcon, DownloadIcon, FileJsonIcon, HistoryIcon, ImageIcon, ShieldCheckIcon } from 'lucide-react';
import { toPng } from 'html-to-image';
import { AppHeader } from './AppHeader';
import { VersionHistoryPanel } from './VersionHistoryPanel';
import { SuggestionsPanel } from './SuggestionsPanel';
import { FlowCanvas } from './canvas/FlowCanvas';
import { useFlowEngine } from '../hooks/useFlowEngine';
import type { ScreenNodeType } from '../types/flow';
import type { ChatMessage } from '../data/mockProjects';
import type { ProjectSyncPatch } from '../store/useProjectsStore';

type AppShellProps = {
  projectId?: string;
  initialProjectName?: string;
  initialNodes?: ScreenNodeType[];
  initialEdges?: Edge[];
  initialChatMessages?: ChatMessage[];
  onSync?: (patch: ProjectSyncPatch) => void;
};

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "wayframe-flow";
}

function downloadTextFile(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AppShell({
  projectId,
  initialProjectName,
  initialNodes,
  initialEdges,
  initialChatMessages,
  onSync
}: AppShellProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCheckOpen, setIsCheckOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const canvasCaptureRef = useRef<HTMLDivElement>(null);
  const engine = useFlowEngine({
    initialProjectName,
    initialNodes,
    initialEdges,
    initialChatMessages,
    onSync
  });

  const handleCheckFlow = () => {
    setIsCheckOpen(true);
    setIsHistoryOpen(false);
    engine.runCompletenessCheck();
  };

  const handleExportJson = () => {
    const exportedAt = new Date().toISOString();
    downloadTextFile(
      `${slugify(engine.projectName)}.json`,
      JSON.stringify(
        {
          project: {
            id: projectId,
            name: engine.projectName,
          },
          nodes: engine.nodes,
          edges: engine.edges,
          chatMessages: engine.chatMessages,
          exportedAt,
        },
        null,
        2,
      ),
      "application/json",
    );
    setIsExportOpen(false);
  };

  const handleExportPng = async () => {
    const target = canvasCaptureRef.current;
    if (!target || isExportingPng) return;

    setIsExportingPng(true);
    try {
      const dataUrl = await toPng(target, {
        cacheBust: true,
        backgroundColor:
          getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() ||
          "#0b0f14",
        pixelRatio: 2,
      });
      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = `${slugify(engine.projectName)}.png`;
      anchor.click();
      setIsExportOpen(false);
    } finally {
      setIsExportingPng(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-bg font-ui text-text-primary">
      <AppHeader
        mode="canvas"
        projectName={engine.projectName}
        projectId={projectId}
        statusSlot={
          <div className="hidden items-center gap-2 md:flex">
            <span className="border border-border bg-surface-raised px-1.5 py-0.5 font-mono text-[11px] leading-none text-text-secondary">
              {engine.versions[0]?.label ?? 'draft'}
            </span>
            <span className="font-mono text-[11px] text-text-secondary">
              {engine.nodes.length} nodes / {engine.edges.length} edges
            </span>
          </div>
        }
        rightSlot={
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsExportOpen((open) => !open)}
                aria-expanded={isExportOpen}
                className="inline-flex h-8 items-center gap-2 border border-border bg-surface px-2.5 text-xs text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
              >
                <DownloadIcon className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden font-mono uppercase tracking-wide sm:inline">Export</span>
                <ChevronDownIcon className="hidden h-3 w-3 sm:block" aria-hidden="true" />
              </button>

              {isExportOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-44 border border-border bg-surface p-1 shadow-none">
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm text-text-primary transition-colors hover:bg-surface-raised"
                  >
                    <FileJsonIcon className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
                    JSON
                  </button>
                  <button
                    type="button"
                    onClick={handleExportPng}
                    disabled={isExportingPng}
                    className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm text-text-primary transition-colors hover:bg-surface-raised disabled:cursor-wait disabled:text-text-secondary"
                  >
                    <ImageIcon className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
                    {isExportingPng ? "Exporting..." : "PNG"}
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCheckFlow}
              disabled={!engine.hasFlow || engine.isGenerating || engine.isChecking}
              aria-label="Check my flow against known patterns"
              className={[
                'inline-flex h-8 items-center gap-2 border px-2.5 text-xs transition-colors',
                engine.hasFlow && !engine.isGenerating && !engine.isChecking
                  ? 'border-accent bg-accent text-white hover:opacity-90'
                  : 'cursor-not-allowed border-border bg-surface text-text-secondary opacity-60'
              ].join(' ')}
            >
              <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden font-mono font-medium sm:inline">
                {engine.isChecking ? 'Analyzing' : 'Flow check'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsHistoryOpen((open) => !open);
                setIsCheckOpen(false);
              }}
              aria-expanded={isHistoryOpen}
              aria-label="Toggle version history"
              className={[
                'inline-flex h-8 items-center gap-2 border px-2.5 text-xs transition-colors',
                isHistoryOpen
                  ? 'border-accent bg-surface-raised text-accent'
                  : 'border-border bg-surface text-text-secondary hover:bg-surface-raised hover:text-text-primary'
              ].join(' ')}
            >
              <HistoryIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden font-mono uppercase tracking-wide sm:inline">History</span>
            </button>
          </div>
        } />
      
      <main className="relative min-h-0 w-full flex-1 overflow-hidden">
        <FlowCanvas engine={engine} captureRef={canvasCaptureRef} />
        <VersionHistoryPanel
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          versions={engine.versions} />
        
        <SuggestionsPanel
          isOpen={isCheckOpen}
          isChecking={engine.isChecking}
          suggestions={engine.suggestions}
          onClose={() => setIsCheckOpen(false)}
          onApprove={engine.approveSuggestion}
          onReject={engine.rejectSuggestion} />
        
      </main>
    </div>);

}
