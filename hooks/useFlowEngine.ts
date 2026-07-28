import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type NodeChange } from
'@xyflow/react';
import {
  defaultEdgeOptions,
  describeToolCall,
  generationPayload,
  planToolCalls,
  type GeneratedEdge,
  type GenerationPayload } from
'../data/flowPayload';
import type { FlowToolCall, FlowVersion, ScreenNodeType } from '../types/flow';
import { mockSuggestions, type FlowSuggestion } from '../data/suggestions';
import { useMockStream } from './useMockStream';

const STREAM_TICK_MS = 350;
const CHECK_DURATION_MS = 1800;

function toEdge(edge: GeneratedEdge): Edge {
  return { ...edge, ...defaultEdgeOptions };
}

function timestamp(): string {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

export function useFlowEngine() {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<ScreenNodeType>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [versions, setVersions] = useState<FlowVersion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [suggestions, setSuggestions] = useState<FlowSuggestion[]>([]);

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const timerRef = useRef<number | null>(null);
  const checkTimerRef = useRef<number | null>(null);
  const versionCountRef = useRef(0);

  const reply = useMockStream({ intervalMs: 35, chunkSize: 3 });

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      clearTimer();
      if (checkTimerRef.current !== null) window.clearTimeout(checkTimerRef.current);
    },
    [clearTimer]
  );

  const frameView = useCallback(() => {
    window.setTimeout(() => {
      fitView({ padding: 0.18, duration: 260, maxZoom: 1 });
    }, 0);
  }, [fitView]);

  const logVersion = useCallback(
    (summary: string, source: FlowVersion['source']) => {
      versionCountRef.current += 1;
      setVersions((current) => [
      {
        id: `v_${String(versionCountRef.current).padStart(4, '0')}`,
        label: `v0.${versionCountRef.current}`,
        summary,
        timestamp: timestamp(),
        source
      },
      ...current]
      );
    },
    []
  );

  /**
   * Single reveal function: consumes a { nodes, edges } payload and pushes items
   * into canvas state over time. A live streaming source (e.g. streamObject)
   * can replace the queue below without changing how items render on arrival.
   */
  const streamFlowPayload = useCallback(
    (payload: GenerationPayload) => {
      clearTimer();
      setNodes([]);
      setEdges([]);
      setIsGenerating(true);

      const pendingNodes = [...payload.nodes];
      const pendingEdges = [...payload.edges];
      const present = new Set<string>();

      timerRef.current = window.setInterval(() => {
        // Edges become eligible one tick after both endpoints exist.
        const ready = pendingEdges.filter(
          (edge) => present.has(edge.source) && present.has(edge.target)
        );
        if (ready.length > 0) {
          const readyIds = new Set(ready.map((edge) => edge.id));
          for (let i = pendingEdges.length - 1; i >= 0; i -= 1) {
            if (readyIds.has(pendingEdges[i].id)) pendingEdges.splice(i, 1);
          }
          setEdges((current) => [...current, ...ready.map(toEdge)]);
        }

        const next = pendingNodes.shift();
        if (next) {
          present.add(next.id);
          setNodes((current) => [...current, { ...next, selected: false }]);
        }

        frameView();

        if (pendingNodes.length === 0 && pendingEdges.length === 0) {
          clearTimer();
          setIsGenerating(false);
          logVersion('Initial flow generated from description.', 'chat');
        }
      }, STREAM_TICK_MS);
    },
    [clearTimer, frameView, logVersion, setEdges, setNodes]
  );

  /** Single reducer applying tool-call-shaped edits to canvas state. */
  const applyToolCall = useCallback(
    (call: FlowToolCall) => {
      switch (call.type) {
        case 'addNode':{
            const { id, label, screenId, category, position } = call.payload;
            setNodes((current) => [
            ...current,
            {
              id,
              type: 'screen',
              position,
              selected: false,
              data: { label, screenId, category }
            }]
            );
            break;
          }
        case 'connect':{
            const { source, target } = call.payload;
            setEdges((current) =>
            addEdge(
              { id: `e-${source}-${target}`, source, target, ...defaultEdgeOptions },
              current
            )
            );
            break;
          }
        case 'renameNode':{
            const { id, label } = call.payload;
            setNodes((current) =>
            current.map((node) =>
            node.id === id ? { ...node, data: { ...node.data, label } } : node
            )
            );
            break;
          }
        default:
          break;
      }
    },
    [setEdges, setNodes]
  );

  const submitInstruction = useCallback(
    (instruction: string) => {
      if (isGenerating) return;
      setPrompt(instruction);

      if (nodesRef.current.length === 0) {
        reply.reset();
        streamFlowPayload(generationPayload);
        return;
      }

      const calls = planToolCalls(instruction, nodesRef.current);
      const summaries = calls.map((call) => describeToolCall(call, nodesRef.current));
      calls.forEach(applyToolCall);
      summaries.forEach((summary) => logVersion(`${summary}.`, 'chat'));
      frameView();
      reply.start(`Applied ${calls.length} change${calls.length > 1 ? 's' : ''} — ${summaries.join('; ')}.`);
    },
    [applyToolCall, frameView, isGenerating, logVersion, reply, streamFlowPayload]
  );

  const runCompletenessCheck = useCallback(() => {
    if (nodesRef.current.length === 0 || isChecking) return;
    setIsChecking(true);
    if (checkTimerRef.current !== null) window.clearTimeout(checkTimerRef.current);
    checkTimerRef.current = window.setTimeout(() => {
      setSuggestions(mockSuggestions);
      setIsChecking(false);
      checkTimerRef.current = null;
    }, CHECK_DURATION_MS);
  }, [isChecking]);

  /** Approvals reuse the same reducer path as any command-bar edit. */
  const approveSuggestion = useCallback(
    (suggestion: FlowSuggestion) => {
      const current = nodesRef.current;
      const anchor = current[current.length - 1];
      const id = `${suggestion.screenId}_${current.length + 1}`;

      applyToolCall({
        type: 'addNode',
        payload: {
          id,
          label: suggestion.title.replace(/^Add\s+/i, ''),
          screenId: suggestion.screenId,
          category: suggestion.category,
          position: anchor ?
          { x: anchor.position.x + 250, y: anchor.position.y + 90 } :
          { x: 0, y: 0 }
        }
      });

      if (anchor) {
        applyToolCall({ type: 'connect', payload: { source: anchor.id, target: id } });
      }

      logVersion(`Approved suggestion: ${suggestion.title}`, 'suggestion');
      setSuggestions((items) => items.filter((item) => item.id !== suggestion.id));
      frameView();
    },
    [applyToolCall, frameView, logVersion]
  );

  const rejectSuggestion = useCallback((id: string) => {
    setSuggestions((items) => items.filter((item) => item.id !== id));
  }, []);

  /** Selection is exclusive: only one node can carry the accent border. */
  const handleNodesChange = useCallback(
    (changes: NodeChange<ScreenNodeType>[]) => {
      onNodesChange(changes);

      const selectedChange = changes.find(
        (change) => change.type === 'select' && change.selected
      );
      if (selectedChange && selectedChange.type === 'select') {
        setNodes((current) =>
        current.map((node) => ({
          ...node,
          selected: node.id === selectedChange.id
        }))
        );
        setEdges((current) =>
        current.map((edge) =>
        edge.selected ? { ...edge, selected: false } : edge
        )
        );
      }
    },
    [onNodesChange, setEdges, setNodes]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((current) => addEdge({ ...connection, ...defaultEdgeOptions }, current));
      logVersion('Connected two screens manually.', 'manual');
    },
    [logVersion, setEdges]
  );

  const isBusy = isGenerating || reply.isStreaming;

  return useMemo(
    () => ({
      nodes,
      edges,
      onNodesChange: handleNodesChange,
      onEdgesChange,
      onConnect,
      versions,
      isGenerating,
      isBusy,
      hasFlow: nodes.length > 0,
      prompt,
      replyText: reply.text,
      isReplyStreaming: reply.isStreaming,
      submitInstruction,
      isChecking,
      suggestions,
      runCompletenessCheck,
      approveSuggestion,
      rejectSuggestion
    }),
    [
    approveSuggestion,
    edges,
    handleNodesChange,
    isBusy,
    isChecking,
    isGenerating,
    nodes,
    onConnect,
    onEdgesChange,
    prompt,
    rejectSuggestion,
    reply.isStreaming,
    reply.text,
    runCompletenessCheck,
    submitInstruction,
    suggestions,
    versions]

  );
}

export type FlowEngine = ReturnType<typeof useFlowEngine>;