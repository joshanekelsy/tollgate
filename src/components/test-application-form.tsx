"use client";

import { FormEvent, useState } from "react";
import { trackProductEvent } from "../lib/analytics";
import { rememberMeter } from "../lib/meter-memory";

type MeterSetup = { ready: true; projectId: string; baseUrl: string; dashboardPath: string; dashboardUrl: string; accessCode: string; writeKeys: { test: string; live: string } };

export function meterSetupText(setup: MeterSetup) {
  return [
    "Tollgate meter setup",
    "",
    `Legacy OpenAI base URL: ${setup.baseUrl}`,
    "Connected providers: OpenAI, Anthropic, Gemini, OpenRouter",
    "Calls: non-streaming OpenAI/OpenRouter Chat Completions, Anthropic Messages, or Gemini GenerateContent",
    "Models: safe model IDs accepted inside those four request formats",
    `Test write key: ${setup.writeKeys.test}`,
    `Live write key: ${setup.writeKeys.live}`,
    "Required request headers:",
    "  x-tollgate-key: use the matching test or live write key",
    "  x-tollgate-idempotency-key: one stable retry ID per request",
    "Privacy mode: private metadata",
    "Optional trace headers:",
    "  x-tollgate-customer: customer-acme",
    "  x-tollgate-task-id: proposal-update",
    "  x-tollgate-session-id: session-42",
    "  x-tollgate-agent: cursor",
    "",
    `Dashboard: ${setup.dashboardUrl}`,
    `Dashboard access code: ${setup.accessCode}`,
    "",
    "Keep your provider API key on your machine. Tollgate does not store it.",
  ].join("\n");
}

export function TestApplicationForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [setup, setSetup] = useState<MeterSetup | null>(null);
  const [copied, setCopied] = useState(false);
  const [opening, setOpening] = useState(false);

  async function copySetup(current: MeterSetup) {
    try {
      await navigator.clipboard.writeText(meterSetupText(current));
      setCopied(true);
    } catch {
      setError("Copy was blocked by the browser. Download the setup file instead.");
    }
  }

  function downloadSetup(current: MeterSetup) {
    const url = URL.createObjectURL(new Blob([meterSetupText(current)], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `tollgate-${current.projectId}-setup.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    trackProductEvent("meter_creation_started", { surface: "landing" });
    setStatus("submitting");
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const source = new URLSearchParams(window.location.search).get("source") ?? "other";
    try {
      const response = await fetch("/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), provider: "openai", source }),
      });
      if (!response.ok) throw new Error("not_recorded");
      const result = (await response.json()) as { ready?: boolean } & Partial<MeterSetup>;
      if (result.ready && result.projectId && result.baseUrl && result.dashboardPath && result.dashboardUrl && result.accessCode && result.writeKeys?.test && result.writeKeys?.live) {
        setSetup(result as MeterSetup);
        rememberMeter({ projectId: result.projectId, name: `${String(data.get("email")).split("@")[0]}'s meter` });
        trackProductEvent("meter_created", { outcome: "success", surface: "landing" });
      }
      setStatus("success");
      form.reset();
    } catch {
      trackProductEvent("meter_creation_failed", { outcome: "error", surface: "landing" });
      setError("That did not go through. Please try again—your form has not been recorded.");
      setStatus("error");
    }
  }

  async function openMeter(current: MeterSetup) {
    setOpening(true); setError("");
    const response = await fetch(`/p/${encodeURIComponent(current.projectId)}/dashboard/unlock`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: current.accessCode }),
    });
    if (!response.ok) { setOpening(false); setError("The meter was created, but it could not be opened. Save the code and try the dashboard link."); return; }
    trackProductEvent("setup_opened", { outcome: "success", surface: "landing" });
    window.location.assign(current.dashboardPath);
  }

  if (status === "success") {
    if (setup) return <div className="form-card setup-card" role="status">
      <p className="form-kicker">Meter created</p><h3>Save these three secrets.</h3>
      <p className="setup-intro">The recovery code reopens your meter. The test and live write keys protect incoming usage. Tollgate cannot show any of them again.</p>
      <div className="access-code"><span>Recovery code / shown once</span><code>{setup.accessCode}</code></div>
      <div className="one-time-keys"><div><span>Test write key</span><code>{setup.writeKeys.test}</code></div><div><span>Live write key</span><code>{setup.writeKeys.live}</code></div></div>
      <button className="open-meter tap-target" type="button" disabled={opening} onClick={() => openMeter(setup)}>{opening ? "Opening setup…" : "Continue to setup"}</button>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="setup-actions">
        <button className="tap-target" type="button" onClick={() => copySetup(setup)}>{copied ? "Setup details copied" : "Copy setup details"}</button>
        <button className="tap-target" type="button" onClick={() => downloadSetup(setup)}>Download setup.txt</button>
      </div>
      <small>Save these values now. Tollgate stores only key fingerprints and cannot show the full write keys again.</small>
    </div>;
    return <div className="form-card form-success" role="status"><span className="success-mark">✓</span><p className="form-kicker">Request received</p><h3>You&apos;re on the provider list.</h3><p>That provider is not connected yet. Your request has been recorded.</p></div>;
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <p className="form-kicker">Create your private meter</p>
      <label><span>Work email</span><input name="email" type="email" autoComplete="email" required placeholder="you@company.com" /></label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="tap-target" type="submit" disabled={status === "submitting"}><span>{status === "submitting" ? "Creating meter…" : "Create my meter"}</span><i>↗</i></button>
      <small>No password. No API key yet. Your multi-provider meter is created immediately.</small>
    </form>
  );
}
