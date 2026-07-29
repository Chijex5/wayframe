import { defaultEdgeOptions, generationPayload } from "./flowPayload";
import type { ScreenNodeType } from "../types/flow";
import type { Edge } from "@xyflow/react";

export type MockProject = {
  id: string;
  name: string;
  updatedAt: string;
  nodes: ScreenNodeType[];
  edges: Edge[];
};

const mockEdges: Edge[] = generationPayload.edges.map((edge) => ({
  ...edge,
  ...defaultEdgeOptions,
}));

export const mockProjects: MockProject[] = [
  {
    id: "commerce-flow",
    name: "E-commerce Flow",
    updatedAt: "Today 09:42",
    nodes: generationPayload.nodes,
    edges: mockEdges,
  },
  {
    id: "onboarding-flow",
    name: "Onboarding Flow",
    updatedAt: "Yesterday 16:18",
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
  },
  {
    id: "saas-dashboard",
    name: "SaaS Dashboard Flow",
    updatedAt: "Jul 27 11:05",
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
  },
];

export function getMockProject(id: string): MockProject | null {
  return mockProjects.find((project) => project.id === id) ?? null;
}
