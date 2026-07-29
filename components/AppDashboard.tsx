"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "../hooks/useTheme";
import { mockProjects, type MockProject } from "../data/mockProjects";

function ProjectThumb({ project }: { project: MockProject }) {
  const geometry = useMemo(() => {
    const nodes = project.nodes.slice(0, 6);
    const minX = Math.min(...nodes.map((node) => node.position.x));
    const minY = Math.min(...nodes.map((node) => node.position.y));
    const maxX = Math.max(...nodes.map((node) => node.position.x));
    const maxY = Math.max(...nodes.map((node) => node.position.y));
    const width = Math.max(maxX - minX, 1);
    const height = Math.max(maxY - minY, 1);
    const scaledNodes = nodes.map((node) => ({
      id: node.id,
      x: 28 + ((node.position.x - minX) / width) * 228,
      y: 28 + ((node.position.y - minY) / height) * 82,
    }));

    return { nodes: scaledNodes, edges: project.edges };
  }, [project]);

  const nodeMap = new Map(geometry.nodes.map((node) => [node.id, node]));

  return (
    <svg
      viewBox="0 0 320 148"
      aria-hidden="true"
      className="h-full w-full"
      shapeRendering="crispEdges"
    >
      <rect width="320" height="148" fill="var(--bg)" />
      <g stroke="var(--border)" strokeWidth="1" opacity="0.55">
        {Array.from({ length: 9 }).map((_, index) => (
          <line key={`v-${index}`} x1={index * 40} x2={index * 40} y1="0" y2="148" />
        ))}
        {Array.from({ length: 6 }).map((_, index) => (
          <line key={`h-${index}`} x1="0" x2="320" y1={index * 30} y2={index * 30} />
        ))}
      </g>
      <g fill="none" stroke="var(--border)" strokeWidth="1.25">
        {geometry.edges.map((edge) => {
          const source = nodeMap.get(edge.source);
          const target = nodeMap.get(edge.target);
          if (!source || !target) return null;

          return (
            <path
              key={edge.id}
              d={`M${source.x + 56} ${source.y + 12}H${target.x - 8}V${target.y + 12}H${target.x}`}
            />
          );
        })}
      </g>
      <g>
        {geometry.nodes.map((node, index) => (
          <g key={node.id}>
            <rect
              x={node.x}
              y={node.y}
              width="72"
              height="24"
              fill="var(--surface)"
              stroke={index === 1 ? "var(--accent)" : "var(--border)"}
            />
            <rect
              x={node.x + 7}
              y={node.y + 9}
              width="5"
              height="5"
              fill={index === 1 ? "var(--accent)" : "var(--text-secondary)"}
            />
            <line
              x1={node.x + 18}
              x2={node.x + 58}
              y1={node.y + 12}
              y2={node.y + 12}
              stroke="var(--border)"
            />
          </g>
        ))}
      </g>
    </svg>
  );
}

export function AppDashboard() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const projectIdRef = useRef(0);

  const createProject = () => {
    projectIdRef.current += 1;
    router.push(`/app/c/new-${Date.now()}-${projectIdRef.current}`);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-bg font-ui text-text-primary">
      <header className="z-30 flex h-12 w-full shrink-0 items-center justify-between border-b border-border bg-surface px-3">
        <div className="flex items-center gap-2.5">
          <span aria-hidden="true" className="h-3.5 w-[3px] bg-accent" />
          <h1 className="font-mono text-lg font-semibold leading-none tracking-tight text-text-primary">
            Wayframe
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <div className="relative">
            <button
              type="button"
              aria-label="Open profile menu"
              aria-expanded={isProfileOpen}
              onClick={() => setIsProfileOpen((open) => !open)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-accent font-mono text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              CW
            </button>

            {isProfileOpen && (
              <div
                className="absolute right-0 top-[calc(100%+8px)] w-36 border border-border bg-surface p-1"
                style={{ borderRadius: "2px" }}
              >
                <button
                  type="button"
                  className="block w-full px-2.5 py-2 text-left text-sm text-text-primary transition-colors hover:bg-surface-raised"
                >
                  Profile
                </button>
                <button
                  type="button"
                  className="block w-full px-2.5 py-2 text-left text-sm text-text-primary transition-colors hover:bg-surface-raised"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={createProject}
          className="inline-flex h-9 w-fit items-center gap-2 border border-accent bg-accent px-3 font-mono text-xs font-medium text-white transition-opacity hover:opacity-90"
          style={{ borderRadius: "2px" }}
        >
          <PlusIcon className="h-3.5 w-3.5" aria-hidden="true" />
          New Project
        </button>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {mockProjects.map((project) => (
            <Link
              key={project.id}
              href={`/app/c/${project.id}`}
              className="group flex min-h-[232px] flex-col overflow-hidden border border-border bg-surface transition-colors hover:bg-surface-raised"
              style={{ borderRadius: "2px" }}
            >
              <div className="h-[148px] border-b border-border bg-bg">
                <ProjectThumb project={project} />
              </div>
              <div className="flex flex-1 flex-col justify-between gap-3 p-3">
                <div>
                  <h2 className="truncate text-sm font-bold leading-tight text-text-primary">
                    {project.name}
                  </h2>
                  <p className="mt-1 font-mono text-xs leading-tight text-text-secondary">
                    edited {project.updatedAt}
                  </p>
                </div>
                <span className="font-mono text-xs uppercase tracking-wide text-text-secondary transition-colors group-hover:text-accent">
                  Open
                </span>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
