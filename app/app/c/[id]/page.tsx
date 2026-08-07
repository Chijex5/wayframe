// app/app/c/[id]/page.tsx
"use client";

import "@xyflow/react/dist/style.css";
import React, { useCallback } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { useProjectsStore, type ProjectSyncPatch } from "@/store/useProjectsStore";

export default function CanvasProjectPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const project = useProjectsStore((s) => s.getProject(id));
  const updateProject = useProjectsStore((s) => s.updateProject);

  // AppShell should call this whenever the name/nodes/edges change —
  // e.g. after the first generation completes, and after every applied edit.
  const handleSync = useCallback(
    (patch: ProjectSyncPatch) => {
      updateProject(id, patch);
    },
    [id, updateProject]
  );

  if (!project) {
    return (
      <div className="flex h-screen w-full items-center justify-center text-text-secondary">
        Project not found.
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <AppShell
        projectId={id}
        initialProjectName={project.name}
        initialNodes={project.nodes}
        initialEdges={project.edges}
        initialChatMessages={project.chatMessages}
        onSync={handleSync}
      />
    </ReactFlowProvider>
  );
}
