// components/AppHeader.tsx
"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "../hooks/useTheme";
import { useClickOutside } from "../hooks/useClickOutside";
import { useSession } from "../hooks/useSession";
import { initialsFromName } from "../lib/auth/initials";
import { useProjectsStore } from "../store/useProjectsStore";
import { ProjectThumb } from "./ProjectThumb";

type AppHeaderProps =
  | { mode: "dashboard" }
  | {
      mode: "canvas";
      projectName: string;
      projectId?: string;
      statusSlot?: React.ReactNode;
      rightSlot?: React.ReactNode;
    };

export function AppHeader(props: AppHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const { session, status, signOut } = useSession();
  const projects = useProjectsStore((s) => s.projects);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const projectMenuRef = useRef<HTMLDivElement>(null);
  const recentProjects = [...projects]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, 6);

  const displayName = session?.user.name ?? "";
  const displayEmail = session?.user.email ?? "";
  const initials = displayName ? initialsFromName(displayName) : "";

  const handleSignOut = async () => {
    setIsProfileOpen(false);
    await signOut();
    router.push("/signin");
  };

  useClickOutside(menuRef as React.RefObject<HTMLElement>, () => setIsProfileOpen(false));
  useClickOutside(projectMenuRef as React.RefObject<HTMLElement>, () => setIsProjectOpen(false));

  return (
    <header className="z-30 flex min-h-14 w-full shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <span aria-hidden="true" className="h-4 w-[3px] bg-accent" />
        {props.mode === "dashboard" ? (
          <h1 className="font-mono text-[15px] font-semibold leading-none tracking-tight text-text-primary">
            Wayframe
          </h1>
        ) : (
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex min-w-0 items-center gap-2 font-mono text-sm leading-none">
              <Link
                href="/app"
                className="shrink-0 text-text-secondary transition-colors hover:text-text-primary"
              >
                Wayframe
              </Link>
              <span className="shrink-0 text-border">/</span>
              <div className="relative min-w-0" ref={projectMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsProjectOpen((open) => !open)}
                  aria-expanded={isProjectOpen}
                  className="flex min-w-0 max-w-[220px] items-center gap-1.5 text-left font-semibold text-text-primary transition-colors hover:text-accent"
                >
                  <span className="truncate">{props.projectName}</span>
                  <ChevronDownIcon
                    className={`h-3 w-3 shrink-0 text-text-secondary transition-transform ${
                      isProjectOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {isProjectOpen && (
                  <div className="absolute left-0 top-[calc(100%+10px)] z-40 w-[320px] max-w-[calc(100vw-24px)] border border-border bg-surface p-1 shadow-none">
                    <div className="border-b border-border px-2.5 py-2">
                      <p className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
                        recent projects
                      </p>
                    </div>
                    {recentProjects.length === 0 ? (
                      <p className="px-2.5 py-3 font-mono text-xs text-text-secondary">
                        No recent projects
                      </p>
                    ) : (
                      <div className="max-h-[320px] overflow-y-auto">
                        {recentProjects.map((project) => {
                          const isCurrent = project.id === props.projectId;
                          return (
                            <Link
                              key={project.id}
                              href={`/app/c/${project.id}`}
                              onClick={() => setIsProjectOpen(false)}
                              className={[
                                "grid grid-cols-[72px_1fr] gap-2 border-b border-border px-2 py-2 transition-colors last:border-b-0 hover:bg-surface-raised",
                                isCurrent ? "bg-surface-raised" : "",
                              ].join(" ")}
                            >
                              <div className="h-10 overflow-hidden border border-border bg-bg">
                                <ProjectThumb project={project} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="truncate text-sm font-semibold text-text-primary">
                                    {project.name}
                                  </span>
                                  {isCurrent && (
                                    <span className="shrink-0 border border-border bg-bg px-1.5 py-0.5 font-mono text-[9px] uppercase text-text-secondary">
                                      current
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 font-mono text-[10px] text-text-secondary">
                                  {project.nodes.length} nodes / {project.edges.length} edges
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-text-secondary">
              {props.projectId && (
                <span className="hidden sm:inline">id:{props.projectId.slice(0, 8)}</span>
              )}
              {props.statusSlot}
            </div>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {props.mode === "canvas" && (
          <>
            {props.rightSlot}
            <span aria-hidden="true" className="hidden h-5 w-px bg-border sm:block" />
          </>
        )}

        <ThemeToggle theme={theme} onToggle={toggleTheme} />
        <span aria-hidden="true" className="h-5 w-px bg-border" />

        {status === "loading" ? (
          <span
            aria-hidden="true"
            className="h-8 w-14 animate-pulse border border-border bg-surface-raised"
          />
        ) : status === "unauthenticated" ? (
          <Link
            href="/signin"
            className="inline-flex h-8 items-center gap-2 border border-accent bg-accent px-2.5 font-mono text-xs font-medium text-white transition-opacity hover:opacity-90"
          >
            <UserIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Sign in
          </Link>
        ) : (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="Open profile menu"
              aria-expanded={isProfileOpen}
              onClick={() => setIsProfileOpen((open) => !open)}
              className="group flex h-8 items-center gap-1.5 border border-border bg-bg px-1.5 transition-colors hover:bg-surface-raised"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent font-mono text-[11px] font-semibold text-white ring-2 ring-transparent transition-all group-hover:ring-accent/30">
                {initials}
              </span>
              <ChevronDownIcon
                className={`h-3.5 w-3.5 text-text-secondary transition-transform ${
                  isProfileOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-60 overflow-hidden border border-border bg-surface shadow-none">
                <div className="border-b border-border bg-bg px-3 py-2">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
                    profile
                  </p>
                </div>
                <div className="flex items-center gap-2.5 border-b border-border px-3 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent font-mono text-xs font-semibold text-white">
                    {initials}
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-semibold text-text-primary">
                      {displayName}
                    </span>
                    <span className="truncate font-mono text-[11px] text-text-secondary">
                      {displayEmail}
                    </span>
                  </div>
                </div>

                <div className="p-1">
                  <Link
                    href="/app/settings/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm text-text-primary transition-colors hover:bg-surface-raised"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
                    Profile
                  </Link>
                  <Link
                    href="/app/settings/account"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm text-text-primary transition-colors hover:bg-surface-raised"
                  >
                    <SettingsIcon className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
                    Settings
                  </Link>
                </div>

                <div className="border-t border-border p-1">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm text-danger transition-colors hover:bg-surface-raised"
                  >
                    <LogOutIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
