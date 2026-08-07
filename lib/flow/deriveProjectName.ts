// lib/flow/deriveProjectName.ts
//
// Derives a human-facing project name from a plain-English description.
// Extracted from useFlowEngine so both the mock flow service and (later) the
// server-side generation route can name a flow the same way. Pure, no React.

const CATEGORY_RULES: Array<{ pattern: RegExp; name: string }> = [
  {
    pattern: /\b(e-?commerce|shop|store|cart|checkout|product)\b/,
    name: "E-commerce Flow",
  },
  {
    pattern: /\b(saas|dashboard|analytics|admin|report)\b/,
    name: "SaaS Dashboard Flow",
  },
  {
    pattern: /\b(sign in|login|auth|onboarding|account)\b/,
    name: "Onboarding Flow",
  },
];

const STOP_WORDS = new Set([
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

export function deriveProjectName(description: string): string {
  const text = description.toLowerCase();

  for (const { pattern, name } of CATEGORY_RULES) {
    if (pattern.test(text)) return name;
  }

  const words = description
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word.toLowerCase()))
    .slice(0, 3);

  if (words.length === 0) return "Generated Flow";

  return `${words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")} Flow`;
}
