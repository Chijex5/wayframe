import React from 'react';

export function EmptyCanvasState() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[5] flex flex-col items-center justify-center px-6 pb-24">
      <svg
        width="88"
        height="56"
        viewBox="0 0 88 56"
        aria-hidden="true"
        className="mb-5">
        
        <g
          fill="none"
          stroke="var(--border)"
          strokeWidth="1"
          shapeRendering="crispEdges">
          
          <rect x="0.5" y="20.5" width="26" height="15" />
          <rect x="30.5" y="20.5" width="26" height="15" stroke="var(--accent)" />
          <rect x="60.5" y="2.5" width="26" height="15" />
          <rect x="60.5" y="38.5" width="26" height="15" />
          <path d="M27 28H30" />
          <path d="M57 28H59V10H60" />
          <path d="M57 28H59V46H60" />
        </g>
      </svg>

      <p className="max-w-[440px] text-center text-lg font-medium leading-snug text-text-primary">
        Describe your app to generate a screen flow
      </p>
      <p className="mt-2 max-w-[440px] text-center font-mono text-xs leading-relaxed text-text-secondary">
        Screens become nodes, navigation becomes edges. Edit anything afterwards.
      </p>
    </div>);

}