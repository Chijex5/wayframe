"use client";

import React, { useRef, useState } from 'react';
import type { Edge } from '@xyflow/react';
import {
  DownloadIcon,
  FileJsonIcon,
  HistoryIcon,
  ImageIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { AppHeader } from './AppHeader';
import { Flyout } from './Flyout';
import { VersionHistoryPanel } from './VersionHistoryPanel'; // pure list/content, no outer panel chrome
import { SuggestionsPanel } from './SuggestionsPanel';         // same idea
import { FlowCanvas } from './canvas/FlowCanvas';
import { useFlowEngine } from '../hooks/useFlowEngine';
import type { ScreenNodeType, FlowVersion } from '../types/flow';
import type { ChatMessage } from '../data/mockProjects';
import type { ProjectSyncPatch } from '../store/useProjectsStore';

type AppShellProps = {
  projectId?: string;
  initialProjectName?: string;
  initialNodes?: ScreenNodeType[];
  initialEdges?: Edge[];
  initialChatMessages?: ChatMessage[];
  initialVersions?: FlowVersion[];
  onSync?: (patch: ProjectSyncPatch) => void;
};

function slugify(value: string) {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
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
  initialVersions,
  onSync,
}: AppShellProps) {
  const [openFlyout, setOpenFlyout] = useState<"history" | "check" | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const canvasCaptureRef = useRef<HTMLDivElement>(null);
  const historyTriggerRef = useRef<HTMLButtonElement>(null);
  const checkTriggerRef = useRef<HTMLButtonElement>(null);

  const engine = useFlowEngine({
    projectId,
    initialProjectName,
    initialNodes,
    initialEdges,
    initialChatMessages,
    initialVersions,
    onSync,
  });

  const handleCheckFlow = () => {
    setOpenFlyout("check");
    engine.runCompletenessCheck();
  };

  const handleExportJson = () => {
    downloadTextFile(
      `${slugify(engine.projectName)}.json`,
      JSON.stringify(
        {
          project: { id: projectId, name: engine.projectName },
          nodes: engine.nodes,
          edges: engine.edges,
          chatMessages: engine.chatMessages,
          exportedAt: new Date().toISOString(),
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
          getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#0b0f14",
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

  // Shared action buttons — rendered inline on lg+, and again as full-width
  // rows inside the header's overflow menu below that breakpoint.
  const iconButtonClass =
    "flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary";
  const menuRowClass =
    "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-text-primary transition-colors hover:bg-surface-raised";

  const actionsSlot = (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsExportOpen((v) => !v)}
          aria-label="Export"
          className={iconButtonClass}
        >
          <DownloadIcon className="h-4 w-4" />
        </button>
        {isExportOpen && (
          <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-44 rounded-xl border border-border/60 bg-surface p-1 shadow-2xl">
            <button type="button" onClick={handleExportJson} className={menuRowClass}>
              <FileJsonIcon className="h-3.5 w-3.5 text-text-secondary" /> JSON
            </button>
            <button type="button" onClick={handleExportPng} disabled={isExportingPng} className={menuRowClass}>
              <ImageIcon className="h-3.5 w-3.5 text-text-secondary" />
              {isExportingPng ? "Exporting…" : "PNG"}
            </button>
          </div>
        )}
      </div>

      <button
        ref={checkTriggerRef}
        type="button"
        onClick={handleCheckFlow}
        disabled={!engine.hasFlow || engine.isGenerating || engine.isChecking}
        aria-label="Check flow against known patterns"
        className={[
          iconButtonClass,
          engine.hasFlow && !engine.isGenerating && !engine.isChecking ? "" : "cursor-not-allowed opacity-40",
        ].join(" ")}
      >
        <ShieldCheckIcon className="h-4 w-4" />
      </button>

      <button
        ref={historyTriggerRef}
        type="button"
        onClick={() => setOpenFlyout((v) => (v === "history" ? null : "history"))}
        aria-label="Version history"
        className={iconButtonClass}
      >
        <HistoryIcon className="h-4 w-4" />
      </button>
    </>
  );

  const overflowSlot = (
    <>
      <button type="button" onClick={handleExportJson} className={menuRowClass}>
        <FileJsonIcon className="h-3.5 w-3.5 text-text-secondary" /> Export JSON
      </button>
      <button type="button" onClick={handleExportPng} className={menuRowClass}>
        <ImageIcon className="h-3.5 w-3.5 text-text-secondary" /> Export PNG
      </button>
      <button type="button" onClick={handleCheckFlow} className={menuRowClass}>
        <ShieldCheckIcon className="h-3.5 w-3.5 text-text-secondary" /> Flow check
      </button>
      <button type="button" onClick={() => setOpenFlyout("history")} className={menuRowClass}>
        <HistoryIcon className="h-3.5 w-3.5 text-text-secondary" /> Version history
      </button>
    </>
  );

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-bg font-ui text-text-primary">
      <AppHeader
        mode="canvas"
        projectName={engine.projectName}
        projectId={projectId}
        statusSlot={
          <span>
            {engine.versions[0]?.label ?? "draft"} · {engine.nodes.length}n / {engine.edges.length}e
          </span>
        }
        actionsSlot={actionsSlot}
        overflowSlot={overflowSlot}
      />

      <main className="relative min-h-0 w-full flex-1 overflow-hidden">
        <FlowCanvas engine={engine} captureRef={canvasCaptureRef} />
      </main>

      <Flyout
        isOpen={openFlyout === "history"}
        onClose={() => setOpenFlyout(null)}
        anchorRef={historyTriggerRef}
        eyebrow="Version log"
        title="History"
      >
        <VersionHistoryPanel versions={engine.versions} onRestore={engine.restoreVersion} />
      </Flyout>

      <Flyout
        isOpen={openFlyout === "check"}
        onClose={() => setOpenFlyout(null)}
        anchorRef={checkTriggerRef}
        eyebrow="Pattern check"
        title="Flow check"
      >
        <SuggestionsPanel
          isChecking={engine.isChecking}
          error={engine.error}
          suggestions={engine.suggestions}
          onApprove={engine.approveSuggestion}
          onReject={engine.rejectSuggestion}
          onRetry={engine.runCompletenessCheck}
        />
      </Flyout>
    </div>
  );
}