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
  FlowError,
  FlowSnapshot,
  FlowToolCall,
  FlowVersion,
  ScreenNodeType,
} from "../types/flow";
import type { FlowSuggestion } from "../data/suggestions";
import { checkCompleteness, editFlow, generateFlow, withRetry } from "@/lib/api";
import {
  InvalidToolCallError,
  validateToolCalls,
} from "@/lib/flow/validateToolCalls";
import { sanitizeNodes } from "@/lib/flow/sanitizeNodes";
import { persistVersion } from "@/lib/api/projectsActions";
import { useMockStream } from "./useMockStream";
import type { ChatMessage } from "../data/mockProjects";
import type { ProjectSyncPatch } from "../store/useProjectsStore";

const STREAM_TICK_MS = 350;
const UNTITLED_PROJECT = "Untitled Project";

function toEdge(edge: GeneratedEdge): Edge {
  return { ...edge, ...defaultEdgeOptions };
}

// Versions store an ISO timestamp so an optimistically-logged version and one
// reloaded from the DB (flow_versions.timestamp, mapped to ISO) share one format;
// VersionHistoryPanel formats it for display.
function timestamp(): string {
  return new Date().toISOString();
}

type Graph = { nodes: ScreenNodeType[]; edges: Edge[] };

/**
 * Deep-copies the graph into a version snapshot, dropping transient UI fields
 * (selection, hover flags, delete callbacks) so a restore replays clean state.
 * Node cleaning is shared with the server-side persistence strip via
 * `sanitizeNodes` so both paths drop the exact same transient fields.
 */
