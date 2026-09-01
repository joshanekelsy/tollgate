import Link from "next/link";
import type { Metadata } from "next";
import "./how-it-works.css";

export const metadata: Metadata = {
  title: "How Tollgate works — Customer usage and billing boundaries",
  description: "How Tollgate attributes supported AI usage, applies customer pricing, closes fixed billing runs, and creates Stripe draft invoices.",
};

const stored = ["Project, environment, and customer ID", "Idempotency key and safe trace IDs", "Provider and requested/reported model", "Token counts and available raw cost", "Latency, status and safe tool names", "Applied pricing and fixed billing-run totals"];
const excluded = ["Provider API key", "Authorization header", "Prompt or message content", "Model response content", "Tool arguments or payloads"];

export default function HowItWorksPage() {
  return <main className="contract-page">
    <nav><Link href="/" className="contract-mark tap-target"><span>T</span>Tollgate</Link><Link className="tap-target" href="/docs">Read the docs</Link></nav>
    <header className="contract-hero"><p>Customer metering contract / V1</p><h1>Know what crosses<br />the gate.</h1><div><strong>Four provider adapters</strong><span>Test and live environments</span><span>Customer-aware pricing</span><span>Private metadata mode</span></div></header>

    <section className="request-path" aria-labelledby="request-path-title"><header><p>01 / Request path</p><h2 id="request-path-title">One request. One customer.</h2></header><ol><li><span>Your client</span><p>Sends a supported non-streaming request with a provider key, <code>X-Tollgate-Key</code>, <code>X-Tollgate-Idempotency-Key</code>, and <code>X-Tollgate-Customer</code>.</p></li><li><span>Tollgate</span><p>Checks the project write key and retry ID before provider spend, uses the selected adapter, records safe usage metadata once, then returns the provider response.</p></li><li><span>Your provider</span><p>Runs the model and remains the authority for provider charges. Tollgate does not resell inference.</p></li></ol></section>

    <section className="data-boundary" aria-labelledby="data-boundary-title"><header><p>02 / Data boundary</p><h2 id="data-boundary-title">Metadata stays.<br />Content does not.</h2></header><div><article><h3>Stored in Tollgate</h3><ul>{stored.map((item) => <li key={item}>{item}</li>)}</ul></article><article data-private="true"><h3>Never persisted</h3><ul>{excluded.map((item) => <li key={item}>{item}</li>)}</ul></article></div><p>Your key, prompt and response pass through Tollgate memory for the request. “Never persisted” does not mean Tollgate never processes them.</p></section>

    <section className="decision-contract" aria-labelledby="decision-title"><header><p>03 / Billing loop</p><h2 id="decision-title">Raw usage becomes a fixed monthly charge.</h2></header><div><article><span>Attribute</span><p>Match each supported call to a customer record or make unattributed usage visible.</p></article><article><span>Meter</span><p>Keep test and live usage separate, reject duplicate retry IDs, and show invalid or unpriced events.</p></article><article><span>Price</span><p>Apply a customer override or default rule, with optional base charges, included tokens, and exact model rate cards.</p></article><article><span>Close</span><p>Freeze a completed month, download its CSV, or create Stripe draft invoices for mapped customers.</p></article></div></section>

    <section className="limits" aria-labelledby="limits-title"><header><p>04 / Current limits</p><h2 id="limits-title">What Tollgate does not claim.</h2></header><ul><li>Connected endpoints are non-streaming OpenAI and OpenRouter Chat Completions, Anthropic Messages, and Gemini GenerateContent.</li><li>A safe model ID can pass through only within those four request formats. Streaming and other endpoints, including OpenAI Responses, are not supported.</li><li>Provider origins and paths are fixed. Other hosted providers are not connected.</li><li>Reported provider cost, verified OpenAI estimates, or an exact rate card can price usage. Otherwise cost stays unavailable; provider invoices remain authoritative.</li><li>Any proxy adds some overhead. Tollgate records end-to-end latency but does not yet publish isolated proxy overhead.</li><li>Billing runs are fixed Tollgate records, not legal tax invoices. CSV export and Stripe draft creation are supported.</li><li>Tollgate does not send invoices, collect payment, calculate tax, manage subscriptions, prorate charges, issue credits, or recover failed payments.</li><li>Recovery-code access is intended for the private beta; team accounts, roles, and single sign-on are not available.</li></ul></section>

    <section className="contract-cta"><p>One customer ID. One fixed billing run. One Stripe draft.</p><h2>Turn a model call into billable usage.</h2><Link className="tap-target" href="/#get-started">Create a private meter <span>↗</span></Link></section>
    <footer><Link href="/" className="contract-mark tap-target"><span>T</span>Tollgate</Link><p>Fixed billing runs and Stripe drafts. No payment collection.</p><p>Last verified 31 August 2026</p></footer>
  </main>;
}
