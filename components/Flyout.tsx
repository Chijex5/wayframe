"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { XIcon } from "lucide-react";

type FlyoutProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  /** Ref of the trigger button — used to anchor the desktop popover under it. */
  anchorRef?: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/**
 * Desktop: a bounded popover anchored under the trigger button (max 420px
 * wide, max 70vh tall) — it never claims the full canvas height, so the
 * flow stays visible and scrollable behind it.
 *
 * Mobile (<640px): a bottom sheet, since a 320-420px side panel would be
 * the whole screen anyway — better to make that intentional and full-width
 * with a drag handle than to fake a "panel" that eats the viewport.
 */
export function Flyout({ isOpen, onClose, title, eyebrow, anchorRef, children, footer }: FlyoutProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef?.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [isOpen, onClose, anchorRef]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile scrim only — desktop popover doesn't block the canvas */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 sm:hidden"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-label={title}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className={[
              "fixed z-50 flex flex-col overflow-hidden bg-surface shadow-2xl",
              // Mobile: bottom sheet, full width, rounded top only
              "inset-x-0 bottom-0 max-h-[80vh] rounded-t-2xl border-t border-border/60",
              // Desktop: bounded popover under the header, right-aligned
              "sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-16 sm:max-h-[70vh] sm:w-[400px] sm:rounded-2xl sm:border sm:border-border/60",
            ].join(" ")}
          >
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border sm:hidden" />
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                {eyebrow && (
                  <p className="text-[11px] font-medium uppercase tracking-wide text-text-secondary">
                    {eyebrow}
                  </p>
                )}
                <h2 className="mt-0.5 text-sm font-semibold text-text-primary">{title}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">{children}</div>

            {footer && <div className="border-t border-border/60 p-3">{footer}</div>}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}