import type { LucideIcon } from "lucide-react";
import type { MeterEnvironment } from "@/lib/dashboard-types";

export const money = (value: number | null, empty = "Incomplete") => value === null
  ? empty
  : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(value);

export const cents = (value: number) => money(value / 100);

export const customerName = (customerId: string) => customerId === "unattributed"
  ? "Unattributed"
  : customerId.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="meter-metric"><dt>{label}</dt><dd>{value}</dd><small>{note}</small></div>;
}

export function ViewHeading({ eyebrow, title, description, state, tone = "neutral" }: {
  eyebrow: string;
  title: string;
  description: string;
  state?: string;
  tone?: "neutral" | "good" | "attention";
}) {
  return <header className="view-heading"><div><p className="meter-kicker">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{state ? <span className={`meter-state ${tone === "attention" ? "attention" : ""}`} data-live={tone === "good" || undefined}>{state}</span> : null}</header>;
}

export function EnvironmentToggle({ value, onChange, disabled = false }: {
  value: MeterEnvironment;
  onChange: (environment: MeterEnvironment) => void;
  disabled?: boolean;
}) {
  return <div className="environment-toggle" aria-label="Data environment">
    <button type="button" aria-pressed={value === "test"} disabled={disabled} onClick={() => onChange("test")}>Test</button>
    <button type="button" aria-pressed={value === "live"} disabled={disabled} onClick={() => onChange("live")}>Live</button>
  </div>;
}

export function ActionButton({ icon: Icon, children, tone = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon;
  tone?: "primary" | "secondary" | "danger";
}) {
  return <button {...props} className={`dashboard-action ${tone} ${props.className ?? ""}`}><span>{children}</span>{Icon ? <Icon aria-hidden="true" size={15} strokeWidth={1.8} /> : null}</button>;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return <div className="dashboard-empty"><strong>{title}</strong><p>{body}</p>{action}</div>;
}

export function RowStatus({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "attention" | "bad" }) {
  return <span className="row-status" data-tone={tone}>{children}</span>;
}
