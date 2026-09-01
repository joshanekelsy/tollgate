"use client";

import { PointerEvent, useEffect, useRef, useState } from "react";
import { TestApplicationForm } from "./test-application-form";
import { ProductFilm } from "./product-film";
import { sampleCustomerSummaries, sampleDashboardTotals, samplePricingRule } from "@/lib/dashboard-sample-config";

const sampleMoney = (value: number) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(value);

function ProofCard({ onExpand, expanded = false }: { onExpand?: () => void; expanded?: boolean }) {
  return <div className={`proof-stage decision-proof${expanded ? " proof-stage-expanded" : ""}`} aria-label="Illustrative Tollgate customer invoice totals">
    <header><span>Sample dashboard</span><time>Sample month</time>{onExpand ? <button className="tap-target" type="button" data-analytics-event="sample_dashboard_opened" onClick={onExpand}>Inspect ↗</button> : null}</header>
    <div className="proof-route" aria-hidden="true"><span>Events</span><i /><strong>Customers</strong><i /><span>Billing runs</span></div>
    <div className="proof-task"><span>Active price rule</span><p>{samplePricingRule.value}% markup on estimated raw model cost.</p></div>
    <div className="proof-models">
      {sampleCustomerSummaries.map((customer) => <article key={customer.customerId} data-attention={customer.customerId === "unattributed" || undefined}><header><strong>{customer.name}</strong><span>{customer.calls.toLocaleString("en-US")} calls · {customer.tokens.toLocaleString("en-US")} tokens</span></header><p>{sampleMoney(customer.rawCostUsd)} raw model cost</p><b>{sampleMoney(customer.billedAmountUsd)} billed</b></article>)}
    </div>
    <div className="proof-decision"><span>Sample month</span><strong>{sampleMoney(sampleDashboardTotals.billedAmountUsd)} billed</strong><small>{sampleMoney(sampleDashboardTotals.rawCostUsd)} raw model cost · {sampleMoney(sampleDashboardTotals.marginUsd)} margin</small></div>
    <p className="proof-caveat">Illustrative customer IDs and billing amounts. Tollgate can close fixed billing runs and create Stripe draft invoices; it does not send invoices or collect payment.</p>
  </div>;
}

