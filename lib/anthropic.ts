import Anthropic from "@anthropic-ai/sdk";

// Server-only. Never import this from a Client Component.

// Default to the most capable model; override with ANTHROPIC_MODEL
// (e.g. claude-sonnet-4-6 / claude-haiku-4-5 for lower latency + cost).
export const TUTOR_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8";

export const isAnthropicConfigured = Boolean(process.env.ANTHROPIC_API_KEY);

let client: Anthropic | null = null;

/** Lazily-constructed singleton Anthropic client (reads ANTHROPIC_API_KEY). */
export function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

export { Anthropic };
