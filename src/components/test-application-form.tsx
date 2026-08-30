"use client";

import { FormEvent, useState } from "react";

export function TestApplicationForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const source = new URLSearchParams(window.location.search).get("source") ?? "other";
    try {
      const response = await fetch("/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.get("name"), email: data.get("email"), provider: data.get("provider"), pain: data.get("pain"), source }),
      });
      if (!response.ok) throw new Error("not_recorded");
      setStatus("success");
      form.reset();
    } catch {
      setError("That did not go through. Please try again—your form has not been recorded.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return <div className="form-card form-success" role="status"><span className="success-mark">✓</span><p className="form-kicker">Application received</p><h3>You&apos;re on the test list.</h3><p>I&apos;ll confirm whether the Build Week test supports your setup before sharing access.</p></div>;
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <p className="form-kicker">Early-access application</p>
      <label><span>Name</span><input name="name" autoComplete="name" required placeholder="Your name" /></label>
      <label><span>Work email</span><input name="email" type="email" autoComplete="email" required placeholder="you@company.com" /></label>
      <label>
        <span>Provider you pay directly</span>
        <select name="provider" defaultValue="openai" required>
          <option value="openai">OpenAI — test available now</option>
          <option value="anthropic">Anthropic — join the next-provider list</option>
          <option value="gemini">Google Gemini — join the next-provider list</option>
          <option value="openrouter">OpenRouter — join the next-provider list</option>
          <option value="hosted-open-model">Hosted open models — join the next-provider list</option>
          <option value="other">Another provider</option>
        </select>
      </label>
      <label><span>What happened the last time usage surprised you? <i>Optional</i></span><textarea name="pain" rows={3} maxLength={500} placeholder="The run, the surprise, and what was too late to change" /></label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button type="submit" disabled={status === "submitting"}><span>{status === "submitting" ? "Recording application…" : "Apply to test Tollgate"}</span><i>↗</i></button>
      <small>No API key requested. OpenAI testing is available first; other providers shape what ships next.</small>
    </form>
  );
}
