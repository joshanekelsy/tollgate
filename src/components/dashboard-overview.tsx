import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { ActionButton, EmptyState, Metric, ViewHeading, customerName, money } from "./dashboard-shared";
import { summarizeBilling } from "@/lib/dashboard-summary";
import type { DashboardView } from "@/lib/meter-links";
import type { InvoiceData } from "@/lib/dashboard-types";

export function DashboardOverview({ invoice, onView, demo = false }: {
  invoice: InvoiceData;
  onView: (view: DashboardView) => void;
  demo?: boolean;
}) {
  const summary = summarizeBilling(invoice.rows);
  const month = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(invoice.monthStart);
  const issues = [
    summary.unattributedCalls ? { label: `${summary.unattributedCalls} unattributed call${summary.unattributedCalls === 1 ? "" : "s"}`, view: "events" as const } : null,
    summary.unknownCostCalls ? { label: `${summary.unknownCostCalls} unpriced call${summary.unknownCostCalls === 1 ? "" : "s"}`, view: "pricing" as const } : null,
    !invoice.rule ? { label: "Default price rule missing", view: "pricing" as const } : null,
  ].filter((item) => item !== null);

  return <div className="meter-view overview-view">
    <ViewHeading
      eyebrow={demo ? "Read-only sample" : "Live billing period"}
      title={demo ? "Sample revenue control room" : month}
      description="Trace usage to a customer, resolve billing blockers, and close only verified charges."
      state={issues.length ? `${issues.length} blocker${issues.length === 1 ? "" : "s"}` : "Ready to review"}
      tone={issues.length ? "attention" : "good"}
    />
    <dl className="meter-metrics">
      <Metric label="Projected charges" value={invoice.rule ? money(summary.totalBilledUsd) : "Rule required"} note={`${summary.customers} customer${summary.customers === 1 ? "" : "s"}`} />
      <Metric label="Raw model cost" value={money(summary.rawCostUsd)} note={`${summary.calls.toLocaleString()} accepted calls`} />
      <Metric label="Projected margin" value={invoice.rule ? money(summary.marginUsd) : "Not calculated"} note={`${summary.tokens.toLocaleString()} tokens`} />
    </dl>

    <section className="operations-band" aria-labelledby="attention-title">
      <header><div><p className="meter-kicker">Close readiness</p><h2 id="attention-title">{issues.length ? "Resolve these before month close" : "Current usage passes the first checks"}</h2></div>{issues.length ? <AlertTriangle size={20} aria-hidden="true" /> : <CheckCircle2 size={20} aria-hidden="true" />}</header>
      {issues.length ? <div className="operation-list">{issues.map((issue) => <button key={issue.label} type="button" onClick={() => onView(issue.view)}><span>{issue.label}</span><ArrowRight size={15} aria-hidden="true" /></button>)}</div> : <div className="operation-ready"><p>No unattributed or unpriced calls are visible in this period. Review customer billing details before closing.</p><ActionButton icon={ArrowRight} onClick={() => onView("billing")}>Review billing run</ActionButton></div>}
    </section>

    <section className="ledger-section" aria-labelledby="overview-ledger-title">
      <header><div><p className="meter-kicker">Customer ledger</p><h2 id="overview-ledger-title">Current live totals</h2></div>{invoice.rows.length ? <ActionButton tone="secondary" icon={ArrowRight} onClick={() => onView("customers")}>Open customers</ActionButton> : null}</header>
      {invoice.rows.length ? <div className="data-table-wrap"><table className="dashboard-table"><thead><tr><th>Customer</th><th>Calls</th><th>Tokens</th><th>Raw cost</th><th>Projected</th><th>Margin</th></tr></thead><tbody>{invoice.rows.map((row) => <tr key={row.customerId} data-attention={row.customerId === "unattributed"}><th>{customerName(row.customerId)}{row.unknownCostCalls ? <small>{row.unknownCostCalls} unpriced</small> : null}</th><td>{row.calls.toLocaleString()}</td><td>{row.tokens.toLocaleString()}</td><td>{money(row.rawCostUsd)}</td><td><strong>{money(row.billedAmountUsd, "Blocked")}</strong></td><td>{money(row.marginUsd)}</td></tr>)}</tbody></table></div> : <EmptyState title="No live usage yet" body="Test data is isolated. Send a live request when you are ready to create billable usage." action={<ActionButton icon={ArrowRight} onClick={() => onView("setup")}>Open setup</ActionButton>} />}
    </section>
  </div>;
}
