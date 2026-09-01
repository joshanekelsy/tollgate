"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, BadgeDollarSign, Gauge, LogOut, ReceiptText, Settings2, Users } from "lucide-react";
import { DashboardOverview } from "./dashboard-overview";
import { DashboardEvents } from "./dashboard-events";
import { DashboardCustomers } from "./dashboard-customers";
import { DashboardPricing } from "./dashboard-pricing";
import { DashboardBillingRuns } from "./dashboard-billing-runs";
import { DashboardSetup } from "./dashboard-setup";
import { sampleDashboardData } from "@/lib/dashboard-sample";
import { dashboardPath, demoDashboardPath, type DashboardView } from "@/lib/meter-links";
import { trackProductEvent } from "@/lib/analytics";
import type { DashboardResources, InvoiceData, MeterEnvironment } from "@/lib/dashboard-types";

type AccessState = "checking" | "locked" | "unlocked";
type LoadState = "loading" | "ready" | "failed";

const views = [
  { id: "overview" as const, label: "Overview", icon: Gauge },
  { id: "events" as const, label: "Events", icon: Activity },
  { id: "customers" as const, label: "Customers", icon: Users },
  { id: "pricing" as const, label: "Pricing", icon: BadgeDollarSign },
  { id: "billing" as const, label: "Billing runs", icon: ReceiptText },
  { id: "setup" as const, label: "Setup", icon: Settings2 },
];

function previousPeriod() {
  const now = new Date();
  return {
    periodStart: Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
    periodEnd: Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  };
}

function emptyResources(): DashboardResources {
  const period = previousPeriod();
  return {
    events: [],
    customers: [],
    rates: [],
    rules: [],
    billingRuns: [],
    billingPreview: { ...period, rows: [], blockers: [{ code: "no_usage", customerId: "", count: 0 }] },
    keys: [],
    stripe: null,
    stripeWebhookUrl: "",
  };
}

function sampleResources(): DashboardResources {
  const period = previousPeriod();
  const customers = sampleDashboardData.invoice.rows
    .filter((row) => row.customerId !== "unattributed")
    .map((row, index) => ({
      _id: "sample-customer-" + index,
      customerId: row.customerId,
      environment: "live" as const,
      name: row.customerId.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
      billingEmail: "billing@" + row.customerId + ".example",
      stripeCustomerId: "cus_sample" + String(index).padStart(8, "0"),
      status: "active" as const,
      updatedAt: sampleDashboardData.invoice.monthStart,
    }));
  const items = sampleDashboardData.invoice.rows
    .filter((row) => row.customerId !== "unattributed" && row.billedAmountUsd !== null)
    .map((row, index) => ({
      _id: "sample-item-" + index,
      customerId: row.customerId,
      customerName: row.customerId.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
      billingEmail: "billing@" + row.customerId + ".example",
      stripeCustomerId: "cus_sample" + String(index).padStart(8, "0"),
      calls: row.calls,
      tokens: row.tokens,
      rawCostCents: Math.round(row.rawCostUsd * 100),
      amountCents: Math.round((row.billedAmountUsd ?? 0) * 100),
      marginCents: row.marginUsd === null ? undefined : Math.round(row.marginUsd * 100),
      stripeStatus: "draft" as const,
      stripeInvoiceId: "in_sample" + index,
    }));
  const run = {
    _id: "sample-run",
    ...period,
    status: "exported" as const,
    customerCount: items.length,
    totalAmountCents: items.reduce((sum, item) => sum + item.amountCents, 0),
    totalRawCostCents: items.reduce((sum, item) => sum + item.rawCostCents, 0),
    closedAt: period.periodEnd + 3_600_000,
    items,
  };
  return {
    events: sampleDashboardData.usage.calls.map((call) => ({ ...call, duplicateAttempts: 0 })),
    customers,
    rates: [{
      _id: "sample-rate",
      provider: "anthropic",
      model: "claude-sonnet-4-5",
      inputUsdPerMillion: 3,
      outputUsdPerMillion: 15,
    }],
    rules: [{ _id: "sample-rule", ...sampleDashboardData.invoice.rule, baseAmountUsd: 0, includedTokens: 0, version: 1, active: true }],
    billingRuns: [run],
    billingPreview: { ...period, rows: sampleDashboardData.invoice.rows, blockers: [] },
    keys: [
      { environment: "test", keyPrefix: "tgw_test_sample...0000", createdAt: period.periodStart },
      { environment: "live", keyPrefix: "tgw_live_sample...0000", createdAt: period.periodStart },
    ],
    stripe: { keyPrefix: "rk_test_...0000", accountId: "acct_sample_us", accountCountry: "US", livemode: false, updatedAt: period.periodEnd },
    stripeWebhookUrl: "https://tollgate.example/api/stripe/webhook/sample-meter",
  };
}

