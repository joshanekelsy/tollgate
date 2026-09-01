import type { JsonObject } from "./types";

export const SAFE_MODEL_ID = /^[A-Za-z0-9][A-Za-z0-9._:/@-]{0,199}$/;
export const SAFE_PRIVATE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/;

export function isSafeModelId(value: unknown): value is string {
  return typeof value === "string" && SAFE_MODEL_ID.test(value);
}

export function safeInteger(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

export function safeCost(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

export function safeObject(value: unknown): JsonObject | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : null;
}

export function bearerHeaders(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ") || authorization.length <= 7) return null;
  return new Headers({ authorization, "content-type": "application/json" });
}

export function apiKeyHeaders(request: Request, sourceName: string, destinationName = sourceName) {
  const key = request.headers.get(sourceName)?.trim();
  if (!key) return null;
  return new Headers({ [destinationName]: key, "content-type": "application/json" });
}

export function safeToolSummary(names: unknown[]) {
  const toolNames: string[] = [];
  for (const name of names) {
    if (typeof name === "string" && SAFE_PRIVATE_ID.test(name) && !toolNames.includes(name)) toolNames.push(name);
  }
  return { toolNames: toolNames.length ? toolNames : undefined, toolCallCount: names.length };
}
