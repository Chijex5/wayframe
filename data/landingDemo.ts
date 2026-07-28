import type { StageEdge, StageNode } from '../components/landing/DiagramStage';

export const demoPrompt =
'A marketplace app with sign-in, browsing, a cart and checkout';

export const stageNodes: StageNode[] = [
{
  id: 'signin',
  label: 'Sign In',
  screenId: 'scr_signin',
  x: 8,
  y: 126,
  color: 'var(--cat-auth)'
},
{
  id: 'onboarding',
  label: 'Onboarding',
  screenId: 'scr_onboarding',
  x: 194,
  y: 126,
  color: 'var(--cat-auth)'
},
{
  id: 'home',
  label: 'Home Feed',
  screenId: 'scr_home',
  x: 380,
  y: 126,
  color: 'var(--cat-core)'
},
{
  id: 'detail',
  label: 'Item Detail',
  screenId: 'scr_detail',
  x: 566,
  y: 42,
  color: 'var(--cat-core)'
},
{
  id: 'cart',
  label: 'Cart',
  screenId: 'scr_cart',
  x: 566,
  y: 210,
  color: 'var(--cat-commerce)'
},
{
  id: 'shipping',
  label: 'Shipping',
  screenId: 'scr_shipping',
  x: 752,
  y: 210,
  color: 'var(--cat-commerce)',
  accent: true
}];


export const stageEdges: StageEdge[] = [
{ id: 'e1', from: 'signin', to: 'onboarding', d: 'M 158 150 H 194' },
{ id: 'e2', from: 'onboarding', to: 'home', d: 'M 344 150 H 380' },
{ id: 'e3', from: 'home', to: 'detail', d: 'M 530 150 H 548 V 66 H 566' },
{ id: 'e4', from: 'home', to: 'cart', d: 'M 530 150 H 548 V 234 H 566' },
{ id: 'e5', from: 'cart', to: 'shipping', d: 'M 716 234 H 752' }];


export type ShowcaseStep = {
  index: string;
  title: string;
  body: string;
  visibleCount: number;
  footer: string;
  mode: 'prompt' | 'command' | 'suggestion';
};

export const showcaseSteps: ShowcaseStep[] = [
{
  index: '01',
  title: 'Describe',
  body: 'One sentence in plain English. Wayframe resolves it into discrete screens and the navigation between them, then streams each node onto the canvas as it is produced.',
  visibleCount: 3,
  footer: '3 nodes · 2 edges · generating',
  mode: 'prompt'
},
{
  index: '02',
  title: 'Edit',
  body: 'Type an instruction or edit directly on the canvas. Every change resolves to a structured call — addNode, connect, renameNode — and lands in the version log with its source attached.',
  visibleCount: 5,
  footer: '5 nodes · 4 edges · v0.3',
  mode: 'command'
},
{
  index: '03',
  title: 'Check',
  body: 'Compare the flow against patterns from comparable products. Gaps come back as individual cards with a rationale; approving one applies through the same edit path as any typed instruction.',
  visibleCount: 6,
  footer: '6 nodes · 5 edges · v0.4',
  mode: 'suggestion'
}];