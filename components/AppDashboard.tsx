// components/AppDashboard.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpDownIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import { AppHeader } from "./AppHeader";
import { ProjectThumb } from "./ProjectThumb";
import { useProjectsStore } from "@/store/useProjectsStore";
import { categoryMeta, type ScreenCategory } from "@/types/flow";

type SortKey = "recent" | "name";

function formatRelative(value: string) {
  const ms = Date.now() - new Date(value).getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(
    new Date(value),
  );
}

export function AppDashboard() {
  const router = useRouter();
  const projects = useProjectsStore((s) => s.projects);
  const status = useProjectsStore((s) => s.status);
  const hydrate = useProjectsStore((s) => s.hydrate);
  const createProject = useProjectsStore((s) => s.createProject);
  const deleteProject = useProjectsStore((s) => s.deleteProject);
  const isReady = status === "ready";

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const visibleProjects = useMemo(() => {
    const filtered = query.trim()
      ? projects.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
      : projects;
    return [...filtered].sort((a, b) =>
      sort === "recent"
        ? Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
        : a.name.localeCompare(b.name),
    );
  }, [projects, query, sort]);

  const handleCreate = async () => {
    const id = await createProject();
    if (id) router.push(`/app/c/${id}`);
  };

  const handleDelete = async (event: React.MouseEvent, id: string, name: string) => {
    event.preventDefault();
    event.stopPropagation();
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
    await deleteProject(id);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-bg">
      <AppHeader mode="dashboard" />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Projects</h1>
            {isReady && projects.length > 0 && (
              <p className="mt-1 text-sm text-text-secondary">
                {projects.length} {projects.length === 1 ? "project" : "projects"}
              </p>
            )}
          </div>

          {isReady && projects.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search projects"
                  className="h-9 w-full rounded-full border border-border/60 bg-surface pl-8 pr-3 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent/50 focus:outline-none sm:w-56"
                />
              </div>

              <button
                type="button"
                onClick={() => setSort((s) => (s === "recent" ? "name" : "recent"))}
                className="flex h-9 items-center gap-1.5 rounded-full border border-border/60 bg-surface px-3 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
              >
                <ArrowUpDownIcon className="h-3.5 w-3.5" />
                {sort === "recent" ? "Recent" : "Name"}
              </button>

              <button
                type="button"
                onClick={handleCreate}
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-accent px-3.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                New
              </button>
            </div>
          )}
        </div>

        {status === "error" ? (
          <div className="grid min-h-[300px] place-items-center rounded-2xl border border-border/60 bg-surface">
            <span className="text-sm text-text-secondary">Couldn&apos;t load your projects.</span>
          </div>
        ) : !isReady ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[240px] animate-pulse rounded-2xl bg-surface" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
              <PlusIcon className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Nothing here yet</h2>
              <p className="mt-1 max-w-sm text-sm text-text-secondary">
                Create a project and describe the app you&apos;re building — a flow map appears as you go.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCreate}
              className="flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <PlusIcon className="h-4 w-4" />
              New project
            </button>
          </div>
        ) : visibleProjects.length === 0 ? (
          <div className="grid min-h-[200px] place-items-center rounded-2xl border border-dashed border-border/60">
            <span className="text-sm text-text-secondary">No projects match &quot;{query}&quot;</span>
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {visibleProjects.map((project) => {
              const categories = Array.from(
                new Set(project.nodes.map((node) => node.data.category)),
              ) as ScreenCategory[];

              return (
                <Link
                  key={project.id}
                  href={`/app/c/${project.id}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-lg"
                >
                  <div className="h-[144px] overflow-hidden bg-bg">
                    <ProjectThumb project={project} />
                  </div>

                  <button
                    type="button"
                    onClick={(event) => handleDelete(event, project.id, project.name)}
                    aria-label={`Delete ${project.name}`}
                    className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-bg/80 text-text-secondary opacity-0 backdrop-blur transition-all hover:bg-danger/15 hover:text-danger group-hover:opacity-100"
                  >
                    <Trash2Icon className="h-3.5 w-3.5" />
                  </button>

                  <div className="flex flex-1 flex-col gap-2.5 p-3.5">
                    <div>
                      <h2 className="truncate text-sm font-semibold text-text-primary">
                        {project.name}
                      </h2>
                      <p className="mt-0.5 text-xs text-text-secondary">
                        {project.nodes.length === 0
                          ? "Draft"
                          : `${project.nodes.length} screens · edited ${formatRelative(project.updatedAt)}`}
                      </p>
                    </div>

                    {categories.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {categories.map((category) => (
                          <span
                            key={category}
                            className="inline-flex items-center gap-1 rounded-full bg-surface-raised px-2 py-0.5 text-[11px] text-text-secondary"
                          >
                            <span
                              aria-hidden="true"
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: categoryMeta[category].colorVar }}
                            />
                            {categoryMeta[category].label}
                          </span>
                        ))}
                      </div>
                    )}
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