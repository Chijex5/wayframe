// data/mockProjects.ts
//
// Shared client-side project shapes. The mock seed data that once lived here was
// retired in Phase 4 when projects moved to the database (see lib/api/projectsActions
// and store/useProjectsStore). These type declarations stay because the canvas
// engine, thumbnail, and command bar reference them as the app's project/message
// shape — independent of where the data now comes from.

import type { ScreenNodeType } from "../types/flow";
import type { Edge } from "@xyflow/react";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  createdAt: string;
};

/** A project as the UI consumes it (mirrors lib/api ProjectSummary). */
export type MockProject = {
  id: string;
  name: string;
  updatedAt: string;
  nodes: ScreenNodeType[];
  edges: Edge[];
  chatMessages: ChatMessage[];
};
