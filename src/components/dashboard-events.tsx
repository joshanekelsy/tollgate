"use client";

import { RefreshCw, Search } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { ActionButton, EmptyState, EnvironmentToggle, RowStatus, ViewHeading, customerName, money } from "./dashboard-shared";
import type { DashboardCall, MeterEnvironment } from "@/lib/dashboard-types";

type EventFilter = "all" | "accepted" | "failed" | "duplicate" | "unattributed" | "unpriced";

function stateFor(call: DashboardCall): Exclude<EventFilter, "all"> {
  if (call.status === "error" || call.eventStatus === "failed") return "failed";
  if ((call.duplicateAttempts ?? 0) > 0) return "duplicate";
  if (call.customerId === "unattributed") return "unattributed";
  if (call.pricingStatus === "unpriced" || call.costStatus === "unavailable") return "unpriced";
  return "accepted";
}

const toneFor = (state: ReturnType<typeof stateFor>) => state === "accepted" ? "good" : state === "failed" ? "bad" : "attention";

export function DashboardEvents({ events, environment, onEnvironment, onReload, loading, demo = false }: {
  events: DashboardCall[];
  environment: MeterEnvironment;
  onEnvironment: (environment: MeterEnvironment) => void;
  onReload: () => Promise<void>;
  loading: boolean;
  demo?: boolean;
}) {
  const [filter, setFilter] = useState<EventFilter>("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const visible = events.filter((call) => {
    const state = stateFor(call);
    if (filter !== "all" && state !== filter) return false;
    if (!deferredQuery) return true;
    return [call.customerId, call.provider, call.requestedModel, call.idempotencyKey, call.errorCode].some((value) => value?.toLowerCase().includes(deferredQuery));
  });
  const counts = events.reduce<Record<string, number>>((total, call) => {
    total[stateFor(call)] = (total[stateFor(call)] ?? 0) + 1;
    return total;
  }, {});

  return <div className="meter-view events-view">
    <ViewHeading eyebrow={`${environment} event ledger`} title="Every accepted and rejected call." description="Inspect safe usage metadata, retry collisions, customer attribution, and price coverage without storing request content." state={`${events.length} recent`} tone={events.length ? "good" : "neutral"} />
    <div className="view-toolbar">
      <EnvironmentToggle value={environment} onChange={onEnvironment} disabled={demo} />
      <label className="search-control"><Search size={15} aria-hidden="true" /><span className="sr-only">Search events</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Customer, provider, model, retry ID" /></label>
      <ActionButton tone="secondary" icon={RefreshCw} disabled={demo || loading} onClick={() => void onReload()}>{loading ? "Refreshing" : "Refresh"}</ActionButton>
    </div>
    <div className="event-filters" role="tablist" aria-label="Event state">{(["all", "accepted", "failed", "duplicate", "unattributed", "unpriced"] as const).map((value) => <button type="button" role="tab" aria-selected={filter === value} key={value} onClick={() => setFilter(value)}><span>{value}</span><b>{value === "all" ? events.length : counts[value] ?? 0}</b></button>)}</div>
    {visible.length ? <div className="data-table-wrap"><table className="dashboard-table events-table"><thead><tr><th>State</th><th>Customer</th><th>Provider / model</th><th>Usage</th><th>Cost</th><th>Received</th></tr></thead><tbody>{visible.map((call) => {
      const state = stateFor(call);
      const rawCost = call.providerCostUsd ?? call.estimatedCostUsd;
      return <tr key={call._id}><td><RowStatus tone={toneFor(state)}>{state}</RowStatus>{call.duplicateAttempts ? <small>{call.duplicateAttempts} blocked retr{call.duplicateAttempts === 1 ? "y" : "ies"}</small> : null}</td><th>{customerName(call.customerId)}<small>{call.idempotencyKey}</small></th><td>{call.provider}<small>{call.requestedModel}</small></td><td>{(call.promptTokens + call.completionTokens).toLocaleString()} tokens<small>{call.latencyMs.toLocaleString()} ms</small></td><td>{rawCost === undefined ? "Unavailable" : money(rawCost)}<small>{call.pricingSource?.replace("_", " ") ?? call.costStatus}</small></td><td>{new Date(call.createdAt).toLocaleString()}<small>{call.errorCode ?? call.environment}</small></td></tr>;
    })}</tbody></table></div> : <EmptyState title="No matching events" body={events.length ? "Change the filters or search text." : `No ${environment} calls have been recorded.`} />}
  </div>;
}
