"use client";

import { useEffect, useState } from "react";
import { sampleCustomerSummaries, samplePricingRule } from "@/lib/dashboard-sample-config";

const sampleCustomer = sampleCustomerSummaries[0];

const scenes = [
  {
    label: "01 / Unattributed",
    title: "Usage arrives without a customer.",
    copy: "The model runs and the provider records cost. Your billing system still does not know who used it.",
  },
  {
    label: "02 / Attribute",
    title: "Every call gets an owner.",
    copy: "Send one customer ID with the request. Tollgate keeps it beside provider, model, tokens, and available raw cost.",
  },
  {
    label: "03 / Price",
    title: "Raw usage gets the right price.",
    copy: "Apply your default or a customer override, including base charges, included tokens, and exact model rates.",
  },
  {
    label: "04 / Close",
    title: "The completed month stops moving.",
    copy: "Freeze the customer amounts, export CSV, or create draft invoices in Stripe.",
  },
];

export function ProductFilm() {
  const [scene, setScene] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frame = reduced ? window.requestAnimationFrame(() => setPlaying(false)) : 0;
    return () => { if (frame) window.cancelAnimationFrame(frame); };
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setScene((current) => (current + 1) % scenes.length), 6_000);
    return () => window.clearInterval(timer);
  }, [playing]);

  const current = scenes[scene];
  return <section className="product-film" aria-labelledby="product-film-title">
    <header className="film-heading"><div><p className="scene-label">Customer metering / 24-second product film</p><h2 id="product-film-title">From model usage<br />to a customer amount.</h2></div><button className="tap-target" type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "Pause product film" : "Play product film"}>{playing ? "Pause Ⅱ" : "Play ▶"}</button></header>
    <div className="film-stage" data-scene={scene + 1}>
      <div className="film-copy" key={`copy-${scene}`}><span>{current.label}</span><h3>{current.title}</h3><p>{current.copy}</p></div>
      <div className="film-interface" aria-live="polite">
        <div className="film-agent"><span>CUSTOMER ID</span><strong>{sampleCustomer.customerId}</strong><i>attributed</i></div>
        <div className="film-calls" aria-hidden="true"><i /><i /><i /><i /><i /></div>
        <div className="film-gate" aria-hidden="true"><b>T</b><span>MEASURE</span></div>
        <div className="film-task"><span>CUSTOMER USAGE</span><strong>{sampleCustomer.tokens.toLocaleString("en-US")}</strong><small>tokens · {sampleCustomer.calls} calls</small></div>
        <div className="film-models"><article><span>RAW MODEL COST</span><i><b /></i><strong>${sampleCustomer.rawCostUsd.toFixed(2)}</strong></article><article><span>PRICE RULE</span><i><b /></i><strong>+{samplePricingRule.value}%</strong></article></div>
        <div className="film-decision"><span>BILLING-RUN READY</span><strong>${sampleCustomer.billedAmountUsd.toFixed(2)} billed</strong><small>${sampleCustomer.marginUsd.toFixed(2)} calculated margin.</small></div>
      </div>
    </div>
    <nav className="film-controls" aria-label="Product film scenes">{scenes.map((item, index) => <button className="tap-target" key={item.label} type="button" data-active={index === scene} onClick={() => { setScene(index); setPlaying(false); }}><span>{String(index + 1).padStart(2, "0")}</span>{item.label.split(" / ")[1]}</button>)}</nav>
    <p className="film-proof">Illustrative customer ID · metering uses provider-reported tokens · prompts and responses not stored.</p>
  </section>;
}
