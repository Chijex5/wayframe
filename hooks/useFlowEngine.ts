import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type NodeChange,
} from "@xyflow/react";
import {
  defaultEdgeOptions,
  type GeneratedEdge,
  type GenerationPayload,
} from "../data/flowPayload";
import type {
  FlowSnapshot,
  FlowToolCall,
  FlowVersion,
  ScreenNodeType,
} from "../types/flow";
import type { FlowSuggestion } from "../data/suggestions";
import { checkCompleteness, editFlow, generateFlow } from "@/lib/api";
import { useMockStream } from "./useMockStream";
import type { ChatMessage } from "../data/mockProjects";
import type { ProjectSyncPatch } from "../store/useProjectsStore";

const STREAM_TICK_MS = 350;
const UNTITLED_PROJECT = "Untitled Project";

function toEdge(edge: GeneratedEdge): Edge {
  return { ...edge, ...defaultEdgeOptions };
}

function timestamp(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

type Graph = { nodes: ScreenNodeType[]; edges: Edge[] };

/**
 * Deep-copies the graph into a version snapshot, dropping transient UI fields
 * (selection, hover flags, delete callbacks) so a restore replays clean state.
 */
function toSnapshot(nodes: ScreenNodeType[], edges: Edge[]): FlowSnapshot {
  return {
    nodes: nodes.map((node) => ({
      ...node,
      selected: false,
      data: {
        label: node.data.label,
        screenId: node.data.screenId,
        category: node.data.category,
      },
    })),
    edges: edges.map((edge) => ({ ...edge, selected: false })),
  };
}

/**
 * Pure tool-call reducer: folds a call over a graph and returns the next graph
 * without touching React state. Applying a batch to a local copy lets us commit
 * atomically and capture a coherent snapshot at the call site — and is the same
 * path a server-issued tool call will take in a later phase.
 */
function applyCallToGraph(graph: Graph, call: FlowToolCall): Graph {
  switch (call.type) {
    case "addNode": {
      const { id, label, screenId, category, position } = call.payload;
      return {
        nodes: [
          ...graph.nodes,
          {
            id,
            type: "screen",
            position,
            selected: false,
            data: { label, screenId, category },
          },
        ],
        edges: graph.edges,
      };
    }
    case "connect": {
      const { source, target } = call.payload;
      return {
        nodes: graph.nodes,
        edges: addEdge(
          { id: `e-${source}-${target}`, source, target, ...defaultEdgeOptions },
          graph.edges,
        ),
      };
    }
    case "renameNode": {
      const { id, label } = call.payload;
      return {
        nodes: graph.nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, label } } : node,
        ),
        edges: graph.edges,
      };
    }
    default:
      return graph;
  }
}

type UseFlowEngineOptions = {
  initialProjectName?: string;
  initialNodes?: ScreenNodeType[];
  initialEdges?: Edge[];
  initialChatMessages?: ChatMessage[];
  onSync?: (patch: ProjectSyncPatch) => void;
};

