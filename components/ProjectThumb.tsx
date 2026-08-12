// components/ProjectThumb.tsx
import React, { useMemo } from "react";
import type { MockProject } from "@/data/mockProjects";

export function ProjectThumb({ project }: { project: MockProject }) {
  const geometry = useMemo(() => {
    const nodes = project.nodes.slice(0, 6);
    if (nodes.length === 0) return { nodes: [], edges: [] };

    const minX = Math.min(...nodes.map((node) => node.position.x));
    const minY = Math.min(...nodes.map((node) => node.position.y));
    const maxX = Math.max(...nodes.map((node) => node.position.x));
    const maxY = Math.max(...nodes.map((node) => node.position.y));
    const width = Math.max(maxX - minX, 1);
    const height = Math.max(maxY - minY, 1);
    const scaledNodes = nodes.map((node) => ({
      id: node.id,
      x: 30 + ((node.position.x - minX) / width) * 224,
      y: 34 + ((node.position.y - minY) / height) * 76,
    }));

    return { nodes: scaledNodes, edges: project.edges };
  }, [project]);

  const nodeMap = new Map(geometry.nodes.map((node) => [node.id, node]));

  if (geometry.nodes.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-bg">
        <span className="text-xs text-text-secondary">Empty canvas</span>
      </div>
    );
  }

  return (
    <svg viewBox="0 0 320 148" aria-hidden="true" className="h-full w-full">
      <rect width="320" height="148" fill="var(--bg)" />

      <pattern id={`dots-${project.id}`} width="16" height="16" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="1" fill="var(--border)" opacity="0.6" />
      </pattern>
      <rect width="320" height="148" fill={`url(#dots-${project.id})`} />

      <g fill="none" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round">
        {geometry.edges.map((edge) => {
          const source = nodeMap.get(edge.source);
          const target = nodeMap.get(edge.target);
          if (!source || !target) return null;
          const sx = source.x + 60;
          const sy = source.y + 13;
          const tx = target.x;
          const ty = target.y + 13;
          const midX = (sx + tx) / 2;
          return <path key={edge.id} d={`M${sx} ${sy} C${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`} />;
        })}
      </g>

      <g>
        {geometry.nodes.map((node, index) => {
          const isFeatured = index === 1;
          return (
            <g key={node.id}>
              {isFeatured && (
                <rect
                  x={node.x - 3}
                  y={node.y - 3}
                  width="66"
                  height="32"
                  rx="10"
                  fill="var(--accent)"
                  opacity="0.12"
                />
              )}
              <rect
                x={node.x}
                y={node.y}
                width="60"
                height="26"
                rx="7"
                fill="var(--surface)"
                stroke={isFeatured ? "var(--accent)" : "var(--border)"}
                strokeWidth={isFeatured ? "1.5" : "1"}
              />
              <circle
                cx={node.x + 10}
                cy={node.y + 13}
                r="2.5"
                fill={isFeatured ? "var(--accent)" : "var(--text-secondary)"}
              />
              <rect
                x={node.x + 18}
                y={node.y + 11}
                width="32"
                height="4"
                rx="2"
                fill="var(--border)"
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
}