import React from 'react';

type BlueprintGridProps = {
  /** Grid cell size in pixels. */
  size?: number;
  /** Fade the grid toward the bottom of its container. */
  fade?: boolean;
};

/**
 * Flat 1px engineering grid used as a structural backdrop.
 * No gradients on color — only an optional alpha mask for edge falloff.
 */
export function BlueprintGrid({ size = 56, fade = true }: BlueprintGridProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
        'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
        backgroundSize: `${size}px ${size}px`,
        opacity: 0.35,
        maskImage: fade ?
        'linear-gradient(to bottom, black 0%, black 55%, transparent 100%)' :
        undefined,
        WebkitMaskImage: fade ?
        'linear-gradient(to bottom, black 0%, black 55%, transparent 100%)' :
        undefined
      }} />);


}

/** Small crosshair tick used to mark structural corners. */
export function Crosshair({ className = '' }: {className?: string;}) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute h-2 w-2 ${className}`}>
      
      <span className="absolute left-1/2 top-0 h-2 w-px -translate-x-1/2 bg-border" />
      <span className="absolute left-0 top-1/2 h-px w-2 -translate-y-1/2 bg-border" />
    </span>);

}