export function useFlowEngine(options: UseFlowEngineOptions = {}) {
  const { onSync } = options;
  const { fitView, screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<ScreenNodeType>(
    options.initialNodes ?? [],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    options.initialEdges ?? [],
  );
  const [versions, setVersions] = useState<FlowVersion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [projectName, setProjectName] = useState(
    options.initialProjectName ?? UNTITLED_PROJECT,
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(
    options.initialChatMessages ?? [],
  );
  const [isChecking, setIsChecking] = useState(false);
  const [suggestions, setSuggestions] = useState<FlowSuggestion[]>([]);

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const timerRef = useRef<number | null>(null);
  const versionCountRef = useRef(0);
  const lastSyncRef = useRef<string | null>(null);

  const reply = useMockStream({ intervalMs: 35, chunkSize: 3 });

  const appendChatMessage = useCallback(
    (role: ChatMessage["role"], text: string) => {
      setChatMessages((current) => [
        ...current,
        {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          role,
          text,
          createdAt: new Date().toISOString(),
        },
      ]);
    },
    [],
  );

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    if (!onSync) return;

    const fingerprint = JSON.stringify({
      projectName,
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        data: edge.data,
      })),
      chatMessages,
    });

    if (lastSyncRef.current === fingerprint) return;
    lastSyncRef.current = fingerprint;
    onSync({ name: projectName, nodes, edges, chatMessages });
  }, [chatMessages, edges, nodes, onSync, projectName]);

  const frameView = useCallback(() => {
    window.setTimeout(() => {
      fitView({ padding: 0.18, duration: 260, maxZoom: 1 });
    }, 0);
  }, [fitView]);

  useEffect(() => {
    if ((options.initialNodes?.length ?? 0) > 0) frameView();
  }, [frameView, options.initialNodes?.length]);

  const logVersion = useCallback(
    (summary: string, source: FlowVersion["source"], snapshot: FlowSnapshot) => {
      versionCountRef.current += 1;
      setVersions((current) => [
        {
          id: `v_${String(versionCountRef.current).padStart(4, "0")}`,
          label: `v0.${versionCountRef.current}`,
          summary,
          timestamp: timestamp(),
          source,
          snapshot,
        },
        ...current,
      ]);
    },
    [],
  );

  /**
   * Single reveal function: consumes a { nodes, edges } payload and pushes items
   * into canvas state over time. A live streaming source (e.g. streamObject)
   * can replace the queue below without changing how items render on arrival.
   * `isGenerating` and the "generating…" system message are set by the caller,
   * since generation is now an awaited service call that may fail before reveal.
   */
  const streamFlowPayload = useCallback(
    (payload: GenerationPayload, generatedProjectName: string) => {
      clearTimer();
      setNodes([]);
      setEdges([]);

      const pendingNodes = [...payload.nodes];
      const pendingEdges = [...payload.edges];
      const present = new Set<string>();

      timerRef.current = window.setInterval(() => {
        // Edges become eligible one tick after both endpoints exist.
        const ready = pendingEdges.filter(
          (edge) => present.has(edge.source) && present.has(edge.target),
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
          setProjectName(generatedProjectName);
          logVersion(
            "Initial flow generated from description.",
            "chat",
            toSnapshot(payload.nodes, payload.edges.map(toEdge)),
          );
          appendChatMessage(
            "assistant",
            `Generated ${payload.nodes.length} screens and ${payload.edges.length} connections for ${generatedProjectName}.`,
          );
        }
      }, STREAM_TICK_MS);
    },
    [appendChatMessage, clearTimer, frameView, logVersion, setEdges, setNodes],
  );

  /**
   * Applies a batch of tool calls atomically: folds them through the pure
   * reducer over the current graph, commits the result in one state update, and
   * returns a snapshot of the outcome so the caller can log a coherent version.
   * Reads live graph state from refs so it is safe to call after an await.
   */
  const applyToolCalls = useCallback(
    (calls: FlowToolCall[]): FlowSnapshot => {
      const next = calls.reduce(applyCallToGraph, {
        nodes: nodesRef.current,
        edges: edgesRef.current,
      });
      const cleaned = toSnapshot(next.nodes, next.edges);
      setNodes(cleaned.nodes);
      setEdges(cleaned.edges);
      return cleaned;
    },
    [setEdges, setNodes],
  );

  const submitInstruction = useCallback(
    async (instruction: string) => {
      if (isGenerating) return;
      setPrompt(instruction);
      appendChatMessage("user", instruction);

      if (nodesRef.current.length === 0) {
        reply.reset();
        setIsGenerating(true);
        appendChatMessage(
          "system",
          "Generating flow - streaming screens onto canvas.",
        );

        try {
          const result = await generateFlow({ description: instruction });
          streamFlowPayload(result, result.projectName);
        } catch {
          setIsGenerating(false);
          appendChatMessage(
            "assistant",
            "Flow generation failed. Your canvas was left unchanged.",
          );
        }
        return;
      }

      try {
        const result = await editFlow({
          instruction,
          nodes: nodesRef.current,
          edges: edgesRef.current,
        });
        const snapshot = applyToolCalls(result.calls);
        // One version per instruction: the batch of tool calls commits together,
        // so a single snapshot represents this edit coherently.
        logVersion(
          result.summaries.join("; ") || "Applied edit.",
          "chat",
          snapshot,
        );
        frameView();
        appendChatMessage("assistant", result.summary);
        reply.start(result.summary);
      } catch {
        appendChatMessage(
          "assistant",
          "That edit could not be applied. Your flow was left unchanged.",
        );
      }
    },
    [
      appendChatMessage,
      applyToolCalls,
      frameView,
      isGenerating,
      logVersion,
      reply,
      streamFlowPayload,
    ],
  );

  const runCompletenessCheck = useCallback(async () => {
    if (nodesRef.current.length === 0 || isChecking) return;
    setIsChecking(true);
    appendChatMessage("system", "Running flow check against known app patterns.");

    try {
      const result = await checkCompleteness({
        nodes: nodesRef.current,
        edges,
      });
      setSuggestions(result.suggestions);
      setIsChecking(false);
      appendChatMessage(
        "assistant",
        `${result.suggestions.length} possible flow gap${result.suggestions.length > 1 ? "s" : ""} found.`,
      );
    } catch {
      setIsChecking(false);
      appendChatMessage(
        "assistant",
        "The flow check did not complete. Your flow was left unchanged.",
      );
    }
  }, [appendChatMessage, edges, isChecking]);

  /** Approvals reuse the same reducer path as any command-bar edit. */
  const approveSuggestion = useCallback(
    (suggestion: FlowSuggestion) => {
      const current = nodesRef.current;
      const anchor = current[current.length - 1];
      const id = `${suggestion.screenId}_${current.length + 1}`;

      const calls: FlowToolCall[] = [
        {
          type: "addNode",
          payload: {
            id,
            label: suggestion.title.replace(/^Add\s+/i, ""),
            screenId: suggestion.screenId,
            category: suggestion.category,
            position: anchor
              ? { x: anchor.position.x + 250, y: anchor.position.y + 90 }
              : { x: 0, y: 0 },
          },
        },
      ];
      if (anchor) {
        calls.push({
          type: "connect",
          payload: { source: anchor.id, target: id },
        });
      }

      const snapshot = applyToolCalls(calls);
      logVersion(`Approved suggestion: ${suggestion.title}`, "suggestion", snapshot);
      appendChatMessage("assistant", `Approved suggestion: ${suggestion.title}.`);
      setSuggestions((items) =>
        items.filter((item) => item.id !== suggestion.id),
      );
      frameView();
    },
    [appendChatMessage, applyToolCalls, frameView, logVersion],
  );

  const rejectSuggestion = useCallback(
    (id: string) => {
      const rejected = suggestions.find((item) => item.id === id);
      if (rejected)
        appendChatMessage("assistant", `Rejected suggestion: ${rejected.title}.`);
      setSuggestions((items) => items.filter((item) => item.id !== id));
    },
    [appendChatMessage, suggestions],
  );

  /**
   * Replays a historical graph and records the operation as a new version. The
   * source version remains untouched, so restore is append-only and reversible.
   */
  const restoreVersion = useCallback(
    (id: string): boolean => {
      const version = versions.find((item) => item.id === id);
      if (!version?.snapshot || isGenerating) return false;

      const snapshot = toSnapshot(
        version.snapshot.nodes,
        version.snapshot.edges,
      );
      setNodes(snapshot.nodes);
      setEdges(snapshot.edges);
      setSuggestions([]);
      logVersion(
        `Restored ${version.label}: ${version.summary}`,
        "restore",
        snapshot,
      );
      appendChatMessage(
        "assistant",
        `Restored ${version.label}. The previous canvas remains available in history.`,
      );
      frameView();
      return true;
    },
    [
      appendChatMessage,
      frameView,
      isGenerating,
      logVersion,
      setEdges,
      setNodes,
      versions,
    ],
  );

  /** Selection is exclusive: only one node can carry the accent border. */
  const handleNodesChange = useCallback(
    (changes: NodeChange<ScreenNodeType>[]) => {
      onNodesChange(changes);

      const selectedChange = changes.find(
        (change) => change.type === "select" && change.selected,
      );
      if (selectedChange && selectedChange.type === "select") {
        setNodes((current) =>
          current.map((node) => ({
            ...node,
            selected: node.id === selectedChange.id,
          })),
        );
        setEdges((current) =>
          current.map((edge) =>
            edge.selected ? { ...edge, selected: false } : edge,
          ),
        );
      }
    },
    [onNodesChange, setEdges, setNodes],
  );

  const addManualNode = useCallback(() => {
    const index = nodesRef.current.length + 1;
    const position = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    const nextNodes: ScreenNodeType[] = [
      ...nodesRef.current.map((node) => ({ ...node, selected: false })),
      {
        id: `manual_${Date.now()}`,
        type: "screen",
        position,
        selected: true,
        data: {
          label: `New Screen ${index}`,
          screenId: `scr_manual_${index}`,
          category: "core",
        },
      },
    ];
    const nextEdges = edgesRef.current.map((edge) =>
      edge.selected ? { ...edge, selected: false } : edge,
    );
    setNodes(nextNodes);
    setEdges(nextEdges);
    logVersion(
      `Added New Screen ${index} manually.`,
      "manual",
      toSnapshot(nextNodes, nextEdges),
    );
  }, [logVersion, screenToFlowPosition, setEdges, setNodes]);

  const deleteNode = useCallback(
    (id: string) => {
      const node = nodesRef.current.find((item) => item.id === id);
      const nextNodes = nodesRef.current.filter((item) => item.id !== id);
      const nextEdges = edgesRef.current.filter(
        (edge) => edge.source !== id && edge.target !== id,
      );
      setNodes(nextNodes);
      setEdges(nextEdges);
      logVersion(
        `Deleted ${node?.data.label ?? "node"} manually.`,
        "manual",
        toSnapshot(nextNodes, nextEdges),
      );
    },
    [logVersion, setEdges, setNodes],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const nextEdges = addEdge(
        { ...connection, ...defaultEdgeOptions },
        edgesRef.current,
      );
      setEdges(nextEdges);
      logVersion(
        "Connected two screens manually.",
        "manual",
        toSnapshot(nodesRef.current, nextEdges),
      );
    },
    [logVersion, setEdges],
  );

  const isBusy = isGenerating || reply.isStreaming;

  return useMemo(
    () => ({
      nodes,
      edges,
      onNodesChange: handleNodesChange,
      onEdgesChange,
      onConnect,
      addManualNode,
      deleteNode,
      versions,
      restoreVersion,
      isGenerating,
      isBusy,
      hasFlow: nodes.length > 0,
      projectName,
      prompt,
      chatMessages,
      replyText: reply.text,
      isReplyStreaming: reply.isStreaming,
      submitInstruction,
      isChecking,
      suggestions,
      runCompletenessCheck,
      approveSuggestion,
      rejectSuggestion,
    }),
    [
      addManualNode,
      approveSuggestion,
      chatMessages,
      deleteNode,
      edges,
      handleNodesChange,
      isBusy,
      isChecking,
      isGenerating,
      nodes,
      onConnect,
      onEdgesChange,
      projectName,
      prompt,
      rejectSuggestion,
      reply.isStreaming,
      reply.text,
      restoreVersion,
      runCompletenessCheck,
      submitInstruction,
      suggestions,
      versions,
    ],
  );
}

export type FlowEngine = ReturnType<typeof useFlowEngine>;
