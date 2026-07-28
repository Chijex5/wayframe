import '@xyflow/react/dist/style.css';
import React, { useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps } from
'@xyflow/react';
import { XIcon } from 'lucide-react';

export function EditableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  selected
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  const [isHovered, setIsHovered] = useState(false);

  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 2
  });

  const showDelete = isHovered || selected;

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} />
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="react-flow__edge-interaction"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)} />
      
      {showDelete &&
      <EdgeLabelRenderer>
          <div
          className="nodrag nopan absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all'
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}>
          
            <button
            type="button"
            aria-label="Delete connection"
            onClick={() => setEdges((edges) => edges.filter((edge) => edge.id !== id))}
            className="flex h-4 w-4 items-center justify-center border border-border bg-surface text-text-secondary transition-colors hover:border-danger hover:text-danger"
            style={{ borderRadius: 'var(--radius-sm)' }}>
            
              <XIcon className="h-2.5 w-2.5" aria-hidden="true" />
            </button>
          </div>
        </EdgeLabelRenderer>
      }
    </>);

}