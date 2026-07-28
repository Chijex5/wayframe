import React from 'react';
import { motion } from 'framer-motion';

export type StageNode = {
  id: string;
  label: string;
  screenId: string;
  x: number;
  y: number;
  color: string;
  accent?: boolean;
};

export type StageEdge = {
  id: string;
  from: string;
  to: string;
  d: string;
};

export const NODE_W = 150;
export const NODE_H = 48;

type DiagramStageProps = {
  nodes: StageNode[];
  edges: StageEdge[];
  /** How many nodes (in order) are currently revealed. */
  visibleCount: number;
  ariaLabel: string;
};

/** Shared SVG stage that renders canvas-accurate nodes and edges at any width. */
export function DiagramStage({
  nodes,
  edges,
  visibleCount,
  ariaLabel
}: DiagramStageProps) {
  const visibleIds = new Set(nodes.slice(0, visibleCount).map((node) => node.id));

  return (
    <svg
      viewBox="0 0 920 300"
      role="img"
      aria-label={ariaLabel}
      className="h-auto w-full">
      
      <defs>
        <marker
          id="wf-stage-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse">
          
          <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--border)" />
        </marker>
      </defs>

      {edges.map((edge) => {
        const isVisible = visibleIds.has(edge.from) && visibleIds.has(edge.to);
        return (
          <motion.path
            key={edge.id}
            d={edge.d}
            fill="none"
            stroke="var(--border)"
            strokeWidth="1"
            markerEnd="url(#wf-stage-arrow)"
            initial={false}
            animate={{ pathLength: isVisible ? 1 : 0, opacity: isVisible ? 1 : 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }} />);


      })}

      {nodes.map((node) => {
        const isVisible = visibleIds.has(node.id);
        return (
          <motion.g
            key={node.id}
            initial={false}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 5 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}>
            
            <rect
              x={node.x}
              y={node.y}
              width={NODE_W}
              height={NODE_H}
              rx="2"
              fill="var(--surface)"
              stroke={node.accent ? 'var(--accent)' : 'var(--border)'}
              strokeWidth="1" />
            
            <rect x={node.x} y={node.y} width="3" height={NODE_H} fill={node.color} />
            <rect
              x={node.x + 14}
              y={node.y + 13}
              width="5"
              height="5"
              fill={node.color} />
            
            <text
              x={node.x + 26}
              y={node.y + 19}
              fill="var(--text-primary)"
              fontSize="12"
              fontWeight="500"
              style={{ fontFamily: 'var(--font-ui)' }}>
              
              {node.label}
            </text>
            <line
              x1={node.x + 14}
              y1={node.y + 28}
              x2={node.x + NODE_W - 14}
              y2={node.y + 28}
              stroke="var(--border)"
              strokeWidth="1" />
            
            <text
              x={node.x + 14}
              y={node.y + 40}
              fill="var(--text-secondary)"
              fontSize="10"
              style={{ fontFamily: 'var(--font-mono)' }}>
              
              {node.screenId}
            </text>
          </motion.g>);

      })}
    </svg>);

}