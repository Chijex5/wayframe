// lib/ai/generateFlowGraph.ts
//
// The single point where Wayframe talks to Gemini for flow generation. Isolated
// so the model API is a one-file concern: everything else (route, client, UI)
// depends on `GenerateFlowResult`, not on the SDK.
//
// `server-only` guarantees the SDK — and the API key it reads — can never be
// pulled into a client bundle.
//
// AI SDK note: `generateObject` is the structured-output primitive used here.
// AI SDK v6 marks it deprecated in favor of `generateText({ output: Output.json(schema) })`;
// migrating is a change to this one function and nothing else. Kept on
// generateObject deliberately — it is stable and unambiguous across v5/v6.

import "server-only";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { env } from "@/lib/env";
import type { GenerateFlowResult } from "@/lib/api/types";
import { buildFlowResult, generatedGraphSchema } from "./flowGraph";

// Gemini free-tier flash model — fast, structured-output capable (PRD §4).
const GEMINI_MODEL = "gemini-3.1-flash-lite";

const 
SYSTEM_PROMPT = `You map a plain-English app description into a screen-navigation flow.

Rules:
- Return a realistic set of app SCREENS (typically 5-12) and the navigation CONNECTIONS between them.
- Each screen has a unique kebab-case id (e.g. "sign-in"), a short human label (e.g. "Sign In"), and a category.
- Categories: "auth" for sign in / onboarding / account screens; "commerce" for cart, checkout, payment, order screens; "core" for the main product screens (home, feed, detail, profile, search, settings).
- Begin the flow at a sensible entry screen (a landing, sign in, or home screen) and connect screens the way a user actually moves through the product. Every screen should be reachable.
- Do not invent commerce screens for an app that has no commerce. Only use the categories the description implies.
- Do NOT include positions or coordinates — only screens and connections. Layout is handled downstream.`;

/**
 * Generates a flow graph from a description via Gemini structured output, then
 * maps the validated model object into the client GenerateFlowResult contract.
 * Throws on model/transport failure — the route classifies retryable cases.
 */
export async function generateFlowGraph(
  description: string,
): Promise<GenerateFlowResult> {
  // Read the key request-time (env.GOOGLE_API_KEY is a throwing getter), not at
  // module load, so build-time route collection never requires the secret.
  const google = createGoogleGenerativeAI({ apiKey: env.GOOGLE_API_KEY });

  const { object } = await generateObject({
    model: google(GEMINI_MODEL),
    schema: generatedGraphSchema,
    schemaName: "AppFlow",
    schemaDescription: "A screen-navigation flow for the described app.",
    system: SYSTEM_PROMPT,
    prompt: description,
  });

  return buildFlowResult(object, description);
}
