// store/useProjectsStore.ts
"use client";

import { create } from "zustand";
import {
  createProject as createProjectAction,
  deleteProject as deleteProjectAction,
  listProjects,
  updateProject as updateProjectAction,
} from "@/lib/api/projectsActions";
import type { ProjectPatch, ProjectSummary } from "@/lib/api";

// Client seam over the Phase 4 persistence actions. This store is a per-session
// cache of the authenticated user's projects: `hydrate` loads them once, and
// create/update/delete apply optimistically then write through the server action.
// The sync `getProject` reads from the cache so canvas render stays synchronous;
// callers `hydrate` first and gate not-found on `status === "ready"`.

export type ProjectSyncPatch = ProjectPatch;

export type ProjectsStatus = "idle" | "loading" | "ready" | "error";

type ProjectsStore = {
  projects: ProjectSummary[];
  status: ProjectsStatus;
  error: string | null;
  hydrate: () => Promise<void>;
  createProject: () => Promise<string | null>;
  updateProject: (id: string, patch: ProjectSyncPatch) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProject: (id: string) => ProjectSummary | undefined;
};

export const useProjectsStore = create<ProjectsStore>((set, get) => ({
  projects: [],
  status: "idle",
  error: null,

  hydrate: async () => {
    // Re-entrant guard: canvas page and dashboard both hydrate on mount; a
    // second call while one is in flight (or after ready) is a no-op.
    if (get().status === "loading") return;
    set({ status: "loading", error: null });
    const result = await listProjects();
    if (!result.ok) {
      set({ status: "error", error: result.error });
      return;
    }
    set({ projects: result.data, status: "ready", error: null });
  },

  createProject: async () => {
    const result = await createProjectAction();
    if (!result.ok) {
      set({ error: result.error });
      return null;
    }
    // The server returns the real row; prepend it (newest-first) so the
    // dashboard and header reflect it before any re-hydrate.
    set((s) => ({ projects: [result.data, ...s.projects], error: null }));
    return result.data.id;
  },

  updateProject: async (id, patch) => {
    // Optimistic merge. onSync fires on every graph change, so updates can be
    // in flight concurrently; we deliberately do NOT reconcile the server's
    // returned row back into nodes/edges — a resolved response is already stale
    // relative to later local edits, and clobbering with it would drop keystrokes.
    // On failure we keep the optimistic state and surface the error only.
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id
          ? { ...p, ...patch, updatedAt: new Date().toISOString() }
          : p,
      ),
    }));
    const result = await updateProjectAction(id, patch);
    if (!result.ok) {
      set({ error: result.error });
      return;
    }
    set({ error: null });
  },

  deleteProject: async (id) => {
    // Snapshot the whole list so a failed delete restores exact ordering.
    const previous = get().projects;
    set({ projects: previous.filter((p) => p.id !== id), error: null });
    const result = await deleteProjectAction(id);
    if (!result.ok) {
      set({ projects: previous, error: result.error });
    }
  },

  getProject: (id) => get().projects.find((p) => p.id === id),
}));
