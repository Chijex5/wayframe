"use client";

import "@xyflow/react/dist/style.css";
import React from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getMockProject, mockProjects } from "@/data/mockProjects";

export default function CanvasProjectPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const isNewProject = id.startsWith("new-");
  const project = isNewProject ? null : getMockProject(id) ?? mockProjects[0];

  return (
    <ReactFlowProvider>
      <AppShell
        initialProjectName={project?.name}
        initialNodes={project?.nodes}
        initialEdges={project?.edges}
      />
    </ReactFlowProvider>
  );
}
