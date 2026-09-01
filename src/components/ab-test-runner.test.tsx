// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ABTestRunner } from "./ab-test-runner";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("ABTestRunner keyless sample", () => {
  it("shows the complete sample before asking for a key", () => {
    render(<ABTestRunner projectId="meter-test" taskId="first-comparison" onRecorded={vi.fn()} startWithSample />);

    expect(screen.getByText("Keyless sample · pre-run evidence")).toBeTruthy();
    expect(screen.getByText("GPT-5.4 Mini")).toBeTruthy();
    expect(screen.getByText("GPT-5.4 nano")).toBeTruthy();
    expect(screen.getByText("Rewrite a delayed-launch update for an executive in 25 words or fewer.")).toBeTruthy();
    expect(screen.getAllByText("Follows the instruction")).toHaveLength(2);
    expect(screen.getAllByText("Yes")).toHaveLength(2);
    expect(screen.queryByLabelText("OpenAI API key")).toBeNull();

    fireEvent.click(screen.getAllByRole("button", { name: "Choose this result" })[1]);
    expect(screen.getByText(/recorded as the better result/i)).toBeTruthy();
    expect(screen.queryByLabelText("OpenAI API key")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Run with your own task/i }));
    expect(screen.getByLabelText(/OpenAI API key/i)).toBeTruthy();
    const keyLink = screen.getByRole("link", { name: "project-scoped key" });
    expect(keyLink.getAttribute("href")).toBe("https://platform.openai.com/api-keys");
    expect(keyLink.getAttribute("target")).toBe("_blank");
    expect(keyLink.getAttribute("rel")).toBe("noopener");
  });

  it("shows one safe message when both OpenAI calls reject the key", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: "Incorrect API key provided: sk-invalid", code: "invalid_api_key" } }), { status: 401, headers: { "content-type": "application/json" } })));
    render(<ABTestRunner projectId="meter-test" taskId="first-comparison" onRecorded={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/OpenAI API key/i), { target: { value: "sk-invalid" } });
    fireEvent.change(screen.getByLabelText("Representative task"), { target: { value: "Summarise this status update." } });
    fireEvent.click(screen.getByRole("button", { name: "Run comparison" }));

    const errors = await screen.findAllByText("That key was rejected by OpenAI. Check it starts with sk- and has not been revoked.");
    expect(errors).toHaveLength(1);
    expect(document.body.textContent).not.toContain("sk-invalid");
    expect(document.body.textContent).not.toContain("invalid_api_key");
  });
});
