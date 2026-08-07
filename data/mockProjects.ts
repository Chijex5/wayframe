import { defaultEdgeOptions, generationPayload } from "./flowPayload";
import type { ScreenNodeType } from "../types/flow";
import type { Edge } from "@xyflow/react";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  createdAt: string;
};

export type MockProject = {
  id: string;
  name: string;
  updatedAt: string;
  nodes: ScreenNodeType[];
  edges: Edge[];
  chatMessages: ChatMessage[];
};

const mockEdges: Edge[] = generationPayload.edges.map((edge) => ({
  ...edge,
  ...defaultEdgeOptions,
}));

export const mockProjects: MockProject[] = [
  {
    id: "commerce-flow",
    name: "E-commerce Flow",
    updatedAt: "2026-07-29T08:42:00Z",
    nodes: generationPayload.nodes,
    edges: mockEdges,
    chatMessages: [],
  },
  {
    id: "onboarding-flow",
    name: "Onboarding Flow",
    updatedAt: "2026-07-28T16:11:09Z",
    nodes: generationPayload.nodes.map((node, index) => ({
      ...node,
      id: `${node.id}-onboarding`,
      position: { x: node.position.x, y: node.position.y + (index % 2) * 36 },
    })),
    edges: mockEdges.map((edge) => ({
      ...edge,
      id: `${edge.id}-onboarding`,
      source: `${edge.source}-onboarding`,
      target: `${edge.target}-onboarding`,
    })),
    chatMessages: [],
  },
  {
    id: "saas-dashboard",
    name: "SaaS Dashboard Flow",
    updatedAt: "2026-07-27T11:05:00Z",
    nodes: generationPayload.nodes.map((node, index) => ({
      ...node,
      id: `${node.id}-saas`,
      position: { x: node.position.x, y: node.position.y - (index % 3) * 28 },
    })),
    edges: mockEdges.map((edge) => ({
      ...edge,
      id: `${edge.id}-saas`,
      source: `${edge.source}-saas`,
      target: `${edge.target}-saas`,
    })),
    chatMessages: [],
  },
];

export function getMockProject(id: string): MockProject | null {
  return mockProjects.find((project) => project.id === id) ?? null;
}
