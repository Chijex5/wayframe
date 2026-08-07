// lib/api/projectsRepository.ts
//
// The projects persistence seam. Today it returns the in-repo seed projects and
// mints ids locally; the Zustand store (store/useProjectsStore) holds the live
// working copy in memory. In a later phase these functions become ORM-backed
// calls (users → flows → flow_versions), scoped to the authenticated user —
// changing only this file, not the store's public API or any component.

import { mockProjects } from "@/data/mockProjects";
import type { ProjectSummary } from "./types";

const UNTITLED_PROJECT = "Untitled Project";

/** Initial set of projects to hydrate the store with. */
export function seedProjects(): ProjectSummary[] {
  return mockProjects;
}

/** A fresh, empty project. Id generation moves server-side once persisted. */
export function makeProject(): ProjectSummary {
  return {
    id: crypto.randomUUID(),
    name: UNTITLED_PROJECT,
    nodes: [],
    edges: [],
    chatMessages: [],
    updatedAt: new Date().toISOString(),
  };
}
