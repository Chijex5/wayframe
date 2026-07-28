import '@xyflow/react/dist/style.css';
import React, { useMemo } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  type EdgeTypes,
  type NodeTypes } from
'@xyflow/react';
import { ScreenNode } from './ScreenNode';
import { EditableEdge } from './EditableEdge';
import { EmptyCanvasState } from './EmptyCanvasState';
import { CommandBar } from '../CommandBar';
import { defaultEdgeOptions } from '../../data/flowPayload';
import type { FlowEngine } from '../../hooks/useFlowEngine';

type FlowCanvasProps = {
  engine: FlowEngine;
};

export function FlowCanvas({ engine }: FlowCanvasProps) {
  const nodeTypes = useMemo<NodeTypes>(() => ({ screen: ScreenNode }), []);
  const edgeTypes = useMemo<EdgeTypes>(() => ({ editable: EditableEdge }), []);

  return (
    <div className="relative h-full w-full bg-bg">
      <ReactFlow
        nodes={engine.nodes}
        edges={engine.edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={engine.onNodesChange}
        onEdgesChange={engine.onEdgesChange}
        onConnect={engine.onConnect}
        defaultEdgeOptions={defaultEdgeOptions}
        multiSelectionKeyCode={null}
        selectionOnDrag={false}
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={1.75}>
        
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--border)"
          style={{ opacity: 0.6 }} />
        
        <Controls position="bottom-left" showInteractive={false} />
      </ReactFlow>

      {!engine.hasFlow && !engine.isGenerating && <EmptyCanvasState />}

      <CommandBar
        isBusy={engine.isBusy}
        isGenerating={engine.isGenerating}
        prompt={engine.prompt}
        replyText={engine.replyText}
        isReplyStreaming={engine.isReplyStreaming}
        onSubmit={engine.submitInstruction} />
      
    </div>);

}