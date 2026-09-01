"use client";

import { Copy, KeyRound, Link2, RefreshCw } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { ABTestRunner } from "@/components/ab-test-runner";
import { ActionButton, EmptyState, EnvironmentToggle, RowStatus, ViewHeading } from "./dashboard-shared";
import { PROVIDER_SETUP_OPTIONS, providerSetup, type SetupLanguage } from "@/lib/provider-setup";
import { trackProductEvent } from "@/lib/analytics";
import type { CustomerRecord, DashboardCall, KeyMetadata, MeterEnvironment, StripeConnection } from "@/lib/dashboard-types";

export function DashboardSetup({ projectId, environment, onEnvironment, events, customers, keys, stripe, webhookUrl, hasRule, onReload, demo = false }: {
  projectId: string;
  environment: MeterEnvironment;
  onEnvironment: (environment: MeterEnvironment) => void;
  events: DashboardCall[];
  customers: CustomerRecord[];
  keys: KeyMetadata[];
  stripe: StripeConnection | null;
  webhookUrl: string;
  hasRule: boolean;
  onReload: () => Promise<void>;
  demo?: boolean;
}) {
  const [origin, setOrigin] = useState("");
  const [language, setLanguage] = useState<SetupLanguage>("javascript");
  const [provider, setProvider] = useState<(typeof PROVIDER_SETUP_OPTIONS)[number]["id"]>("openai");
  const [copied, setCopied] = useState("");
  const [newKey, setNewKey] = useState<{ environment: MeterEnvironment; key: string } | null>(null);
  const [keyMessage, setKeyMessage] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [stripeMessage, setStripeMessage] = useState("");
  const [savingStripe, setSavingStripe] = useState(false);
  const setup = providerSetup(origin, demo ? "your-meter-id" : projectId, provider);
  const currentKey = keys.find((key) => key.environment === environment);
  const readyCustomers = customers.filter((customer) => customer.billingEmail || customer.stripeCustomerId).length;
  const steps = [
    { label: `${environment} write key`, complete: Boolean(currentKey) || demo },
    { label: "First accepted event", complete: events.some((event) => event.status === "ok") },
    { label: "Billing customer", complete: readyCustomers > 0 },
    { label: "Price rule", complete: hasRule },
  ];

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setOrigin(window.location.origin));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setCopied(label); }
    catch { setCopied("Copy blocked"); }
  }

  async function rotateKey() {
    if (demo) { setKeyMessage("Sample keys cannot be rotated."); return; }
    if (!window.confirm(`Rotate the ${environment} write key now? The current key will stop working immediately.`)) return;
    setKeyMessage("Rotating key..."); setNewKey(null);
    const response = await fetch(`/p/${encodeURIComponent(projectId)}/dashboard/write-keys`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ environment }) });
    const result = await response.json() as { key?: string; error?: string };
    if (!response.ok || !result.key) { setKeyMessage(result.error ?? "Key rotation failed."); return; }
    setNewKey({ environment, key: result.key }); setKeyMessage("New key created. Save it now; it cannot be shown again."); await onReload();
  }

  async function connectStripe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (demo) { setStripeMessage("The sample Stripe connection is read-only."); return; }
    setSavingStripe(true); setStripeMessage("");
    const response = await fetch(`/p/${encodeURIComponent(projectId)}/dashboard/stripe`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ secretKey, webhookSecret }) });
    const result = await response.json() as { error?: string };
    if (!response.ok) { setSavingStripe(false); setStripeMessage(result.error ?? "Stripe connection failed."); return; }
    setSecretKey(""); setWebhookSecret(""); await onReload(); setSavingStripe(false); setStripeMessage("US Stripe account connected. Credentials are encrypted and cannot be shown again.");
    trackProductEvent("stripe_connected", { outcome: "success", surface: "dashboard" });
  }

  return <div className="meter-view setup-view">
    <ViewHeading eyebrow="Connection and access" title="Make one trusted event invoice-ready." description="Use the test key first, then repeat with live only after customer identity and pricing are correct." state={`${steps.filter((step) => step.complete).length} of 4 ready`} tone={steps.every((step) => step.complete) ? "good" : "attention"} />
    <div className="setup-checklist">{steps.map((step, index) => <div key={step.label} data-complete={step.complete}><span>{step.complete ? "Done" : String(index + 1).padStart(2, "0")}</span><strong>{step.label}</strong></div>)}</div>

    <section className="setup-section key-management"><header><div><p className="meter-kicker">1 / ingestion access</p><h2>Rotatable write keys</h2></div><EnvironmentToggle value={environment} onChange={(value) => { onEnvironment(value); setNewKey(null); setKeyMessage(""); }} disabled={demo} /></header><div className="key-row"><span><small>Active {environment} key</small><code>{currentKey?.keyPrefix ?? (demo ? `tgw_${environment}_sample...0000` : "No key active")}</code></span><ActionButton tone="secondary" icon={RefreshCw} onClick={() => void rotateKey()}>Rotate key</ActionButton></div>{newKey ? <div className="one-time-secret" role="status"><span>Shown once</span><code>{newKey.key}</code><button className="icon-button" type="button" title="Copy new write key" onClick={() => void copy(newKey.key, "Write key copied")}><Copy size={16} aria-hidden="true" /></button></div> : null}<p className="form-note">{keyMessage || "Test and live keys route events into separate ledgers. Rotating one does not affect the other."}</p></section>

    <section className="setup-section connection-panel" aria-labelledby="provider-connection-title"><header><div><p className="meter-kicker">2 / provider workflow</p><h2 id="provider-connection-title">Send a non-streaming generation request</h2></div><ActionButton tone="secondary" icon={Copy} onClick={() => void copy(setup.endpoint, "Endpoint copied")}>{copied === "Endpoint copied" ? "Copied" : "Endpoint"}</ActionButton></header><div className="provider-tabs" role="tablist" aria-label="Provider">{PROVIDER_SETUP_OPTIONS.map((option) => <button type="button" role="tab" aria-selected={provider === option.id} key={option.id} onClick={() => setProvider(option.id)}>{option.label}</button>)}</div><div className="base-url"><span>Fixed endpoint</span><code>{setup.endpoint}</code></div><div className="language-tabs" role="tablist" aria-label="Language">{(["javascript", "python", "curl"] as const).map((value) => <button type="button" role="tab" aria-selected={language === value} key={value} onClick={() => setLanguage(value)}>{value === "curl" ? "cURL" : value === "javascript" ? "JavaScript" : "Python"}</button>)}</div><pre><code>{setup.snippets[language]}</code></pre><div className="connection-actions"><ActionButton tone="secondary" icon={Copy} onClick={() => void copy(setup.snippets[language], "Code copied")}>{copied === "Code copied" ? "Copied" : "Copy code"}</ActionButton><span>Set <code>TOLLGATE_WRITE_KEY</code> to the {environment} key. Use one stable retry ID if your app retries the same request.</span></div></section>

    <section className="setup-section stripe-connection"><header><div><p className="meter-kicker">3 / billing output</p><h2>US Stripe connection</h2></div>{stripe ? <RowStatus tone="good">{stripe.livemode ? "live" : "test"} connected</RowStatus> : <RowStatus tone="attention">not connected</RowStatus>}</header>{stripe ? <div className="connected-stripe"><span><small>Account</small><strong>{stripe.accountId}</strong></span><span><small>Stored key</small><code>{stripe.keyPrefix}</code></span><span><small>Country</small><strong>{stripe.accountCountry}</strong></span></div> : null}<div className="webhook-copy"><span><small>Webhook endpoint</small><code>{webhookUrl || "Available after the dashboard loads"}</code></span><button className="icon-button" type="button" title="Copy Stripe webhook endpoint" onClick={() => void copy(webhookUrl, "Webhook copied")}><Copy size={16} aria-hidden="true" /></button></div><form onSubmit={connectStripe}><label><span>Restricted Stripe key</span><input type="password" autoComplete="off" value={secretKey} onChange={(event) => setSecretKey(event.target.value)} placeholder="rk_test_..." required /></label><label><span>Webhook signing secret</span><input type="password" autoComplete="off" value={webhookSecret} onChange={(event) => setWebhookSecret(event.target.value)} placeholder="whsec_..." required /></label><footer><p role="status">{stripeMessage || "The key needs account read plus customer, invoice, and invoice-item access. V1 accepts US accounts only."}</p><ActionButton icon={Link2} disabled={savingStripe}>{savingStripe ? "Checking Stripe" : stripe ? "Replace connection" : "Connect Stripe"}</ActionButton></footer></form></section>

    <section className="setup-section event-evidence"><header><div><p className="meter-kicker">4 / safe evidence</p><h2>Latest {environment} events</h2></div></header>{events.length ? events.slice(0, 5).map((event) => <article key={event._id}><span><strong>{event.customerId}</strong><small>{event.provider} / {event.requestedModel}</small></span><b>{(event.promptTokens + event.completionTokens).toLocaleString()} tokens</b><RowStatus tone={event.status === "ok" ? "good" : "bad"}>{event.status}</RowStatus></article>) : <EmptyState title="Waiting for the first event" body={`Send the sample with your ${environment} write key. Request content is never stored.`} />}</section>
    {!demo ? <details className="advanced-test"><summary><KeyRound size={15} aria-hidden="true" /> Optional OpenAI model comparison</summary><ABTestRunner projectId={projectId} taskId="first-comparison" onRecorded={onReload} startWithSample /></details> : null}
  </div>;
}
