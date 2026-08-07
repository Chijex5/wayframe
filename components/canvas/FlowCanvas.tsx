import "@xyflow/react/dist/style.css";
import React, { useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  type Edge,
  type EdgeTypes,
  type Node,
  type NodeTypes,
} from "@xyflow/react";
import { ScreenNode } from "./ScreenNode";
import { EditableEdge } from "./EditableEdge";
import { EmptyCanvasState } from "./EmptyCanvasState";
import { CommandBar } from "../CommandBar";
import { GitBranchIcon, LayersIcon, PlusIcon } from "lucide-react";
import { defaultEdgeOptions } from "../../data/flowPayload";
import type { FlowEngine } from "../../hooks/useFlowEngine";
import type { ScreenNodeType } from "../../types/flow";

type FlowCanvasProps = {
  engine: FlowEngine;
  captureRef?: React.RefObject<HTMLDivElement | null>;
};

export function FlowCanvas({ engine, captureRef }: FlowCanvasProps) {
  const nodeTypes = useMemo<NodeTypes>(() => ({ screen: ScreenNode }), []);
  const edgeTypes = useMemo<EdgeTypes>(() => ({ editable: EditableEdge }), []);
  const [connectionSourceId, setConnectionSourceId] = useState<string | null>(
    null,
  );
  const [connectionTargetId, setConnectionTargetId] = useState<string | null>(
    null,
  );

  const nodes = useMemo<ScreenNodeType[]>(
    () =>
      engine.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isConnectionTarget: connectionTargetId === node.id,
          onDelete: engine.deleteNode,
        },
      })),
    [connectionTargetId, engine.deleteNode, engine.nodes],
  );

  return (
    <div className="relative h-full w-full bg-bg">
      <div ref={captureRef} className="h-full w-full bg-bg">
        <ReactFlow<ScreenNodeType, Edge>
          nodes={nodes}
          edges={engine.edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={engine.onNodesChange}
          onEdgesChange={engine.onEdgesChange}
          onConnect={engine.onConnect}
          onConnectStart={(_, params) => {
            setConnectionSourceId(params.nodeId ?? null);
            setConnectionTargetId(null);
          }}
          onConnectEnd={() => {
            setConnectionSourceId(null);
            setConnectionTargetId(null);
          }}
          onNodeMouseEnter={(_, node: Node) => {
            if (connectionSourceId && node.id !== connectionSourceId) {
              setConnectionTargetId(node.id);
            }
          }}
          onNodeMouseLeave={(_, node: Node) => {
            if (connectionTargetId === node.id) setConnectionTargetId(null);
          }}
          defaultEdgeOptions={defaultEdgeOptions}
          multiSelectionKeyCode={null}
          selectionOnDrag={false}
          proOptions={{ hideAttribution: true }}
          minZoom={0.3}
          maxZoom={1.75}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="var(--border)"
            style={{ opacity: 0.6 }}
          />

          <Controls position="bottom-left" showInteractive={false} />
        </ReactFlow>
      </div>

      <div className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-24px)] flex-wrap items-center gap-1.5 border border-border bg-surface p-1.5">
        <button
          type="button"
          onClick={engine.addManualNode}
          disabled={engine.isGenerating}
          className="inline-flex h-8 items-center gap-2 border border-accent bg-accent px-2.5 font-mono text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-raised disabled:text-text-secondary"
        >
          <PlusIcon className="h-3.5 w-3.5" aria-hidden="true" />
          Add node
        </button>
        <div className="hidden h-8 items-center gap-2 border border-border bg-bg px-2 font-mono text-[11px] text-text-secondary sm:flex">
          <LayersIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {engine.nodes.length} nodes
        </div>
        <div className="hidden h-8 items-center gap-2 border border-border bg-bg px-2 font-mono text-[11px] text-text-secondary sm:flex">
          <GitBranchIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {engine.edges.length} edges
        </div>
      </div>

      {!engine.hasFlow && !engine.isGenerating && <EmptyCanvasState />}

      <CommandBar
        isBusy={engine.isBusy}
        isGenerating={engine.isGenerating}
        chatMessages={engine.chatMessages}
        replyText={engine.replyText}
        isReplyStreaming={engine.isReplyStreaming}
        onSubmit={engine.submitInstruction}
      />
    </div>
  );
}
