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
  describeToolCall,
  generationPayload,
  planToolCalls,
  type GeneratedEdge,
  type GenerationPayload,
} from "../data/flowPayload";
import type { FlowToolCall, FlowVersion, ScreenNodeType } from "../types/flow";
import { mockSuggestions, type FlowSuggestion } from "../data/suggestions";
import { useMockStream } from "./useMockStream";
import type { ChatMessage } from "../data/mockProjects";
import type { ProjectSyncPatch } from "../store/useProjectsStore";

const STREAM_TICK_MS = 350;
const CHECK_DURATION_MS = 1800;
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

function deriveProjectName(description: string): string {
  const text = description.toLowerCase();

  if (text.match(/\b(e-?commerce|shop|store|cart|checkout|product)\b/)) {
    return "E-commerce Flow";
  }
  if (text.match(/\b(saas|dashboard|analytics|admin|report)\b/)) {
    return "SaaS Dashboard Flow";
  }
  if (text.match(/\b(sign in|login|auth|onboarding|account)\b/)) {
    return "Onboarding Flow";
  }

  const stopWords = new Set([
    "a",
    "an",
    "and",
    "app",
    "build",
    "create",
    "for",
    "flow",
    "generate",
    "make",
    "of",
    "the",
    "to",
    "with",
  ]);

  const words = description
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word.toLowerCase()))
    .slice(0, 3);

  if (words.length === 0) return "Generated Flow";

  return `${words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")} Flow`;
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
  const timerRef = useRef<number | null>(null);
  const checkTimerRef = useRef<number | null>(null);
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

  useEffect(
    () => () => {
      clearTimer();
      if (checkTimerRef.current !== null)
        window.clearTimeout(checkTimerRef.current);
    },
    [clearTimer],
  );

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

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
    (summary: string, source: FlowVersion["source"]) => {
      versionCountRef.current += 1;
      setVersions((current) => [
        {
          id: `v_${String(versionCountRef.current).padStart(4, "0")}`,
          label: `v0.${versionCountRef.current}`,
          summary,
          timestamp: timestamp(),
          source,
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
   */
  const streamFlowPayload = useCallback(
    (payload: GenerationPayload, instruction: string) => {
      clearTimer();
      setNodes([]);
      setEdges([]);
      setIsGenerating(true);
      appendChatMessage("system", "Generating flow - streaming screens onto canvas.");

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
          const nextProjectName = deriveProjectName(instruction);
          setProjectName(nextProjectName);
          logVersion("Initial flow generated from description.", "chat");
          appendChatMessage(
            "assistant",
            `Generated ${payload.nodes.length} screens and ${payload.edges.length} connections for ${nextProjectName}.`,
          );
        }
      }, STREAM_TICK_MS);
    },
    [appendChatMessage, clearTimer, frameView, logVersion, setEdges, setNodes],
  );

  /** Single reducer applying tool-call-shaped edits to canvas state. */
  const applyToolCall = useCallback(
    (call: FlowToolCall) => {
      switch (call.type) {
        case "addNode": {
          const { id, label, screenId, category, position } = call.payload;
          setNodes((current) => [
            ...current,
            {
              id,
              type: "screen",
              position,
              selected: false,
              data: { label, screenId, category },
            },
          ]);
          break;
        }
        case "connect": {
          const { source, target } = call.payload;
          setEdges((current) =>
            addEdge(
              {
                id: `e-${source}-${target}`,
                source,
                target,
                ...defaultEdgeOptions,
              },
              current,
            ),
          );
          break;
        }
        case "renameNode": {
          const { id, label } = call.payload;
          setNodes((current) =>
            current.map((node) =>
              node.id === id
                ? { ...node, data: { ...node.data, label } }
                : node,
            ),
          );
          break;
        }
        default:
          break;
      }
    },
    [setEdges, setNodes],
  );

  const submitInstruction = useCallback(
    (instruction: string) => {
      if (isGenerating) return;
      setPrompt(instruction);
      appendChatMessage("user", instruction);

      if (nodesRef.current.length === 0) {
        reply.reset();
        streamFlowPayload(generationPayload, instruction);
        return;
      }

      const calls = planToolCalls(instruction, nodesRef.current);
      const summaries = calls.map((call) =>
        describeToolCall(call, nodesRef.current),
      );
      const assistantSummary = `Applied ${calls.length} change${calls.length > 1 ? "s" : ""}: ${summaries.join("; ")}.`;
      calls.forEach(applyToolCall);
      summaries.forEach((summary) => logVersion(`${summary}.`, "chat"));
      frameView();
      appendChatMessage("assistant", assistantSummary);
      reply.start(assistantSummary);
    },
    [
      appendChatMessage,
      applyToolCall,
      frameView,
      isGenerating,
      logVersion,
      reply,
      streamFlowPayload,
    ],
  );

  const runCompletenessCheck = useCallback(() => {
    if (nodesRef.current.length === 0 || isChecking) return;
    setIsChecking(true);
    appendChatMessage("system", "Running flow check against known app patterns.");
    if (checkTimerRef.current !== null)
      window.clearTimeout(checkTimerRef.current);
    checkTimerRef.current = window.setTimeout(() => {
      setSuggestions(mockSuggestions);
      setIsChecking(false);
      checkTimerRef.current = null;
      appendChatMessage(
        "assistant",
        `${mockSuggestions.length} possible flow gap${mockSuggestions.length > 1 ? "s" : ""} found.`,
      );
    }, CHECK_DURATION_MS);
  }, [appendChatMessage, isChecking]);

  /** Approvals reuse the same reducer path as any command-bar edit. */
  const approveSuggestion = useCallback(
    (suggestion: FlowSuggestion) => {
      const current = nodesRef.current;
      const anchor = current[current.length - 1];
      const id = `${suggestion.screenId}_${current.length + 1}`;

      applyToolCall({
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
      });

      if (anchor) {
        applyToolCall({
          type: "connect",
          payload: { source: anchor.id, target: id },
        });
      }

      logVersion(`Approved suggestion: ${suggestion.title}`, "suggestion");
      appendChatMessage("assistant", `Approved suggestion: ${suggestion.title}.`);
      setSuggestions((items) =>
        items.filter((item) => item.id !== suggestion.id),
      );
      frameView();
    },
    [appendChatMessage, applyToolCall, frameView, logVersion],
  );

  const rejectSuggestion = useCallback(
    (id: string) => {
      const rejected = suggestions.find((item) => item.id === id);
      if (rejected) appendChatMessage("assistant", `Rejected suggestion: ${rejected.title}.`);
      setSuggestions((items) => items.filter((item) => item.id !== id));
    },
    [appendChatMessage, suggestions],
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

    setNodes((current) => [
      ...current.map((node) => ({ ...node, selected: false })),
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
    ]);
    setEdges((current) =>
      current.map((edge) =>
        edge.selected ? { ...edge, selected: false } : edge,
      ),
    );
    logVersion(`Added New Screen ${index} manually.`, "manual");
  }, [logVersion, screenToFlowPosition, setEdges, setNodes]);

  const deleteNode = useCallback(
    (id: string) => {
      const node = nodesRef.current.find((item) => item.id === id);
      setNodes((current) => current.filter((item) => item.id !== id));
      setEdges((current) =>
        current.filter((edge) => edge.source !== id && edge.target !== id),
      );
      logVersion(`Deleted ${node?.data.label ?? "node"} manually.`, "manual");
    },
    [logVersion, setEdges, setNodes],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((current) =>
        addEdge({ ...connection, ...defaultEdgeOptions }, current),
      );
      logVersion("Connected two screens manually.", "manual");
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
      runCompletenessCheck,
      submitInstruction,
      suggestions,
      versions,
    ],
  );
}

export type FlowEngine = ReturnType<typeof useFlowEngine>;
