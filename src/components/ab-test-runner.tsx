"use client";

import { FormEvent, useState } from "react";
import { friendlyProviderError, readAssistantText, SAMPLE_COMPARISON_RESULTS, SAMPLE_COMPARISON_TASK } from "../lib/ab-test";
import { MODEL_PRICING, SUPPORTED_MODELS } from "../lib/pricing";
import type { SupportedModel } from "../lib/types";

type Result = { model: SupportedModel; callId: string | null; output: string; cost?: number; latencyMs: number; instructionCompliant?: boolean };

export function ABTestRunner({ projectId, taskId, onRecorded, onComparisonActive, startWithSample = false }: { projectId: string; taskId: string; onRecorded: () => Promise<void>; onComparisonActive?: (active: boolean) => void; startWithSample?: boolean }) {
  const [apiKey, setApiKey] = useState("");
  const [prompt, setPrompt] = useState("");
  const [modelA, setModelA] = useState<SupportedModel>("gpt-5.4-mini");
  const [modelB, setModelB] = useState<SupportedModel>("gpt-5.4-nano");
  const [results, setResults] = useState<Result[]>(() => startWithSample ? SAMPLE_COMPARISON_RESULTS.map((result) => ({ ...result })) : []);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [winner, setWinner] = useState<string | null>(null);
  const [sampleMode, setSampleMode] = useState(startWithSample);

  async function runModel(model: SupportedModel, sessionId: string): Promise<Result> {
    const started = performance.now();
    const response = await fetch(`/p/${encodeURIComponent(projectId)}/v1/chat/completions`, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", "x-tollgate-task-id": taskId, "x-tollgate-session-id": sessionId, "x-tollgate-agent": "tollgate-ab", "x-tollgate-policy-mode": "observe" },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_completion_tokens: 500 }),
    });
    const body = await response.json().catch(() => null) as unknown;
    if (!response.ok) {
      throw new Error(friendlyProviderError(response.status, body));
    }
    const output = readAssistantText(body);
    if (!output) throw new Error(`${MODEL_PRICING[model].label} returned no text output.`);
    const costHeader = response.headers.get("x-tollgate-estimated-cost-usd");
    return { model, callId: response.headers.get("x-tollgate-call-id"), output, cost: costHeader ? Number(costHeader) : undefined, latencyMs: Math.round(performance.now() - started) };
  }

  async function run(event: FormEvent) {
    event.preventDefault();
    if (modelA === modelB) return setError("Choose two different models.");
    onComparisonActive?.(true);
    setRunning(true); setError(""); setWinner(null); setResults([]);
    const sessionId = `ab-${Date.now()}`;
    try {
      const settled = await Promise.allSettled([runModel(modelA, sessionId), runModel(modelB, sessionId)]);
      const successful = settled.filter((item): item is PromiseFulfilledResult<Result> => item.status === "fulfilled").map((item) => item.value);
      setResults(successful);
      const failures = settled.filter((item): item is PromiseRejectedResult => item.status === "rejected");
      if (failures.length) setError([...new Set(failures.map((item) => item.reason instanceof Error ? item.reason.message : "OpenAI could not complete that comparison. Try again in a moment."))].join(" "));
      if (!successful.length) onComparisonActive?.(false);
    } finally {
      setApiKey(""); setRunning(false);
    }
  }

  async function choose(selected: Result) {
    if (sampleMode) {
      setWinner(selected.model);
      setError("");
      return;
    }
    if (!selected.callId || results.length < 2) return setError("Both measured calls are required before recording a winner.");
    const other = results.find((result) => result.callId !== selected.callId);
    if (!other?.callId) return setError("The other measured call is missing its Tollgate ID.");
    const feedbackUrl = `/p/${encodeURIComponent(projectId)}/dashboard/feedback`;
    const responses = await Promise.all([
      fetch(feedbackUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ callId: selected.callId, score: "helpful" }) }),
      fetch(feedbackUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ callId: other.callId, score: "not_helpful" }) }),
    ]);
    if (responses.some((response) => !response.ok)) return setError("The comparison ran, but the winner could not be saved.");
    setWinner(selected.model); onComparisonActive?.(false); await onRecorded();
  }

  function continueWithLiveTask() {
    setSampleMode(false);
    setWinner(null);
    setResults([]);
    setPrompt("");
    setError("");
  }

  return <section className="ab-runner">
    <header><div><small>{sampleMode ? "Keyless sample · pre-run evidence" : "Controlled test"}</small><h3>{sampleMode ? "Choose the better result." : "Run the work on two models."}</h3></div><p>{sampleMode ? "A synthetic task measured on 30 August 2026. It does not affect your spend or telemetry." : "Two real, paid OpenAI calls. Output is capped at 500 tokens per model."}</p></header>
    {sampleMode ? <div className="sample-task"><span>Sample task</span><p>{SAMPLE_COMPARISON_TASK}</p></div> : <form className="ab-form" onSubmit={run}>
      <label className="ab-key">OpenAI API key<input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="sk-…" autoComplete="off" required /><span className="ab-key-safety">Use a temporary <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">project-scoped key</a> with a low spend limit, and revoke it after your test. We never store your key.</span><span className="ab-key-help">Used for this comparison only. It passes through Tollgate to OpenAI, is never written to Tollgate&apos;s database, and is cleared when the run ends.</span></label>
      <label>Model A<select value={modelA} onChange={(event) => setModelA(event.target.value as SupportedModel)}>{SUPPORTED_MODELS.map((model) => <option key={model} value={model}>{MODEL_PRICING[model].label}</option>)}</select></label>
      <label>Model B<select value={modelB} onChange={(event) => setModelB(event.target.value as SupportedModel)}>{SUPPORTED_MODELS.map((model) => <option key={model} value={model}>{MODEL_PRICING[model].label}</option>)}</select></label>
      <label className="ab-prompt">Representative task<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={4000} rows={6} placeholder="Paste one real task that both models should complete…" required /></label>
      <p className="ab-privacy">Your key and prompt pass through Tollgate to OpenAI. Tollgate does not store the key, prompt, or outputs. They leave this page on refresh.</p>
      <button className="tap-target" type="submit" disabled={running}>{running ? "Running two calls…" : "Run comparison"}</button>
    </form>}
    {error ? <p className="ab-error" role="alert">{error}</p> : null}
    {results.length ? <div className="ab-results" data-sample={sampleMode}>{results.map((result) => <article key={result.model} data-winner={winner === result.model}><header><strong>{MODEL_PRICING[result.model].label}</strong>{!sampleMode ? <span>{result.cost === undefined ? "Cost unavailable" : `$${result.cost.toFixed(6)}`} · {result.latencyMs} ms</span> : null}</header>{sampleMode ? <dl className="sample-checks"><div><dt>Cost</dt><dd>{result.cost === undefined ? "Unavailable" : `$${result.cost.toFixed(6)}`}</dd></div><div><dt>Speed</dt><dd>{result.latencyMs} ms</dd></div><div><dt>Follows the instruction</dt><dd>{result.instructionCompliant ? "Yes" : "No"}</dd></div></dl> : null}<pre>{result.output}</pre><button className="tap-target" type="button" onClick={() => choose(result)} disabled={results.length < 2 || winner !== null}>{winner === result.model ? "Choice recorded" : "Choose this result"}</button></article>)}</div> : null}
    {sampleMode && winner ? <div className="sample-decision" aria-live="polite"><div><small>Sample decision complete</small><strong>{MODEL_PRICING[winner as SupportedModel].label} recorded as the better result.</strong><p>You reached the decision without sharing an API key. Your sample choice is not added to live telemetry.</p></div><button className="tap-target" type="button" onClick={continueWithLiveTask}>Run with your own task <span>→</span></button></div> : null}
  </section>;
}