export function LandingExperience() {
  const [expanded, setExpanded] = useState(false);
  const pointerFrame = useRef<number | null>(null);
  const closeButton = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!expanded) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
      if (event.key === "Tab") {
        event.preventDefault();
        closeButton.current?.focus();
      }
    };
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", close);
      previousFocus?.focus();
    };
  }, [expanded]);

  function moveSpotlight(event: PointerEvent<HTMLElement>) {
    if (pointerFrame.current !== null) return;
    const target = event.currentTarget;
    const bounds = target.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    pointerFrame.current = requestAnimationFrame(() => {
      target.style.setProperty("--pointer-x", `${x}px`);
      target.style.setProperty("--pointer-y", `${y}px`);
      pointerFrame.current = null;
    });
  }

  return <main className="cinematic-landing" id="top">
    <nav className="cinematic-nav"><a className="cinematic-mark tap-target" href="#top"><span>T</span>Tollgate</a><div><a className="nav-demo tap-target" href="/demo" data-analytics-event="sample_dashboard_opened">Sample dashboard</a><a className="tap-target" href="/docs">Docs</a><a className="tap-target" href="/how-it-works" data-analytics-event="technical_contract_opened">How it works</a><p><i /> Meter online <b>Four provider adapters</b></p></div></nav>
    <section className="cinematic-hero" id="observe" onPointerMove={moveSpotlight}>
      <div className="call-trails" aria-hidden="true"><i /><i /><i /></div>
      <div className="hidden-ledger" aria-hidden="true"><span>Usage needs an owner.</span><span>Every call needs a customer.</span><span>Raw cost is not your price.</span><span>2,000 tokens · $4.00 billed</span><span>Know the amount before invoicing.</span><span>Prompt not stored.</span></div>
      <div className="inspection-lens" aria-hidden="true"><i /><span>Inspect</span></div><p className="inspection-cue">Move through the dark to inspect unattributed usage</p>
      <div className="hero-thesis"><p className="scene-label">Customer usage / verified monthly charges</p><h1>Your customers use AI<br /><em>Know what to bill</em></h1><p className="hero-deck">Meter supported AI usage per customer, close a fixed monthly billing run, and push draft charges to Stripe without storing prompts or responses.</p><div className="hero-actions"><a className="primary-action tap-target" href="#get-started" data-analytics-event="landing_primary_cta_clicked">Create a private meter <span>↓</span></a><a className="secondary-action tap-target" href="/demo" data-analytics-event="sample_dashboard_opened">Explore sample dashboard <span>↗</span></a></div><p className="hero-constraint">Four provider adapters · selected non-streaming generation endpoints · test and live data kept separate</p></div>
      <ProofCard onExpand={() => setExpanded(true)} />
    </section>
    <section className="demo-invitation" aria-label="Explore the public Tollgate demo"><div><p className="scene-label">Customer billing / sample data</p><h2>Three customers.<br />One complete dashboard.</h2><p>Explore Overview, Events, Customers, Pricing, Billing runs, and Setup with realistic read-only data. No provider key or recovery code required.</p></div><a className="tap-target" href="/demo" data-analytics-event="sample_dashboard_opened">Explore the sample dashboard <span>↗</span></a></section>
    <ProductFilm />
    <section className="setup-evidence" id="compare"><div><p className="scene-label">The billing loop</p><h2>Measure usage.<br />Close the month.</h2></div><div className="decision-steps"><ol><li><span>01</span><p><strong>Attribute</strong>Add a customer ID and unique retry ID to each supported model call.</p></li><li><span>02</span><p><strong>Meter</strong>Record calls, tokens, and available raw model cost once.</p></li><li><span>03</span><p><strong>Price</strong>Apply a default or customer price, including base charges and allowances.</p></li><li><span>04</span><p><strong>Close</strong>Freeze a monthly run, export CSV, or create Stripe draft invoices.</p></li></ol><a className="tap-target" href="/how-it-works" data-analytics-event="technical_contract_opened">Read the technical contract ↗</a></div></section>
    <section className="buyer-questions" aria-labelledby="buyer-questions-title">
      <header><p className="scene-label">Before you connect</p><h2 id="buyer-questions-title">The questions that should have clear answers.</h2><p>No vague security promises. No hidden product limits.</p></header>
      <div className="answer-ledger">
        <article><span>01 / Cost</span><h3>What does Tollgate cost?</h3><p>The private beta is free. Paid pricing has not been set.</p></article>
        <article><span>02 / First step</span><h3>What happens after I enter my email?</h3><p>Tollgate creates a private meter and shows three secrets once: a recovery code plus separate test and live write keys. You then land in Setup with a working request example.</p></article>
        <article><span>03 / Recovery</span><h3>How do I reopen my meter?</h3><p>Use the recovery code shown when the meter was created. A private browser session lasts up to 12 hours, and you can sign out earlier.</p></article>
        <article><span>04 / Customer</span><h3>How is usage assigned to a customer?</h3><p>Send an X-Tollgate-Customer header. Calls without one are stored as unattributed.</p></article>
        <article><span>05 / Price</span><h3>How is the billed amount calculated?</h3><p>Set a default rule or a customer override: percentage markup or USD per 1,000 tokens, with an optional monthly base charge and included tokens.</p></article>
        <article><span>06 / Missing cost</span><h3>What if provider cost is unavailable?</h3><p>Add an exact provider-and-model rate card. Without reported cost or a rate card, Tollgate blocks a percentage-based month close instead of inventing a zero.</p></article>
        <article><span>07 / Support today</span><h3>Which providers and calls work?</h3><p>Non-streaming OpenAI and OpenRouter Chat Completions, Anthropic Messages, and Gemini GenerateContent. Other endpoints, including streaming and OpenAI Responses, are not supported yet.</p></article>
        <article><span>08 / Boundary</span><h3>What does Tollgate not do?</h3><p>Tollgate creates Stripe draft invoices but does not send them or collect payment. Subscriptions, tax, credits, refunds, and automatic payment recovery are not included.</p></article>
        <article><span>09 / Privacy</span><h3>What crosses the gate?</h3><p>Your key, prompt, and response pass through for the request but are not written to Tollgate’s database.</p></article>
      </div>
    </section>
    <section className="cinematic-start"><div className="start-copy"><p className="scene-label">Start now</p><h2>Turn one customer call<br />into billable usage.</h2><p>Create a private meter with one email. Use the test key first, attach a customer, set pricing, then close a verified monthly run when you are ready.</p></div><div className="start-form" id="get-started"><TestApplicationForm /></div></section>
    <section className="trust-band" aria-label="Tollgate privacy and security controls">
      <header><p className="scene-label">Trust is a product surface</p><h2>Know what crosses the gate.</h2></header>
      <div className="trust-ledger"><article><span>Metadata retained</span><strong>Usage signals</strong><ul><li>Customer ID, provider, model and token counts</li><li>Available cost, cost status and latency</li><li>Strict task, session and agent IDs</li></ul></article><article data-private="true"><span>Content retained</span><strong>Zero</strong><ul><li>No API keys or authorization headers</li><li>No prompts or model responses</li><li>No tool arguments or payloads</li></ul></article></div>
      <div className="trust-controls"><article><i>01</i><span className="trust-symbol">⌁</span><h3>Strict trace IDs</h3><p>Free-form task labels are rejected before provider spend.</p></article><article><i>02</i><span className="trust-symbol">✓</span><h3>OWASP-guided logging</h3><p>Designed around minimum-data and sensitive-content logging guidance.</p><a className="tap-target" href="https://cornucopia.owasp.org/edition/companion/LLM4" target="_blank" rel="noreferrer">Read the guidance ↗</a></article></div>
    </section>
    <footer className="cinematic-footer"><a className="cinematic-mark tap-target" href="#top"><span>T</span>Tollgate</a><nav aria-label="Product links"><a href="/docs">Docs</a><a href="/api-reference">API</a><a href="/security">Security</a><a href="/privacy">Privacy</a><a href="/status">Status</a><a href="/contact">Contact</a></nav><p>Private beta · 2026</p></footer>
    {expanded ? <div className="proof-modal" role="dialog" aria-modal="true" aria-label="Expanded sample dashboard" onMouseDown={(event) => { if (event.target === event.currentTarget) setExpanded(false); }}><button ref={closeButton} className="modal-close tap-target" type="button" onClick={() => setExpanded(false)}>Close ×</button><ProofCard expanded /></div> : null}
  </main>;
}