function toSnapshot(nodes: ScreenNodeType[], edges: Edge[]): FlowSnapshot {
  return {
    nodes: sanitizeNodes(nodes),
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
    case "removeNode": {
      const { id } = call.payload;
      return {
        nodes: graph.nodes.filter((node) => node.id !== id),
        // Removing a screen removes every connection touching it, so no edge is
        // left dangling to a node that no longer exists.
        edges: graph.edges.filter(
          (edge) => edge.source !== id && edge.target !== id,
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
    case "addEdge": {
      const { source, target } = call.payload;
      return {
        nodes: graph.nodes,
        edges: addEdge(
          { id: `e-${source}-${target}`, source, target, ...defaultEdgeOptions },
          graph.edges,
        ),
      };
    }
    case "removeEdge": {
      const { source, target } = call.payload;
      return {
        nodes: graph.nodes,
        edges: graph.edges.filter(
          (edge) => !(edge.source === source && edge.target === target),
        ),
      };
    }
    default:
      return graph;
  }
}

type UseFlowEngineOptions = {
  projectId?: string;
  initialProjectName?: string;
  initialNodes?: ScreenNodeType[];
  initialEdges?: Edge[];
  initialChatMessages?: ChatMessage[];
  initialVersions?: FlowVersion[];
  onSync?: (patch: ProjectSyncPatch) => void;
};

export function useFlowEngine(options: UseFlowEngineOptions = {}) {
  const { onSync, projectId } = options;
  const { fitView, screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<ScreenNodeType>(
    options.initialNodes ?? [],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    options.initialEdges ?? [],
  );
  const [versions, setVersions] = useState<FlowVersion[]>(
    options.initialVersions ?? [],
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<FlowError | null>(null);
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
  const mutationRef = useRef(false);
  const checkRef = useRef(false);
  const lastInstructionRef = useRef<string | null>(null);
  const runCompletenessCheckRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<number | null>(null);
  // Seed from loaded versions so labels stay stable and monotonic across reloads
  // (loaded rows are v0.1..v0.N; the next logged version continues at v0.N+1).
  const versionCountRef = useRef(options.initialVersions?.length ?? 0);
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
      const count = versionCountRef.current;
      const label = `v0.${count}`;
      // Optimistic temp id; reconciled with the DB row id after persistence.
      const tempId = `tmp_v_${count}`;
      setVersions((current) => [
        { id: tempId, label, summary, timestamp: timestamp(), source, snapshot },
        ...current,
      ]);

      // Write-through. Without a projectId (e.g. an unsaved/preview surface) the
      // version stays in-memory only. The flow graph is synced separately via
      // onSync and is the source of truth, so a failed version insert is
      // non-fatal: keep the optimistic row and warn — it can be re-logged.
      if (!projectId) return;
      void persistVersion(projectId, { label, summary, source, snapshot }).then(
        (result) => {
          if (!result.ok) {
            console.warn(`Version not persisted: ${result.error}`);
            return;
          }
          setVersions((current) =>
            current.map((version) =>
              version.id === tempId
                ? { ...version, id: result.data.id }
                : version,
            ),
          );
        },
      );
    },
    [projectId],
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
      // The AI-chosen name is known before the first screen streams in — apply it
      // now so the header reflects it during the reveal, not only at the end.
      setProjectName(generatedProjectName);

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
      const current = {
        nodes: nodesRef.current,
        edges: edgesRef.current,
      };
      validateToolCalls(calls, current);
      const next = calls.reduce(applyCallToGraph, current);
      const cleaned = toSnapshot(next.nodes, next.edges);
      setNodes(cleaned.nodes);
      setEdges(cleaned.edges);
      return cleaned;
    },
    [setEdges, setNodes],
  );

  const runGeneration = useCallback(
    async (instruction: string) => {
      setError(null);
      setIsGenerating(true);
      setIsRetrying(false);
      try {
        const result = await withRetry(
          () => generateFlow({ description: instruction }),
          { onRetry: () => setIsRetrying(true) },
        );
        streamFlowPayload(result, result.projectName);
      } catch {
        setIsGenerating(false);
        setError({
          scope: "generate",
          message:
            "Flow generation failed. Your canvas was left unchanged — try again.",
          retryable: true,
        });
        appendChatMessage(
          "assistant",
          "Flow generation failed. Your canvas was left unchanged.",
        );
      } finally {
        setIsRetrying(false);
      }
    },
    [appendChatMessage, streamFlowPayload],
  );

  const runEdit = useCallback(
    async (instruction: string) => {
      setError(null);
      setIsEditing(true);
      try {
        const result = await withRetry(
          () =>
            editFlow({
              instruction,
              nodes: nodesRef.current,
              edges: edgesRef.current,
            }),
          { onRetry: () => setIsRetrying(true) },
        );
        // applyToolCalls validates first and throws on a malformed batch before
        // any state changes, so the graph is preserved on rejection.
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
      } catch (caughtError) {
        // A malformed batch is not worth a blind retry — the same instruction
        // would replan the same invalid calls. Ask the user to rephrase instead.
        const invalid = caughtError instanceof InvalidToolCallError;
        setError({
          scope: "edit",
          message: invalid
            ? `That edit was rejected: ${caughtError.message} Your flow was left unchanged.`
            : "That edit could not be applied. Your flow was left unchanged — try again.",
          retryable: !invalid,
        });
        appendChatMessage(
          "assistant",
          invalid
            ? `That edit was rejected: ${caughtError.message} Your flow was left unchanged.`
            : "That edit could not be applied. Your flow was left unchanged.",
        );
      } finally {
        setIsEditing(false);
        setIsRetrying(false);
      }
    },
    [appendChatMessage, applyToolCalls, frameView, logVersion, reply],
  );

  const submitInstruction = useCallback(
    async (instruction: string) => {
      // Synchronous lock: blocks a second edit/generate fired before the first
      // in-flight request resolves (React state updates lag the await window).
      if (mutationRef.current || isGenerating) return;
      mutationRef.current = true;
      try {
        setPrompt(instruction);
        lastInstructionRef.current = instruction;
        appendChatMessage("user", instruction);

        if (nodesRef.current.length === 0) {
          reply.reset();
          appendChatMessage(
            "system",
            "Generating flow - streaming screens onto canvas.",
          );
          await runGeneration(instruction);
          return;
        }

        await runEdit(instruction);
      } finally {
        mutationRef.current = false;
      }
    },
    [appendChatMessage, isGenerating, reply, runEdit, runGeneration],
  );

  const retryLastOperation = useCallback(() => {
    if (!error?.retryable || mutationRef.current) return;
    const instruction = lastInstructionRef.current;

    if (error.scope === "check") {
      setError(null);
      void runCompletenessCheckRef.current?.();
      return;
    }

    if (!instruction) return;
    setError(null);
    void (async () => {
      if (mutationRef.current || isGenerating) return;
      mutationRef.current = true;
      try {
        if (error.scope === "generate" && nodesRef.current.length === 0) {
          reply.reset();
          await runGeneration(instruction);
        } else {
          await runEdit(instruction);
        }
      } finally {
        mutationRef.current = false;
      }
    })();
  }, [error, isGenerating, reply, runEdit, runGeneration]);

  const dismissError = useCallback(() => setError(null), []);

  const runCompletenessCheck = useCallback(async () => {
    if (nodesRef.current.length === 0 || checkRef.current) return;
    checkRef.current = true;
    if (error?.scope === "check") setError(null);
    setIsChecking(true);
    appendChatMessage("system", "Running flow check against known app patterns.");

    try {
      const result = await withRetry(
        () => checkCompleteness({ nodes: nodesRef.current, edges: edgesRef.current }),
        { onRetry: () => setIsRetrying(true) },
      );
      setSuggestions(result.suggestions);
      appendChatMessage(
        "assistant",
        `${result.suggestions.length} possible flow gap${result.suggestions.length !== 1 ? "s" : ""} found.`,
      );
    } catch {
      setError({
        scope: "check",
        message:
          "The flow check did not complete. Your flow was left unchanged — try again.",
        retryable: true,
      });
      appendChatMessage(
        "assistant",
        "The flow check did not complete. Your flow was left unchanged.",
      );
    } finally {
      setIsChecking(false);
      setIsRetrying(false);
      checkRef.current = false;
    }
  }, [appendChatMessage, error?.scope]);

  // Forward reference so retryLastOperation (defined above) can re-run a check
  // without depending on runCompletenessCheck directly. Assigned in an effect —
  // mutating a ref during render is disallowed by react-hooks/refs.
  useEffect(() => {
    runCompletenessCheckRef.current = () => {
      void runCompletenessCheck();
    };
  }, [runCompletenessCheck]);

  /** Approvals reuse the same reducer path as any command-bar edit. */
  const approveSuggestion = useCallback(
    (suggestion: FlowSuggestion) => {
      if (isGenerating || mutationRef.current) return;
      const current = nodesRef.current;
      // Attach to the logical parent the check named; fall back to the last node
      // only when no anchor was resolved (e.g. an older suggestion without one).
      const anchor =
        (suggestion.anchorId &&
          current.find((node) => node.id === suggestion.anchorId)) ||
        current[current.length - 1];
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
          type: "addEdge",
          payload: { source: anchor.id, target: id },
        });
      }

      try {
        const snapshot = applyToolCalls(calls);
        logVersion(`Approved suggestion: ${suggestion.title}`, "suggestion", snapshot);
        appendChatMessage("assistant", `Approved suggestion: ${suggestion.title}.`);
        setSuggestions((items) =>
          items.filter((item) => item.id !== suggestion.id),
        );
        frameView();
      } catch (caughtError) {
        const reason =
          caughtError instanceof InvalidToolCallError
            ? caughtError.message
            : "the change was invalid.";
        setError({
          scope: "check",
          message: `That suggestion could not be applied: ${reason} Your flow was left unchanged.`,
          retryable: false,
        });
      }
    },
    [appendChatMessage, applyToolCalls, frameView, isGenerating, logVersion],
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
      if (!version?.snapshot || isGenerating || mutationRef.current) return false;

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
    if (isGenerating || mutationRef.current) return;
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
  }, [isGenerating, logVersion, screenToFlowPosition, setEdges, setNodes]);

  const deleteNode = useCallback(
    (id: string) => {
      if (isGenerating || mutationRef.current) return;
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
    [isGenerating, logVersion, setEdges, setNodes],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (isGenerating || mutationRef.current) return;
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
    [isGenerating, logVersion, setEdges],
  );

  const isBusy = isGenerating || isEditing || reply.isStreaming;

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
      isEditing,
      isRetrying,
      isBusy,
      error,
      retryLastOperation,
      dismissError,
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
      dismissError,
      edges,
      error,
      handleNodesChange,
      isBusy,
      isChecking,
      isEditing,
      isGenerating,
      isRetrying,
      nodes,
      onConnect,
      onEdgesChange,
      projectName,
      prompt,
      rejectSuggestion,
      reply.isStreaming,
      reply.text,
      restoreVersion,
      retryLastOperation,
      runCompletenessCheck,
      submitInstruction,
      suggestions,
      versions,
    ],
  );
}

export type FlowEngine = ReturnType<typeof useFlowEngine>;
