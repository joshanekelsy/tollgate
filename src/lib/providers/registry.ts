import type { ProviderId } from "../types";
import { anthropicAdapter } from "./anthropic";
import { geminiAdapter } from "./gemini";
import { openaiAdapter } from "./openai";
import { openrouterAdapter } from "./openrouter";
import type { ProviderAdapter } from "./types";

export const PROVIDER_ADAPTERS: Record<ProviderId, ProviderAdapter> = {
  openai: openaiAdapter,
  anthropic: anthropicAdapter,
  gemini: geminiAdapter,
  openrouter: openrouterAdapter,
};

export function getProviderAdapter(value: string) {
  return Object.hasOwn(PROVIDER_ADAPTERS, value) ? PROVIDER_ADAPTERS[value as ProviderId] : null;
}
