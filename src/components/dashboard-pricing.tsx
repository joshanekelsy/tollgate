"use client";

import { Save, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { ActionButton, EmptyState, EnvironmentToggle, RowStatus, ViewHeading, customerName, money } from "./dashboard-shared";
import { trackProductEvent } from "@/lib/analytics";
import type { PriceRule } from "@/lib/billing";
import { dashboardJson } from "@/lib/dashboard-request";
import type { CustomerRecord, MeterEnvironment, RateCard, StoredPriceRule } from "@/lib/dashboard-types";
import type { ProviderId } from "@/lib/types";

function RuleEditor({ projectId, environment, customers, rules, defaultRule, onReload, demo }: {
  projectId: string;
  environment: MeterEnvironment;
  customers: CustomerRecord[];
  rules: StoredPriceRule[];
  defaultRule: PriceRule | null;
  onReload: () => Promise<void>;
  demo: boolean;
}) {
  const [scope, setScope] = useState("default");
  const active = scope === "default" ? rules.find((rule) => !rule.customerId) ?? defaultRule : rules.find((rule) => rule.customerId === scope) ?? defaultRule;
  const [mode, setMode] = useState<PriceRule["mode"]>(active?.mode ?? "percentage");
  const [value, setValue] = useState(String(active?.value ?? 20));
  const [base, setBase] = useState(String(active?.baseAmountUsd ?? 0));
  const [included, setIncluded] = useState(String(active?.includedTokens ?? 0));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function selectScope(nextScope: string) {
    const next = nextScope === "default" ? rules.find((rule) => !rule.customerId) ?? defaultRule : rules.find((rule) => rule.customerId === nextScope) ?? defaultRule;
    setScope(nextScope);
    setMode(next?.mode ?? "percentage");
    setValue(String(next?.value ?? 20));
    setBase(String(next?.baseAmountUsd ?? 0));
    setIncluded(String(next?.includedTokens ?? 0));
    setMessage("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (demo) { setMessage("Sample pricing is read-only."); return; }
    const amount = Number(value);
    const baseAmountUsd = Number(base);
    const includedTokens = Number(included);
    if (![amount, baseAmountUsd, includedTokens].every((number) => Number.isFinite(number) && number >= 0) || !Number.isSafeInteger(includedTokens)) {
      setMessage("Use non-negative numbers. Included tokens must be a whole number."); return;
    }
    setSaving(true); setMessage("");
    try {
      const result = await dashboardJson<{ error?: string }>(`/p/${encodeURIComponent(projectId)}/dashboard/billing-rule`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ environment, customerId: scope === "default" ? undefined : scope, mode, value: amount, baseAmountUsd, includedTokens }),
      });
      if (!result.ok) { setMessage(result.data.error ?? "Price rule could not be saved"); return; }
      try { await onReload(); }
      catch { setMessage("Price rule saved, but the dashboard could not refresh. Refresh the page to confirm it."); return; }
      setMessage("Versioned price rule saved. Closed billing runs were not changed.");
      trackProductEvent("pricing_rule_saved", { environment, mode, outcome: "success", surface: "dashboard" });
    } catch {
      setMessage("Connection was interrupted. Refresh to confirm whether the price rule was saved.");
    } finally {
      setSaving(false);
    }
  }

  const preview = mode === "percentage"
    ? Number(base || 0) + 10 * (1 + Number(value || 0) / 100)
    : Number(base || 0) + Math.max(0, 10_000 - Number(included || 0)) / 1_000 * Number(value || 0);
  return <section className="pricing-rule-panel"><header><div><p className="meter-kicker">Customer charge</p><h2>Versioned price rule</h2></div><RowStatus tone={active ? "good" : "attention"}>{active ? `version ${active.version ?? 0}` : "required"}</RowStatus></header>
    <form onSubmit={save}>
      <label><span>Applies to</span><select value={scope} onChange={(event) => selectScope(event.target.value)}><option value="default">Default for every customer</option>{customers.map((customer) => <option value={customer.customerId} key={customer._id}>{customer.name || customerName(customer.customerId)}</option>)}</select></label>
      <fieldset><legend>Calculation</legend><label><input type="radio" checked={mode === "percentage"} onChange={() => setMode("percentage")} /><span><strong>Markup on raw cost</strong><small>Requires a known provider or rate-card cost.</small></span></label><label><input type="radio" checked={mode === "per_thousand_tokens"} onChange={() => setMode("per_thousand_tokens")} /><span><strong>USD per 1,000 tokens</strong><small>Can bill even when raw provider cost is unknown.</small></span></label></fieldset>
      <div className="field-grid compact"><label><span>{mode === "percentage" ? "Markup %" : "USD / 1K tokens"}</span><input type="number" min="0" step="0.01" value={value} onChange={(event) => setValue(event.target.value)} required /></label><label><span>Monthly base USD</span><input type="number" min="0" step="0.01" value={base} onChange={(event) => setBase(event.target.value)} required /></label>{mode === "per_thousand_tokens" ? <label><span>Included tokens</span><input type="number" min="0" step="1" value={included} onChange={(event) => setIncluded(event.target.value)} required /></label> : null}</div>
      <div className="calculation-strip"><span>{mode === "percentage" ? "$10.00 raw cost" : "10,000 tokens"}</span><b>{money(Number.isFinite(preview) ? preview : 0)}</b></div>
      <footer><p role="status">{message || "Saving creates a new version for future previews and closes."}</p><ActionButton icon={Save} disabled={saving}>{saving ? "Saving" : "Save rule"}</ActionButton></footer>
    </form>
  </section>;
}

