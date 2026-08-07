// app/app/c/[id]/page.tsx
"use client";

import "@xyflow/react/dist/style.css";
import React, { useCallback, useEffect, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { useProjectsStore, type ProjectSyncPatch } from "@/store/useProjectsStore";
import { listVersions } from "@/lib/api/projectsActions";
import type { FlowVersion } from "@/types/flow";

export default function CanvasProjectPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const status = useProjectsStore((s) => s.status);
  const error = useProjectsStore((s) => s.error);
  const hydrate = useProjectsStore((s) => s.hydrate);
  const project = useProjectsStore((s) => s.getProject(id));
  const updateProject = useProjectsStore((s) => s.updateProject);

  // Version history is loaded per-project (not held in the projects cache) and
  // seeds the engine once. `null` = still loading, `[]` = loaded-but-empty.
  const [initialVersions, setInitialVersions] = useState<FlowVersion[] | null>(
    null,
  );

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    let active = true;
    void listVersions(id).then((result) => {
      if (!active) return;
      setInitialVersions(result.ok ? result.data : []);
    });
    return () => {
      active = false;
    };
  }, [id]);

  // AppShell calls this whenever the name/nodes/edges/chat change — after the
  // first generation and after every applied edit. Fire-and-forget: the store
  // applies the patch optimistically and writes through in the background.
  const handleSync = useCallback(
    (patch: ProjectSyncPatch) => {
      void updateProject(id, patch);
    },
    [id, updateProject],
  );

  // Wait for both the projects cache and the version list before rendering the
  // canvas, so the engine seeds from complete initial state exactly once.
  if (status === "idle" || status === "loading" || initialVersions === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center text-text-secondary">
        Loading project…
      </div>
    );
  }

  // A failed hydrate is distinct from a missing project — don't show "not found".
  if (status === "error") {
    return (
      <div className="flex h-screen w-full items-center justify-center text-text-secondary">
        {error ?? "We couldn't load this project. Try again."}
      </div>
    );
  }

  // Only a settled cache can distinguish "missing" from "not yet loaded".
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
        initialVersions={initialVersions}
        onSync={handleSync}
      />
    </ReactFlowProvider>
  );
}
