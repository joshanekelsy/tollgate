"use client";

import { Download, FileLock2, Send } from "lucide-react";
import { useState } from "react";
import { ActionButton, EmptyState, RowStatus, ViewHeading, cents } from "./dashboard-shared";
import { trackProductEvent } from "@/lib/analytics";
import type { BillingBlocker, BillingPreview, BillingRun } from "@/lib/dashboard-types";

const blockerText: Record<string, string> = {
  unattributed: "Calls are missing a customer ID",
  missing_customer: "Customer record is missing",
  inactive_customer: "Customer is archived",
  missing_billing_contact: "Billing email or Stripe customer ID is missing",
  missing_rule: "No price rule applies",
  unpriced: "Raw model cost is unavailable for percentage pricing",
  no_usage: "No billable usage exists in this period",
};

function Blockers({ blockers }: { blockers: BillingBlocker[] }) {
  return <div className="billing-blockers">{blockers.map((blocker, index) => <div key={`${blocker.code}:${blocker.customerId}:${index}`}><span>{blocker.customerId || "Billing period"}</span><strong>{blockerText[blocker.code] ?? blocker.code}</strong><b>{blocker.count || ""}</b></div>)}</div>;
}

export function DashboardBillingRuns({ projectId, runs, preview, stripeConnected, onReload, demo = false }: {
  projectId: string;
  runs: BillingRun[];
  preview: BillingPreview;
  stripeConnected: boolean;
  onReload: () => Promise<void>;
  demo?: boolean;
}) {
  const [selectedId, setSelectedId] = useState(runs[0]?._id ?? "");
  const [working, setWorking] = useState<"" | "close" | "stripe">("");
  const [message, setMessage] = useState("");
  const selected = runs.find((run) => run._id === selectedId) ?? runs[0] ?? null;
  const closedPeriod = runs.find((run) => run.periodStart === preview.periodStart && run.periodEnd === preview.periodEnd) ?? null;
  const previewTotalCents = closedPeriod?.totalAmountCents ?? Math.round(preview.rows.reduce((sum, row) => sum + (row.billedAmountUsd ?? 0), 0) * 100);
  const period = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(preview.periodStart);

  async function closeRun() {
    if (demo) { setMessage("Sample billing runs are read-only."); return; }
    setWorking("close"); setMessage("");
    const response = await fetch(`/p/${encodeURIComponent(projectId)}/dashboard/billing-runs`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ periodStart: preview.periodStart, periodEnd: preview.periodEnd }) });
    const result = await response.json() as { blockers?: BillingBlocker[]; error?: string };
    if (!response.ok) { setWorking(""); setMessage(result.error ?? `${result.blockers?.length ?? 0} blockers still prevent close.`); return; }
    await onReload(); setWorking(""); setMessage("Billing run closed. Its customer amounts are now fixed.");
    trackProductEvent("billing_run_closed", { environment: "live", outcome: "success", surface: "dashboard" });
  }

  async function pushStripe(run: BillingRun) {
    if (demo) { setMessage("Sample billing runs are read-only."); return; }
    setWorking("stripe"); setMessage("");
    const response = await fetch(`/p/${encodeURIComponent(projectId)}/dashboard/billing-runs/${encodeURIComponent(run._id)}/stripe`, { method: "POST" });
    const result = await response.json() as { error?: string };
    await onReload(); setWorking(""); setMessage(response.ok ? "Stripe draft creation finished. Review every draft in Stripe before sending." : result.error ?? "Stripe export failed.");
    if (response.ok) trackProductEvent("stripe_drafts_created", { environment: "live", outcome: "success", surface: "dashboard" });
  }

  return <div className="meter-view billing-runs-view">
    <ViewHeading eyebrow="Live billing only" title="Close once. Export without duplicates." description="A closed run copies fixed usage, customer, and price evidence. Later edits cannot rewrite it." state={closedPeriod ? "Period closed" : preview.blockers.length ? `${preview.blockers.length} blockers` : "Preview ready"} tone={closedPeriod || !preview.blockers.length ? "good" : "attention"} />
    <section className="close-preview"><header><div><p className="meter-kicker">{closedPeriod ? "Fixed period" : "Completed period preview"}</p><h2>{period}</h2></div><strong>{cents(previewTotalCents)}</strong></header><dl><div><dt>Customers</dt><dd>{closedPeriod?.customerCount ?? preview.rows.length}</dd></div><div><dt>Period end</dt><dd>{new Date(preview.periodEnd).toLocaleDateString()}</dd></div><div><dt>Close state</dt><dd>{closedPeriod ? "Closed" : preview.blockers.length ? "Blocked" : "Ready"}</dd></div></dl>{closedPeriod ? <p className="close-contract"><FileLock2 size={16} aria-hidden="true" /> This amount is fixed. Pricing and customer edits cannot rewrite it.</p> : preview.blockers.length ? <Blockers blockers={preview.blockers} /> : <p className="close-contract"><FileLock2 size={16} aria-hidden="true" /> Closing freezes these customer amounts and their source call IDs.</p>}<footer><p role="status">{message}</p><ActionButton icon={FileLock2} disabled={Boolean(closedPeriod) || working !== "" || preview.blockers.length > 0} onClick={() => void closeRun()}>{closedPeriod ? "Already closed" : working === "close" ? "Closing" : "Close billing run"}</ActionButton></footer></section>

    <section className="run-history"><header><div><p className="meter-kicker">Fixed statements</p><h2>Billing run history</h2></div></header>{runs.length ? <div className="run-workspace"><aside>{runs.map((run) => <button type="button" key={run._id} aria-current={selected?._id === run._id ? "true" : undefined} onClick={() => setSelectedId(run._id)}><span><strong>{new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(run.periodStart)}</strong><small>{run.customerCount} customers</small></span><b>{cents(run.totalAmountCents)}</b><RowStatus tone={run.status === "partial" ? "bad" : run.status === "exported" ? "good" : "neutral"}>{run.status}</RowStatus></button>)}</aside>{selected ? <section className="run-detail"><header><div><h3>{new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(selected.periodStart)}</h3><p>Closed {new Date(selected.closedAt).toLocaleString()}</p></div><div className="run-actions"><a className="dashboard-action secondary" href={`/p/${encodeURIComponent(projectId)}/dashboard/billing-runs/${encodeURIComponent(selected._id)}/csv`}><span>CSV</span><Download size={15} aria-hidden="true" /></a><ActionButton icon={Send} disabled={working !== "" || !stripeConnected} onClick={() => void pushStripe(selected)}>{working === "stripe" ? "Creating drafts" : "Create Stripe drafts"}</ActionButton></div></header>{!stripeConnected ? <p className="inline-warning">Connect a US Stripe account in Setup before exporting.</p> : null}<div className="data-table-wrap"><table className="dashboard-table"><thead><tr><th>Customer</th><th>Calls</th><th>Tokens</th><th>Amount</th><th>Stripe</th></tr></thead><tbody>{selected.items.map((item) => <tr key={item._id}><th>{item.customerName}<small>{item.customerId}</small></th><td>{item.calls.toLocaleString()}</td><td>{item.tokens.toLocaleString()}</td><td><strong>{cents(item.amountCents)}</strong></td><td><RowStatus tone={item.stripeStatus === "failed" ? "bad" : ["paid", "open", "draft"].includes(item.stripeStatus) ? "good" : "neutral"}>{item.stripeStatus.replace("_", " ")}</RowStatus>{item.stripeError ? <small>{item.stripeError}</small> : null}</td></tr>)}</tbody></table></div></section> : null}</div> : <EmptyState title="No closed billing runs" body="Resolve the preview blockers, then close the first completed UTC month." />}</section>
  </div>;
}
