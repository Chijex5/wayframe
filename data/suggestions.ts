import type { ScreenCategory } from '../types/flow';

export type FlowSuggestion = {
  id: string;
  title: string;
  rationale: string;
  screenId: string;
  category: ScreenCategory;
};

/** Hardcoded completeness-check results — stands in for pattern retrieval. */
export const mockSuggestions: FlowSuggestion[] = [
{
  id: 'sug_shipping',
  title: 'Add Shipping Address',
  rationale:
  'Flows in this category typically include a shipping step between Cart and Checkout.',
  screenId: 'scr_shipping',
  category: 'commerce'
},
{
  id: 'sug_password_reset',
  title: 'Add Password Reset',
  rationale:
  'Sign-in screens almost always pair with a recovery path for locked-out users.',
  screenId: 'scr_password_reset',
  category: 'auth'
},
{
  id: 'sug_empty_state',
  title: 'Add Empty Search Results',
  rationale:
  'Browse-driven apps need a defined state for when a query returns nothing.',
  screenId: 'scr_search_empty',
  category: 'core'
}];