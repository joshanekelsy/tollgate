import type { SupportedModel } from "./types";

export type ComparisonResult = {
  model: SupportedModel;
  callId: string | null;
  output: string;
  cost: number;
  latencyMs: number;
  instructionCompliant: boolean;
};

export const SAMPLE_COMPARISON_TASK = "Rewrite a delayed-launch update for an executive in 25 words or fewer.";

export const SAMPLE_COMPARISON_RESULTS: readonly ComparisonResult[] = [
  {
    model: "gpt-5.4-mini",
    callId: null,
    output: "Launch delayed two days due to a data export validation failure. Teams are resolving it now; the revised date follows after validation.",
    cost: 0.0001545,
    latencyMs: 1434,
    instructionCompliant: true,
  },
  {
    model: "gpt-5.4-nano",
    callId: null,
    output: "Launch was delayed two days due to failed data export validation. The team is fixing it and will confirm the revised date shortly.",
    cost: 0.00004005,
    latencyMs: 794,
    instructionCompliant: true,
  },
] as const;

export function friendlyProviderError(status: number, body: unknown) {
  const error = body && typeof body === "object" && "error" in body
    ? (body as { error?: unknown }).error
    : null;
  const code = error && typeof error === "object" && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  const message = error && typeof error === "object" && "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
  if (status === 401 || code === "invalid_api_key" || /incorrect api key|invalid api key/i.test(message)) {
    return "That key was rejected by OpenAI. Check it starts with sk- and has not been revoked.";
  }
  if (status === 429) return "OpenAI rejected the calls because this key has no available quota. Check its usage limit and try again.";
  return "OpenAI could not complete that comparison. Try again in a moment.";
}

export function readAssistantText(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const choices = (body as Record<string, unknown>).choices;
  if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== "object") return null;
  const message = (choices[0] as Record<string, unknown>).message;
  if (!message || typeof message !== "object") return null;
  const content = (message as Record<string, unknown>).content;
  return typeof content === "string" && content.trim() ? content : null;
}
