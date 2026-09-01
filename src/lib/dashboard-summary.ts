import type { PricedInvoiceRow } from "./billing";

export type DashboardInvoiceRow = PricedInvoiceRow;

export function summarizeBilling(rows: DashboardInvoiceRow[]) {
  let calls = 0;
  let tokens = 0;
  let rawCostUsd = 0;
  let totalBilledUsd: number | null = 0;
  let marginUsd: number | null = 0;
  let unattributedCalls = 0;
  let unknownCostCalls = 0;

  for (const row of rows) {
    calls += row.calls;
    tokens += row.tokens;
    rawCostUsd += row.rawCostUsd;
    unknownCostCalls += row.unknownCostCalls;
    if (row.customerId === "unattributed") unattributedCalls += row.calls;
    totalBilledUsd = totalBilledUsd === null || row.billedAmountUsd === null
      ? null
      : totalBilledUsd + row.billedAmountUsd;
    marginUsd = marginUsd === null || row.marginUsd === null
      ? null
      : marginUsd + row.marginUsd;
  }

  return {
    calls,
    tokens,
    customers: rows.length,
    rawCostUsd,
    totalBilledUsd,
    marginUsd,
    unattributedCalls,
    unknownCostCalls,
  };
}
