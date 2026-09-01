"use client";

import { Plus, Save } from "lucide-react";
import { FormEvent, useState } from "react";
import { ActionButton, EmptyState, EnvironmentToggle, Metric, RowStatus, ViewHeading, customerName, money } from "./dashboard-shared";
import { trackProductEvent } from "@/lib/analytics";
import type { CustomerRecord, DashboardCall, InvoiceData, MeterEnvironment } from "@/lib/dashboard-types";

function CustomerEditor({ customer, environment, projectId, onSaved, demo }: {
  customer: CustomerRecord | null;
  environment: MeterEnvironment;
  projectId: string;
  onSaved: () => Promise<void>;
  demo: boolean;
}) {
  const [customerId, setCustomerId] = useState(customer?.customerId ?? "");
  const [name, setName] = useState(customer?.name ?? "");
  const [billingEmail, setBillingEmail] = useState(customer?.billingEmail ?? "");
  const [stripeCustomerId, setStripeCustomerId] = useState(customer?.stripeCustomerId ?? "");
  const [status, setStatus] = useState(customer?.status ?? "active");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (demo) { setMessage("Sample customers are read-only."); return; }
    setSaving(true); setMessage("");
    const response = await fetch(`/p/${encodeURIComponent(projectId)}/dashboard/customers`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ environment, customerId, name, billingEmail, stripeCustomerId, status }),
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) { setSaving(false); setMessage(result.error ?? "Customer could not be saved"); return; }
    await onSaved(); setSaving(false); setMessage("Customer saved.");
    trackProductEvent("customer_saved", { environment, outcome: "success", surface: "dashboard" });
  }

  return <form className="customer-editor" onSubmit={save}>
    <header><div><p className="meter-kicker">Billing identity</p><h2>{customer ? customerName(customer.customerId) : "Add customer"}</h2></div>{customer ? <RowStatus tone={customer.status === "active" ? "good" : "attention"}>{customer.status}</RowStatus> : null}</header>
    <div className="field-grid">
      <label><span>Customer header ID</span><input value={customerId} disabled={Boolean(customer)} onChange={(event) => setCustomerId(event.target.value)} placeholder="customer-acme" required /></label>
      <label><span>Display name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Acme Inc." /></label>
      <label><span>Billing email</span><input type="email" value={billingEmail} onChange={(event) => setBillingEmail(event.target.value)} placeholder="billing@acme.com" /></label>
      <label><span>Stripe customer ID</span><input value={stripeCustomerId} onChange={(event) => setStripeCustomerId(event.target.value)} placeholder="cus_..." /></label>
      <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as "active" | "archived")}><option value="active">Active</option><option value="archived">Archived</option></select></label>
    </div>
    <footer><p role="status" data-error={Boolean(message && message !== "Customer saved." && !message.includes("read-only"))}>{message || "Billing runs require an active customer plus an email or Stripe customer ID."}</p><ActionButton icon={Save} disabled={saving}>{saving ? "Saving" : "Save customer"}</ActionButton></footer>
  </form>;
}

export function DashboardCustomers({ projectId, environment, onEnvironment, customers, events, invoice, onReload, demo = false }: {
  projectId: string;
  environment: MeterEnvironment;
  onEnvironment: (environment: MeterEnvironment) => void;
  customers: CustomerRecord[];
  events: DashboardCall[];
  invoice: InvoiceData;
  onReload: () => Promise<void>;
  demo?: boolean;
}) {
  const [selectedId, setSelectedId] = useState(customers[0]?.customerId ?? "");
  const selected = customers.find((customer) => customer.customerId === selectedId) ?? customers[0] ?? null;
  const customerEvents = selected ? events.filter((event) => event.customerId === selected.customerId) : [];
  const liveRow = selected ? invoice.rows.find((row) => row.customerId === selected.customerId) : null;
  const totals = customerEvents.reduce((value, event) => ({ calls: value.calls + 1, tokens: value.tokens + event.promptTokens + event.completionTokens, raw: value.raw + (event.providerCostUsd ?? event.estimatedCostUsd ?? 0) }), { calls: 0, tokens: 0, raw: 0 });
  const needsDetails = customers.filter((customer) => !customer.billingEmail && !customer.stripeCustomerId).length;

  return <div className="meter-view customers-view">
    <ViewHeading eyebrow={`${environment} customers`} title="Map usage to billing identities." description="The header ID stays stable in code. Names, billing contacts, and Stripe mappings can change without rewriting events." state={needsDetails ? `${needsDetails} need details` : `${customers.length} ready`} tone={needsDetails ? "attention" : customers.length ? "good" : "neutral"} />
    <div className="view-toolbar"><EnvironmentToggle value={environment} onChange={onEnvironment} disabled={demo} /><ActionButton tone="secondary" icon={Plus} onClick={() => setSelectedId("")}>Add customer</ActionButton></div>
    <div className="customer-operating-grid">
      <aside className="customer-record-index" aria-label="Customer records">{customers.length ? customers.map((customer) => <button type="button" key={customer._id} aria-current={selected?.customerId === customer.customerId ? "true" : undefined} onClick={() => setSelectedId(customer.customerId)}><span><strong>{customer.name || customerName(customer.customerId)}</strong><small>{customer.customerId}</small></span>{customer.billingEmail || customer.stripeCustomerId ? <RowStatus tone="good">ready</RowStatus> : <RowStatus tone="attention">details</RowStatus>}</button>) : <EmptyState title="No customers" body="Add one now or send an attributed request to create a record automatically." />}</aside>
      <section className="customer-operation-detail">
        <CustomerEditor key={`${environment}:${selected?.customerId ?? "new"}`} customer={selectedId === "" ? null : selected} environment={environment} projectId={projectId} onSaved={onReload} demo={demo} />
        {selected ? <>
          <dl className="customer-facts">
            <Metric label="Calls" value={(liveRow?.calls ?? totals.calls).toLocaleString()} note={environment === "live" ? "Current live month" : "Recent test events"} />
            <Metric label="Tokens" value={(liveRow?.tokens ?? totals.tokens).toLocaleString()} note={`Raw cost ${money(liveRow?.rawCostUsd ?? totals.raw)}`} />
            <Metric label="Projected charge" value={environment === "live" ? money(liveRow?.billedAmountUsd ?? null, "No usage") : "Never billed"} note={environment === "live" ? "Before month close" : "Test is isolated"} />
          </dl>
          <div className="customer-event-list"><header><p className="meter-kicker">Recent evidence</p><h2>Attributed events</h2></header>{customerEvents.length ? customerEvents.slice(0, 8).map((event) => <article key={event._id}><span><strong>{event.provider}</strong><small>{event.requestedModel}</small></span><b>{(event.promptTokens + event.completionTokens).toLocaleString()} tokens</b><time>{new Date(event.createdAt).toLocaleString()}</time></article>) : <EmptyState title="No recent events" body={`No ${environment} events use this customer ID.`} />}</div>
        </> : null}
      </section>
    </div>
  </div>;
}
