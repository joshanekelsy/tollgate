import type { CostStatus, ProviderId } from "../types";

export type JsonObject = Record<string, unknown>;

export type MatchedProviderPath = {
  modelFromPath?: string;
};

export type ProviderUsage = {
  promptTokens: number | null;
  cachedPromptTokens: number;
  completionTokens: number | null;
};

export type ProviderCost = {
  costStatus: CostStatus;
  providerCostUsd?: number;
  estimatedCostUsd?: number;
  sameTokenEstimateUsd?: number;
};

export type ProviderResponseMetadata = ProviderUsage & {
  providerRequestId?: string;
  reportedModel?: string;
  toolNames?: string[];
  toolCallCount: number;
  reportedCostUsd?: number;
};

export type PreparedProviderRequest = {
  url: string;
  headers: Headers;
  body: JsonObject;
};

export type ProviderAdapter = {
  id: ProviderId;
  label: string;
  matchPath: (path: string[]) => MatchedProviderPath | null;
  credentialHeaders: (request: Request) => Headers | null;
  requestModel: (body: JsonObject, matched: MatchedProviderPath) => unknown;
  isStreaming: (body: JsonObject) => boolean;
  prepareRequest: (body: JsonObject, matched: MatchedProviderPath, model: string, headers: Headers) => PreparedProviderRequest;
  parseResponse: (parsed: JsonObject | null, headers: Headers) => ProviderResponseMetadata;
  cost: (body: JsonObject, model: string, metadata: ProviderResponseMetadata) => ProviderCost;
};
