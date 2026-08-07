// components/AppDashboard.tsx
"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BoxesIcon, GitBranchIcon, LayersIcon, PlusIcon, SparklesIcon, Trash2Icon } from "lucide-react";
import { AppHeader } from "./AppHeader";
import { ProjectThumb } from "./ProjectThumb";
import { useProjectsStore } from "@/store/useProjectsStore";
import { categoryMeta, type ScreenCategory } from "@/types/flow";

function formatEdited(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AppDashboard() {
  const router = useRouter();
  const projects = useProjectsStore((s) => s.projects);
  const status = useProjectsStore((s) => s.status);
  const hydrate = useProjectsStore((s) => s.hydrate);
  const createProject = useProjectsStore((s) => s.createProject);
  const deleteProject = useProjectsStore((s) => s.deleteProject);
  const totalNodes = projects.reduce((sum, project) => sum + project.nodes.length, 0);
  const totalEdges = projects.reduce((sum, project) => sum + project.edges.length, 0);
  const isReady = status === "ready";

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const handleCreate = async () => {
    const id = await createProject();
    if (id) router.push(`/app/c/${id}`);
  };

  const handleDelete = async (
    event: React.MouseEvent,
    id: string,
    name: string,
  ) => {
    // The card is a Link; stop the click from navigating into the project.
    event.preventDefault();
    event.stopPropagation();
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
    await deleteProject(id);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-bg">
      <AppHeader mode="dashboard" />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden border border-border bg-surface">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-45"
            style={{
              backgroundImage:
                "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative flex flex-col gap-5 p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="font-mono text-xs uppercase tracking-wide text-accent">
                workspace / projects
              </p>
              <h1 className="mt-2 text-2xl font-bold leading-tight text-text-primary sm:text-3xl">
                App flows, drafts, and generated screen maps.
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-secondary">
                Start from a prompt, inspect the navigation graph, and keep every canvas edit reflected here.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
              {[
                { label: "projects", value: projects.length, icon: BoxesIcon },
                { label: "nodes", value: totalNodes, icon: LayersIcon },
                { label: "edges", value: totalEdges, icon: GitBranchIcon },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="border border-border bg-bg/80 p-3">
                  <Icon className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
                  <div className="mt-3 font-mono text-xl font-semibold leading-none text-text-primary">
                    {value}
                  </div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-wide text-text-secondary">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative flex items-center justify-between border-t border-border bg-bg/80 px-4 py-3 sm:px-5">
            <span className="font-mono text-xs text-text-secondary">
              {projects.length === 0 ? "ready for first flow" : "latest project sync active"}
            </span>
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex h-9 items-center gap-2 border border-accent bg-accent px-3 font-mono text-xs font-medium text-white transition-opacity hover:opacity-90"
            >
              <PlusIcon className="h-3.5 w-3.5" aria-hidden="true" />
              New Project
            </button>
          </div>
        </section>

        {!isReady ? (
          <section
            className="grid min-h-[360px] place-items-center border border-dashed border-border bg-surface"
            aria-label="Loading projects"
          >
            <span className="font-mono text-xs text-text-secondary">
              {status === "error" ? "Couldn't load projects." : "Loading projects…"}
            </span>
          </section>
        ) : projects.length === 0 ? (
          <section className="grid min-h-[360px] border border-dashed border-border bg-surface md:grid-cols-[1fr_1.2fr]">
            <div className="flex flex-col justify-between border-b border-border p-5 md:border-b-0 md:border-r">
              <div>
                <p className="font-mono text-xs uppercase tracking-wide text-text-secondary">
                  empty state
                </p>
                <h2 className="mt-3 text-xl font-semibold leading-tight text-text-primary">
                  Generate your first flow from a short product description.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  The canvas will stream screens into place, then this dashboard will show the saved thumbnail, title, and edit time.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCreate}
                className="mt-5 inline-flex h-9 w-fit items-center gap-2 border border-accent bg-accent px-3 font-mono text-xs font-medium text-white transition-opacity hover:opacity-90"
              >
                <SparklesIcon className="h-3.5 w-3.5" aria-hidden="true" />
                Start flow
              </button>
            </div>
            <div className="relative min-h-[260px] overflow-hidden bg-bg">
              <ProjectThumb
                project={{
                  id: "preview",
                  name: "Preview",
                  updatedAt: new Date().toISOString(),
                  chatMessages: [],
                  nodes: [
                    { id: "a", type: "screen", position: { x: 0, y: 40 }, data: { label: "Landing", screenId: "scr_a", category: "core" } },
                    { id: "b", type: "screen", position: { x: 260, y: 40 }, data: { label: "Sign up", screenId: "scr_b", category: "auth" } },
                    { id: "c", type: "screen", position: { x: 520, y: -20 }, data: { label: "Checkout", screenId: "scr_c", category: "commerce" } },
                    { id: "d", type: "screen", position: { x: 520, y: 110 }, data: { label: "Dashboard", screenId: "scr_d", category: "core" } },
                  ],
                  edges: [
                    { id: "e-a-b", source: "a", target: "b" },
                    { id: "e-b-c", source: "b", target: "c" },
                    { id: "e-b-d", source: "b", target: "d" },
                  ],
                }}
              />
              <div className="absolute left-4 top-4 border border-border bg-surface px-3 py-2 font-mono text-xs text-text-secondary">
                preview / generated flow
              </div>
            </div>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {projects.map((project) => {
              const categories = Array.from(
                new Set(project.nodes.map((node) => node.data.category)),
              ) as ScreenCategory[];
              const isDraft = project.nodes.length === 0;

              return (
                <Link
                  key={project.id}
                  href={`/app/c/${project.id}`}
                  className="group flex min-h-[286px] flex-col overflow-hidden border border-border bg-surface transition-colors hover:bg-surface-raised"
                >
                  <div className="h-[148px] border-b border-border bg-bg">
                    <ProjectThumb project={project} />
                  </div>
                  <div className="flex flex-1 flex-col justify-between gap-4 p-3">
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="border border-border bg-bg px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-text-secondary">
                          {isDraft ? "draft" : "v0.1"}
                        </span>
                        <span className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(event) =>
                              handleDelete(event, project.id, project.name)
                            }
                            aria-label={`Delete ${project.name}`}
                            className="inline-flex h-6 w-6 items-center justify-center border border-transparent text-text-secondary transition-colors hover:border-danger/40 hover:bg-danger/10 hover:text-danger"
                          >
                            <Trash2Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <span className="font-mono text-[10px] uppercase tracking-wide text-text-secondary transition-colors group-hover:text-accent">
                            Open
                          </span>
                        </span>
                      </div>
                      <h2 className="truncate text-sm font-bold leading-tight text-text-primary">
                        {project.name}
                      </h2>
                      <p className="mt-1 font-mono text-xs leading-tight text-text-secondary">
                        edited {formatEdited(project.updatedAt)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-text-secondary">
                      <div className="border border-border bg-bg px-2 py-1.5">
                        <span className="text-text-primary">{project.nodes.length}</span> nodes
                      </div>
                      <div className="border border-border bg-bg px-2 py-1.5">
                        <span className="text-text-primary">{project.edges.length}</span> edges
                      </div>
                    </div>

                    <div className="flex min-h-4 items-center gap-1.5">
                      {categories.length === 0 ? (
                        <span className="font-mono text-[11px] text-text-secondary">
                          no categories yet
                        </span>
                      ) : (
                        categories.map((category) => (
                          <span
                            key={category}
                            className="inline-flex items-center gap-1 border border-border bg-bg px-1.5 py-0.5 font-mono text-[10px] uppercase text-text-secondary"
                          >
                            <span
                              aria-hidden="true"
                              className="h-1.5 w-1.5"
                              style={{ backgroundColor: categoryMeta[category].colorVar }}
                            />
                            {categoryMeta[category].label}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
