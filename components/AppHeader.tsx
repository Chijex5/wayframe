"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  LogOutIcon,
  MoreHorizontalIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";
import Image from "next/image";
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
      actionsSlot?: React.ReactNode;
      overflowSlot?: React.ReactNode;
    };

export function AppHeader(props: AppHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const { session, status, signOut } = useSession();
  const projects = useProjectsStore((s) => s.projects);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const projectMenuRef = useRef<HTMLDivElement>(null);
  const overflowRef = useRef<HTMLDivElement>(null);
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
  useClickOutside(overflowRef as React.RefObject<HTMLElement>, () => setIsOverflowOpen(false));

  return (
    <header className="z-30 flex h-14 w-full shrink-0 items-center justify-between gap-3 border-b border-border/50 bg-surface/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <Link href="/app" className="flex shrink-0 items-center gap-2">
          <Image
            src="/icon1.png"
            alt="Wayframe logo"
            width={24}
            height={24}
            className="h-6 w-6"
          />
          {props.mode === "dashboard" && (
            <span className="text-sm font-semibold tracking-tight text-text-primary">
              Wayframe
            </span>
          )}
        </Link>

        {props.mode === "canvas" && (
          <div className="flex min-w-0 items-center gap-1.5 text-sm leading-none">
            <span className="text-border">/</span>
            <div className="relative min-w-0" ref={projectMenuRef}>
              <button
                type="button"
                onClick={() => setIsProjectOpen((open) => !open)}
                aria-expanded={isProjectOpen}
                className="flex min-w-0 max-w-[160px] items-center gap-1 rounded-md py-1 text-left font-medium text-text-primary transition-colors hover:text-accent sm:max-w-[220px]"
              >
                <span className="truncate">{props.projectName}</span>
                <ChevronDownIcon
                  className={`h-3 w-3 shrink-0 text-text-secondary transition-transform ${
                    isProjectOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isProjectOpen && (
                <div className="absolute left-0 top-[calc(100%+8px)] z-40 w-[300px] max-w-[calc(100vw-24px)] rounded-xl border border-border/60 bg-surface p-1.5 shadow-2xl">
                  <p className="px-2 pb-1.5 pt-1 text-xs font-medium text-text-secondary">
                    Recent
                  </p>
                  {recentProjects.length === 0 ? (
                    <p className="px-2 py-2.5 text-xs text-text-secondary">No other projects yet</p>
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
                              "grid grid-cols-[52px_1fr] gap-2 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-surface-raised",
                              isCurrent ? "bg-surface-raised" : "",
                            ].join(" ")}
                          >
                            <div className="h-8 overflow-hidden rounded-md bg-bg">
                              <ProjectThumb project={project} />
                            </div>
                            <div className="min-w-0 self-center">
                              <span className="block truncate text-sm text-text-primary">
                                {project.name}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            {props.statusSlot && (
              <span className="ml-1 hidden items-center text-xs text-text-secondary md:flex">
                {props.statusSlot}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {props.mode === "canvas" && (
          <>
            <div className="hidden items-center gap-1 lg:flex">{props.actionsSlot}</div>
            <div className="relative lg:hidden" ref={overflowRef}>
              <button
                type="button"
                onClick={() => setIsOverflowOpen((v) => !v)}
                aria-label="More actions"
                aria-expanded={isOverflowOpen}
                className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
              >
                <MoreHorizontalIcon className="h-4.5 w-4.5" />
              </button>
              {isOverflowOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-56 rounded-xl border border-border/60 bg-surface p-1 shadow-2xl">
                  {props.overflowSlot}
                </div>
              )}
            </div>
          </>
        )}

        <ThemeToggle theme={theme} onToggle={toggleTheme} />

        {status === "loading" ? (
          <span className="h-8 w-8 animate-pulse rounded-full bg-surface-raised" />
        ) : status === "unauthenticated" ? (
          <Link
            href="/signin"
            className="inline-flex h-8 items-center gap-2 rounded-full bg-accent px-3 text-xs font-medium text-white transition-opacity hover:opacity-90"
          >
            <UserIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign in</span>
          </Link>
        ) : (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="Open profile menu"
              aria-expanded={isProfileOpen}
              onClick={() => setIsProfileOpen((open) => !open)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white ring-2 ring-transparent transition-all hover:ring-accent/30"
            >
              {initials}
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-60 overflow-hidden rounded-xl border border-border/60 bg-surface shadow-2xl">
                <div className="flex items-center gap-2.5 border-b border-border/60 px-3 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
                    {initials}
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-text-primary">
                      {displayName}
                    </span>
                    <span className="truncate text-[11px] text-text-secondary">
                      {displayEmail}
                    </span>
                  </div>
                </div>
                <div className="p-1">
                  <Link
                    href="/app/settings/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-text-primary transition-colors hover:bg-surface-raised"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-text-secondary" />
                    Profile
                  </Link>
                  <Link
                    href="/app/settings/account"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-text-primary transition-colors hover:bg-surface-raised"
                  >
                    <SettingsIcon className="h-3.5 w-3.5 text-text-secondary" />
                    Settings
                  </Link>
                </div>
                <div className="border-t border-border/60 p-1">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-danger transition-colors hover:bg-surface-raised"
                  >
                    <LogOutIcon className="h-3.5 w-3.5" />
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