function RateCards({ projectId, environment, rates, onReload, demo }: { projectId: string; environment: MeterEnvironment; rates: RateCard[]; onReload: () => Promise<void>; demo: boolean }) {
  const [provider, setProvider] = useState<ProviderId>("anthropic");
  const [model, setModel] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState<"" | "save" | "remove">("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (demo) { setMessage("Sample rate cards are read-only."); return; }
    setWorking("save"); setMessage("");
    try {
      const result = await dashboardJson<{ error?: string }>(`/p/${encodeURIComponent(projectId)}/dashboard/rates`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ environment, provider, model, inputUsdPerMillion: Number(input), outputUsdPerMillion: Number(output) }) });
      if (!result.ok) { setMessage(result.data.error ?? "Rate card could not be saved"); return; }
      setModel(""); setInput(""); setOutput("");
      try { await onReload(); }
      catch { setMessage("Rate card saved, but the dashboard could not refresh. Refresh the page to confirm it."); return; }
      setMessage("Rate card saved.");
      trackProductEvent("rate_card_saved", { environment, provider, outcome: "success", surface: "dashboard" });
    } catch {
      setMessage("Connection was interrupted. Refresh to confirm whether the rate card was saved.");
    } finally {
      setWorking("");
    }
  }

  async function remove(rate: RateCard) {
    if (demo) return;
    setWorking("remove"); setMessage("");
    try {
      const result = await dashboardJson<{ error?: string }>(`/p/${encodeURIComponent(projectId)}/dashboard/rates`, { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ environment, provider: rate.provider, model: rate.model }) });
      if (!result.ok) { setMessage(result.data.error ?? "Rate card could not be removed"); return; }
      try { await onReload(); }
      catch { setMessage("Rate card removed, but the dashboard could not refresh. Refresh the page to confirm it."); return; }
      setMessage("Rate card removed.");
    } catch {
      setMessage("Connection was interrupted. Refresh to confirm whether the rate card was removed.");
    } finally {
      setWorking("");
    }
  }

  return <section className="rate-card-panel"><header><div><p className="meter-kicker">Raw model cost</p><h2>Exact model rate cards</h2></div><RowStatus tone={rates.length ? "good" : "attention"}>{rates.length} configured</RowStatus></header><p className="panel-intro">Used only when a provider does not report cost. Provider-reported cost always wins.</p>
    <form onSubmit={save} className="rate-form"><label><span>Provider</span><select value={provider} onChange={(event) => setProvider(event.target.value as ProviderId)}><option value="openai">OpenAI</option><option value="anthropic">Anthropic</option><option value="gemini">Gemini</option><option value="openrouter">OpenRouter</option></select></label><label><span>Exact model ID</span><input value={model} onChange={(event) => setModel(event.target.value)} placeholder="claude-sonnet-4-5" required /></label><label><span>Input USD / 1M</span><input type="number" min="0" step="0.000001" value={input} onChange={(event) => setInput(event.target.value)} required /></label><label><span>Output USD / 1M</span><input type="number" min="0" step="0.000001" value={output} onChange={(event) => setOutput(event.target.value)} required /></label><ActionButton icon={Save} disabled={working !== ""}>{working === "save" ? "Saving" : "Add rate"}</ActionButton></form><p className="form-note" role="status">{message}</p>
    {rates.length ? <div className="data-table-wrap"><table className="dashboard-table"><thead><tr><th>Provider</th><th>Model</th><th>Input / 1M</th><th>Output / 1M</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{rates.map((rate) => <tr key={rate._id}><td>{rate.provider}</td><th>{rate.model}</th><td>{money(rate.inputUsdPerMillion)}</td><td>{money(rate.outputUsdPerMillion)}</td><td><button className="icon-button" type="button" title="Remove rate card" disabled={working !== ""} onClick={() => void remove(rate)}><Trash2 size={15} aria-hidden="true" /></button></td></tr>)}</tbody></table></div> : <EmptyState title="No manual rates" body="Add only the exact models whose provider cost is unavailable." />}
  </section>;
}

export function DashboardPricing(props: {
  projectId: string;
  environment: MeterEnvironment;
  onEnvironment: (environment: MeterEnvironment) => void;
  customers: CustomerRecord[];
  rules: StoredPriceRule[];
  defaultRule: PriceRule | null;
  rates: RateCard[];
  onReload: () => Promise<void>;
  demo?: boolean;
}) {
  return <div className="meter-view pricing-view"><ViewHeading eyebrow={`${props.environment} pricing`} title="Price customer usage without guessing cost." description="Customer charge rules and provider cost rates are separate, versioned controls." state={props.defaultRule ? "Default active" : "Default required"} tone={props.defaultRule ? "good" : "attention"} /><div className="view-toolbar"><EnvironmentToggle value={props.environment} onChange={props.onEnvironment} disabled={props.demo} /></div><div className="pricing-operations"><RuleEditor {...props} defaultRule={props.defaultRule} demo={Boolean(props.demo)} /><RateCards projectId={props.projectId} environment={props.environment} rates={props.rates} onReload={props.onReload} demo={Boolean(props.demo)} /></div></div>;
}
