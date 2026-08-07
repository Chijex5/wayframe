// store/useProjectsStore.ts
import { create } from "zustand";
import type { MockProject } from "@/data/mockProjects";
import { mockProjects } from "@/data/mockProjects";

export type ProjectSyncPatch = Partial<
  Pick<MockProject, "name" | "nodes" | "edges" | "chatMessages">
>;

type ProjectsStore = {
  projects: MockProject[];
  createProject: () => string;
  updateProject: (id: string, patch: ProjectSyncPatch) => void;
  getProject: (id: string) => MockProject | undefined;
};

export const useProjectsStore = create<ProjectsStore>((set, get) => ({
  projects: mockProjects,

  createProject: () => {
    const id = crypto.randomUUID();
    const project: MockProject = {
      id,
      name: "Untitled Project",
      nodes: [],
      edges: [],
      chatMessages: [],
      updatedAt: new Date().toISOString(),
    };
    set((s) => ({ projects: [project, ...s.projects] }));
    return id;
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
