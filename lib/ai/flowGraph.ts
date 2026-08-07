// lib/ai/flowGraph.ts
//
// Pure contract + builder for AI flow generation. No `ai`/model imports live
// here on purpose: this file type-checks and can be reasoned about without the
// provider SDK. `generateFlowGraph.ts` calls Gemini with `generatedGraphSchema`
// and hands the validated object to `buildFlowResult`.
//
// Design: the model produces SEMANTICS ONLY (screens + connections + category),
// never pixel coordinates — model-chosen positions are unreliable and would
// overlap. The server owns layout (a layered left-to-right graph), mirroring the
// fixed positions the mock payload shipped, so downstream reveal/frameView code
// is unchanged.

import { z } from "zod";
import type { FlowEdgeSeed, FlowNode, GenerateFlowResult } from "@/lib/api/types";
import { deriveProjectName } from "@/lib/flow/deriveProjectName";

/** The three categories the canvas can render (see types/flow.ts categoryMeta). */
export const SCREEN_CATEGORIES = ["core", "commerce", "auth"] as const;

const screenSchema = z.object({
  id: z
    .string()
    .min(1)
    .describe("Unique kebab-case id for the screen, e.g. 'sign-in'. Referenced by connections."),
  label: z
    .string()
    .min(1)
    .describe("Human-facing screen name, e.g. 'Sign In'."),
  category: z
    .enum(SCREEN_CATEGORIES)
    .describe(
      "core = primary product screens (home, detail, profile); commerce = cart, checkout, payment, orders; auth = sign in, onboarding, account.",
    ),
});

const connectionSchema = z.object({
  source: z.string().min(1).describe("id of the screen the navigation starts from."),
  target: z.string().min(1).describe("id of the screen the navigation leads to."),
});

/** Structured output shape Gemini must return (validated by the provider). */
export const generatedGraphSchema = z.object({
  projectName: z
    .string()
    .min(1)
    .describe("Short human-facing name for the overall flow, e.g. 'E-commerce Flow'."),
  screens: z.array(screenSchema).min(1).max(24),
  connections: z.array(connectionSchema).max(64),
});

export type GeneratedGraph = z.infer<typeof generatedGraphSchema>;

// Layered layout constants. X advances one column per BFS depth; Y stacks
// same-depth screens. Tuned to the spacing the mock payload used (~250 / ~140).
const X_STEP = 260;
const Y_STEP = 140;

/** scr_* screenId from a kebab/free-form id, matching the mock convention. */
function toScreenId(id: string): string {
  const slug = id
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `scr_${slug || "screen"}`;
}

/**
 * Assigns each screen a depth (BFS distance from a root) and a within-depth
 * slot, then converts (depth, slot) to canvas coordinates. Roots = screens with
 * no incoming edge; if the graph is fully cyclic, the first screen seeds level 0.
 */
function layout(
  ids: string[],
  edges: Array<{ source: string; target: string }>,
): Map<string, { x: number; y: number }> {
  const outgoing = new Map<string, string[]>();
  const indegree = new Map<string, number>();
  for (const id of ids) {
    outgoing.set(id, []);
    indegree.set(id, 0);
  }
  for (const { source, target } of edges) {
    outgoing.get(source)!.push(target);
    indegree.set(target, (indegree.get(target) ?? 0) + 1);
  }

  const roots = ids.filter((id) => (indegree.get(id) ?? 0) === 0);
  const seeds = roots.length > 0 ? roots : ids.slice(0, 1);

  const depth = new Map<string, number>();
  const queue: string[] = [];
  for (const id of seeds) {
    depth.set(id, 0);
    queue.push(id);
  }
  while (queue.length > 0) {
    const id = queue.shift()!;
    const d = depth.get(id)!;
    for (const next of outgoing.get(id) ?? []) {
      if (!depth.has(next) || depth.get(next)! < d + 1) {
        depth.set(next, d + 1);
        queue.push(next);
      }
    }
  }

  // Disconnected screens (never reached) land in a trailing column.
  const maxDepth = ids.reduce((m, id) => Math.max(m, depth.get(id) ?? 0), 0);
  const slotByDepth = new Map<number, number>();
  const position = new Map<string, { x: number; y: number }>();
  for (const id of ids) {
    const d = depth.has(id) ? depth.get(id)! : maxDepth + 1;
    const slot = slotByDepth.get(d) ?? 0;
    slotByDepth.set(d, slot + 1);
    position.set(id, { x: d * X_STEP, y: slot * Y_STEP });
  }
  return position;
}

/**
 * Validated model output → the exact GenerateFlowResult the client contract
 * expects. Dedupes screens by id, drops connections referencing unknown ids or
 * self-loops, computes positions, and derives a project name if the model's is
 * empty. Never throws on model sloppiness — it sanitizes instead.
 */
export function buildFlowResult(
  graph: GeneratedGraph,
  description: string,
): GenerateFlowResult {
  const seen = new Set<string>();
  const screens = graph.screens.filter((screen) => {
    if (seen.has(screen.id)) return false;
    seen.add(screen.id);
    return true;
  });
  const ids = screens.map((screen) => screen.id);
  const idSet = new Set(ids);

  const edgeSeen = new Set<string>();
  const connections = graph.connections.filter(({ source, target }) => {
    if (source === target) return false;
    if (!idSet.has(source) || !idSet.has(target)) return false;
    const key = `${source}->${target}`;
    if (edgeSeen.has(key)) return false;
    edgeSeen.add(key);
    return true;
  });

  const position = layout(ids, connections);

  const nodes: FlowNode[] = screens.map((screen) => ({
    id: screen.id,
    type: "screen",
    position: position.get(screen.id) ?? { x: 0, y: 0 },
    data: {
      label: screen.label,
      screenId: toScreenId(screen.id),
      category: screen.category,
    },
  }));

  const edges: FlowEdgeSeed[] = connections.map(({ source, target }) => ({
    id: `e-${source}-${target}`,
    source,
    target,
  }));

  const projectName = graph.projectName.trim() || deriveProjectName(description);

  return { projectName, nodes, edges };
}
