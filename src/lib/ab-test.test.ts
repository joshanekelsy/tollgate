import { describe, expect, it } from "vitest";
import { friendlyProviderError, readAssistantText, SAMPLE_COMPARISON_RESULTS, SAMPLE_COMPARISON_TASK } from "./ab-test";

describe("readAssistantText", () => {
  it("reads a chat completion", () => expect(readAssistantText({ choices: [{ message: { content: "answer" } }] })).toBe("answer"));
  it("rejects missing or non-text output", () => {
    expect(readAssistantText({ choices: [] })).toBeNull();
    expect(readAssistantText({ choices: [{ message: { content: null } }] })).toBeNull();
  });
});

describe("sample comparison", () => {
  it("contains two labelled measured results without live call IDs", () => {
    expect(SAMPLE_COMPARISON_RESULTS).toHaveLength(2);
    expect(SAMPLE_COMPARISON_RESULTS.every((result) => result.callId === null)).toBe(true);
    expect(SAMPLE_COMPARISON_RESULTS.every((result) => result.cost > 0 && result.latencyMs > 0)).toBe(true);
    expect(SAMPLE_COMPARISON_TASK).toContain("25 words or fewer");
    expect(SAMPLE_COMPARISON_RESULTS.every((result) => result.instructionCompliant)).toBe(true);
  });
});

describe("friendlyProviderError", () => {
  it("replaces an invalid-key payload without exposing the provider JSON or key fragment", () => {
    const body = { error: { message: "Incorrect API key provided: sk-inval…", code: "invalid_api_key" } };
    const message = friendlyProviderError(401, body);
    expect(message).toBe("That key was rejected by OpenAI. Check it starts with sk- and has not been revoked.");
    expect(message).not.toContain("sk-inval");
    expect(message).not.toContain("invalid_api_key");
  });

  it("uses a safe generic message for other provider failures", () => {
    expect(friendlyProviderError(500, { error: { message: "private upstream detail" } })).toBe("OpenAI could not complete that comparison. Try again in a moment.");
  });
});
