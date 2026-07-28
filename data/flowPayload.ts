import { MarkerType } from '@xyflow/react';
import type { FlowToolCall, ScreenNodeType } from '../types/flow';

export const defaultEdgeOptions = {
  type: 'editable',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 14,
    height: 14
  }
} as const;

export type GeneratedEdge = {id: string;source: string;target: string;};

export type GenerationPayload = {
  nodes: ScreenNodeType[];
  edges: GeneratedEdge[];
};

/**
 * Canned first-generation payload. Shaped exactly like the object a streaming
 * model response (e.g. streamObject) would produce, so the streaming reveal
 * logic can be pointed at a live source without changing anything downstream.
 */
export const generationPayload: GenerationPayload = {
  nodes: [
  {
    id: 'signin',
    type: 'screen',
    position: { x: 0, y: 130 },
    data: { label: 'Sign In', screenId: 'scr_signin', category: 'auth' }
  },
  {
    id: 'onboarding',
    type: 'screen',
    position: { x: 250, y: 130 },
    data: { label: 'Onboarding', screenId: 'scr_onboarding', category: 'auth' }
  },
  {
    id: 'home',
    type: 'screen',
    position: { x: 500, y: 130 },
    data: { label: 'Home Feed', screenId: 'scr_home', category: 'core' }
  },
  {
    id: 'detail',
    type: 'screen',
    position: { x: 750, y: 40 },
    data: { label: 'Item Detail', screenId: 'scr_detail', category: 'core' }
  },
  {
    id: 'cart',
    type: 'screen',
    position: { x: 750, y: 220 },
    data: { label: 'Cart', screenId: 'scr_cart', category: 'commerce' }
  },
  {
    id: 'checkout',
    type: 'screen',
    position: { x: 1000, y: 220 },
    data: { label: 'Checkout', screenId: 'scr_checkout', category: 'commerce' }
  }],

  edges: [
  { id: 'e-signin-onboarding', source: 'signin', target: 'onboarding' },
  { id: 'e-onboarding-home', source: 'onboarding', target: 'home' },
  { id: 'e-home-detail', source: 'home', target: 'detail' },
  { id: 'e-detail-cart', source: 'detail', target: 'cart' },
  { id: 'e-cart-checkout', source: 'cart', target: 'checkout' }]

};

const mockAdditions: Array<{
  label: string;
  screenId: string;
  category: ScreenNodeType['data']['category'];
}> = [
{ label: 'Payment', screenId: 'scr_payment', category: 'commerce' },
{ label: 'Order Confirmation', screenId: 'scr_order_confirm', category: 'commerce' },
{ label: 'Profile', screenId: 'scr_profile', category: 'core' },
{ label: 'Notifications', screenId: 'scr_notifications', category: 'core' }];


/**
 * Mock "planner": stands in for the model turning an instruction into tool
 * calls. Ignores the instruction text and always appends one node connected to
 * the most recently added node.
 */
export function planToolCalls(
_instruction: string,
nodes: ScreenNodeType[])
: FlowToolCall[] {
  const addition = mockAdditions[nodes.length % mockAdditions.length];
  const anchor = nodes[nodes.length - 1];
  const id = `${addition.screenId}_${nodes.length + 1}`;

  const calls: FlowToolCall[] = [
  {
    type: 'addNode',
    payload: {
      id,
      label: addition.label,
      screenId: addition.screenId,
      category: addition.category,
      position: anchor ?
      { x: anchor.position.x + 250, y: anchor.position.y + 90 } :
      { x: 0, y: 0 }
    }
  }];


  if (anchor) {
    calls.push({ type: 'connect', payload: { source: anchor.id, target: id } });
  }

  return calls;
}

export function describeToolCall(
call: FlowToolCall,
nodes: ScreenNodeType[])
: string {
  switch (call.type) {
    case 'addNode':
      return `Added ${call.payload.label} node`;
    case 'connect':{
        const source = nodes.find((node) => node.id === call.payload.source);
        const target = nodes.find((node) => node.id === call.payload.target);
        return `Connected ${source?.data.label ?? call.payload.source} → ${
        target?.data.label ?? call.payload.target}`;

      }
    case 'renameNode':
      return `Renamed node to ${call.payload.label}`;
    default:
      return 'Applied change';
  }
}