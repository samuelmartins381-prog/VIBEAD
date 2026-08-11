import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getServerEnv } from "@/lib/env";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (client) return client;
  const { ANTHROPIC_API_KEY } = getServerEnv();
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  return client;
}
