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
      x: 28 + ((node.position.x - minX) / width) * 228,
      y: 28 + ((node.position.y - minY) / height) * 82,
    }));

    return { nodes: scaledNodes, edges: project.edges };
  }, [project]);

  const nodeMap = new Map(geometry.nodes.map((node) => [node.id, node]));

  if (geometry.nodes.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <span className="font-mono text-xs text-text-secondary">
          No content yet
        </span>
      </div>
    );
  }

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