function LoadingDashboard() {
  return <main className="meter-loading" aria-live="polite"><span className="meter-loading-mark">T</span><p>Opening the usage ledger...</p></main>;
}

function MeterLock({ projectId, onUnlocked }: { projectId: string; onUnlocked: () => Promise<void> }) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "opening" | "error">("idle");

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("opening");
    const response = await fetch("/p/" + encodeURIComponent(projectId) + "/dashboard/unlock", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!response.ok) { setStatus("error"); trackProductEvent("dashboard_unlock_failed", { outcome: "error", surface: "dashboard" }); return; }
    setCode("");
    await onUnlocked();
    trackProductEvent("dashboard_unlock_succeeded", { outcome: "success", surface: "dashboard" });
  }

  return <main className="meter-lock"><form onSubmit={unlock}><Link href="/" className="meter-wordmark"><span>T</span>Tollgate</Link><p className="meter-kicker">Private meter / {projectId}</p><h1>Open your usage ledger.</h1><p className="meter-lock-copy">Enter the recovery code saved when this meter was created.</p><label htmlFor="dashboard-code">Recovery code</label><input id="dashboard-code" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="off" required autoFocus /><button type="submit" disabled={status === "opening"}>{status === "opening" ? "Opening meter..." : "Open meter"}</button>{status === "error" ? <p className="meter-error" role="alert">That code does not open this meter. Check the saved setup file and try again.</p> : null}<Link className="meter-recovery-link" href="/#get-started">Create a different meter</Link></form></main>;
}

