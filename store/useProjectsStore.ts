// store/useProjectsStore.ts
import { create } from "zustand";
import { makeProject, seedProjects } from "@/lib/api/projectsRepository";
import type { ProjectPatch, ProjectSummary } from "@/lib/api";

export type ProjectSyncPatch = ProjectPatch;

type ProjectsStore = {
  projects: ProjectSummary[];
  createProject: () => string;
  updateProject: (id: string, patch: ProjectSyncPatch) => void;
  getProject: (id: string) => ProjectSummary | undefined;
};

export const useProjectsStore = create<ProjectsStore>((set, get) => ({
  projects: seedProjects(),

  createProject: () => {
    const project = makeProject();
    set((state) => ({ projects: [project, ...state.projects] }));
    return project.id;
  },

  updateProject: (id, patch) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id
          ? { ...p, ...patch, updatedAt: new Date().toISOString() }
          : p
      ),
    })),

  getProject: (id) => get().projects.find((p) => p.id === id),
}));
