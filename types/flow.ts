import type { Node } from '@xyflow/react';

export type ScreenCategory = 'core' | 'commerce' | 'auth';

export type ScreenNodeData = {
  label: string;
  screenId: string;
  category: ScreenCategory;
};

export type ScreenNodeType = Node<ScreenNodeData, 'screen'>;

export type CategoryMeta = {
  label: string;
  /** CSS custom property holding the flat category color. */
  colorVar: string;
};

export const categoryMeta: Record<ScreenCategory, CategoryMeta> = {
  core: { label: 'core', colorVar: 'var(--cat-core)' },
  commerce: { label: 'commerce', colorVar: 'var(--cat-commerce)' },
  auth: { label: 'auth', colorVar: 'var(--cat-auth)' }
};

/** Tool-call shape a real model response would be mapped into. */
export type FlowToolCall =
{
  type: 'addNode';
  payload: {
    id: string;
    label: string;
    screenId: string;
    category: ScreenCategory;
    position: {x: number;y: number;};
  };
} |
{
  type: 'connect';
  payload: {source: string;target: string;};
} |
{
  type: 'renameNode';
  payload: {id: string;label: string;};
};

export type FlowVersion = {
  id: string;
  label: string;
  summary: string;
  timestamp: string;
  source: 'chat' | 'manual' | 'suggestion';
};