export function DashboardClient({ projectId, initialView = "overview", demo = false }: { projectId: string; initialView?: DashboardView; demo?: boolean }) {
  const [view, setView] = useState<DashboardView>(initialView);
  const [environment, setEnvironment] = useState<MeterEnvironment>(demo || initialView === "billing" ? "live" : "test");
  const [access, setAccess] = useState<AccessState>(demo ? "unlocked" : "checking");
  const [loadState, setLoadState] = useState<LoadState>(demo ? "ready" : "loading");
  const [refreshing, setRefreshing] = useState(false);
  const [invoice, setInvoice] = useState<InvoiceData | null>(demo ? sampleDashboardData.invoice : null);
  const [resources, setResources] = useState<DashboardResources>(demo ? sampleResources : emptyResources);

  const load = useCallback(async () => {
    if (demo) return;
    setRefreshing(true);
    const base = "/p/" + encodeURIComponent(projectId) + "/dashboard";
    const period = previousPeriod();
    const periodQuery = "?periodStart=" + period.periodStart + "&periodEnd=" + period.periodEnd;
    const environmentQuery = "?environment=" + environment;
    try {
      const responses = await Promise.all([
        fetch(base + "/invoices", { cache: "no-store" }),
        fetch(base + "/events" + environmentQuery, { cache: "no-store" }),
        fetch(base + "/customers" + environmentQuery, { cache: "no-store" }),
        fetch(base + "/rates" + environmentQuery, { cache: "no-store" }),
        fetch(base + "/billing-rule" + environmentQuery, { cache: "no-store" }),
        fetch(base + "/billing-runs" + periodQuery, { cache: "no-store" }),
        fetch(base + "/write-keys", { cache: "no-store" }),
        fetch(base + "/stripe", { cache: "no-store" }),
      ]);
      if (responses.some((response) => response.status === 401 || response.status === 403)) {
        setAccess("locked"); setLoadState("ready"); setRefreshing(false); return;
      }
      if (responses.some((response) => !response.ok)) throw new Error("dashboard_load_failed");
      const [nextInvoice, eventData, customerData, rateData, ruleData, billingData, keyData, stripeData] = await Promise.all(responses.map((response) => response.json()));
      setInvoice(nextInvoice as InvoiceData);
      setResources({
        events: eventData.events,
        customers: customerData.customers,
        rates: rateData.rates,
        rules: ruleData.rules,
        billingRuns: billingData.runs,
        billingPreview: billingData.preview,
        keys: keyData.keys,
        stripe: stripeData.connection,
        stripeWebhookUrl: stripeData.webhookUrl,
      });
      setAccess("unlocked");
      setLoadState("ready");
    } catch {
      setAccess((current) => current === "checking" ? "unlocked" : current);
      setLoadState("failed");
    } finally {
      setRefreshing(false);
    }
  }, [demo, environment, projectId]);

  useEffect(() => {
    if (demo) return;
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [demo, load]);

  useEffect(() => {
    const sync = () => {
      const next = new URLSearchParams(window.location.search).get("view");
      const resolved = views.some((item) => item.id === next) ? next as DashboardView : "overview";
      setView(resolved);
      if (resolved === "billing") setEnvironment("live");
    };
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  function changeView(next: DashboardView) {
    setView(next);
    if (next === "billing") setEnvironment("live");
    window.history.pushState(null, "", demo ? demoDashboardPath(next) : dashboardPath(projectId, next));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function signOut() {
    await fetch("/p/" + encodeURIComponent(projectId) + "/dashboard/signout", { method: "POST" });
    setAccess("locked");
  }

  if (access === "checking") return <LoadingDashboard />;
  if (access === "locked") return <MeterLock projectId={projectId} onUnlocked={load} />;
  if (loadState === "failed" || !invoice) return <main className="meter-failed"><div><p className="meter-kicker">Meter unavailable</p><h1>The operating data did not load.</h1><p>No usage or billing record was changed. Retry the request or reopen the meter.</p><button type="button" onClick={() => { setLoadState("loading"); void load(); }}>Retry</button></div></main>;

  const eventIssues = resources.events.filter((event) => event.status === "error" || event.customerId === "unattributed" || event.pricingStatus === "unpriced" || (event.duplicateAttempts ?? 0) > 0).length;
  const customerIssues = resources.customers.filter((customer) => !customer.billingEmail && !customer.stripeCustomerId).length;
  const setupIssues = Number(!resources.keys.find((key) => key.environment === environment)) + Number(!resources.events.length) + Number(!invoice.rule);

  return <main className="meter-shell" data-demo={demo || undefined}>
    <aside className="meter-sidebar">
      <Link href="/" className="meter-wordmark"><span>T</span>Tollgate</Link>
      <div className="active-meter"><small>{demo ? "Public sample" : "Active meter"}</small><strong>{demo ? "Sample meter" : projectId}</strong><span><i data-live={resources.events.length > 0} />{resources.events.length ? environment + " usage active" : environment + " setup incomplete"}</span></div>
      <nav aria-label="Meter navigation">{views.map((item) => { const Icon = item.icon; const badge = item.id === "events" ? eventIssues : item.id === "customers" ? customerIssues : item.id === "billing" ? resources.billingPreview.blockers.length : item.id === "setup" ? setupIssues : 0; return <button type="button" key={item.id} aria-current={view === item.id ? "page" : undefined} onClick={() => changeView(item.id)}><span><Icon size={15} strokeWidth={1.8} aria-hidden="true" />{item.label}</span>{badge ? <i className={item.id === "events" || item.id === "billing" ? "attention" : ""}>{badge}</i> : null}</button>; })}</nav>
      <div className="sidebar-foot"><span>{demo ? "Read-only sample" : "Private metadata"}</span><small>{demo ? "Sample actions never write data." : "Test and live data are isolated."}</small>{!demo ? <button className="signout-button" type="button" onClick={() => void signOut()}><LogOut size={14} aria-hidden="true" />Sign out</button> : null}</div>
    </aside>
    <section className="meter-workspace">
      {demo ? <div className="sample-dashboard-banner"><span>Read-only sample dashboard</span><Link href="/#get-started">Create a private meter</Link></div> : null}
      <div className="mobile-meter-bar"><strong>{demo ? "Sample meter" : projectId}</strong><span>{environment}</span></div>
      {view === "overview" ? <DashboardOverview invoice={invoice} onView={changeView} demo={demo} /> : null}
      {view === "events" ? <DashboardEvents events={resources.events} environment={environment} onEnvironment={setEnvironment} onReload={load} loading={refreshing} demo={demo} /> : null}
      {view === "customers" ? <DashboardCustomers projectId={projectId} environment={environment} onEnvironment={setEnvironment} customers={resources.customers} events={resources.events} invoice={invoice} onReload={load} demo={demo} /> : null}
      {view === "pricing" ? <DashboardPricing projectId={projectId} environment={environment} onEnvironment={setEnvironment} customers={resources.customers} rules={resources.rules} defaultRule={resources.rules.find((rule) => !rule.customerId) ?? (environment === "live" ? invoice.rule : null)} rates={resources.rates} onReload={load} demo={demo} /> : null}
      {view === "billing" ? <DashboardBillingRuns projectId={projectId} runs={resources.billingRuns} preview={resources.billingPreview} stripeConnected={Boolean(resources.stripe)} onReload={load} demo={demo} /> : null}
      {view === "setup" ? <DashboardSetup projectId={projectId} environment={environment} onEnvironment={setEnvironment} events={resources.events} customers={resources.customers} keys={resources.keys} stripe={resources.stripe} webhookUrl={resources.stripeWebhookUrl} hasRule={Boolean(resources.rules.find((rule) => !rule.customerId) ?? (environment === "live" ? invoice.rule : null))} onReload={load} demo={demo} /> : null}
    </section>
  </main>;
}
