type CsvRun = {
  periodStart: number;
  periodEnd: number;
  items: Array<{
    customerId: string;
    customerName: string;
    billingEmail?: string;
    calls: number;
    tokens: number;
    rawCostCents: number;
    amountCents: number;
    marginCents?: number;
    stripeStatus: string;
  }>;
};

function cell(value: string | number) {
  let text = String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const date = (value: number) => new Date(value).toISOString().slice(0, 10);
const dollars = (cents: number) => (cents / 100).toFixed(2);

export function billingRunCsv(run: CsvRun) {
  const header = ["period_start", "period_end", "customer_id", "customer_name", "billing_email", "calls", "tokens", "raw_cost_usd", "amount_usd", "margin_usd", "stripe_status"];
  const rows = run.items.map((item) => [
    date(run.periodStart),
    date(run.periodEnd),
    item.customerId,
    item.customerName,
    item.billingEmail ?? "",
    item.calls,
    item.tokens,
    dollars(item.rawCostCents),
    dollars(item.amountCents),
    item.marginCents === undefined ? "" : dollars(item.marginCents),
    item.stripeStatus,
  ].map(cell).join(","));
  return [header.join(","), ...rows].join("\n");
}
