import { MeterSelector } from "@/components/meter-selector";
import { redirect } from "next/navigation";
import { dashboardPath, demoDashboardPath } from "@/lib/meter-links";
import "../billing.css";

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ projectId?: string; demo?: string }> }) {
  const { projectId, demo } = await searchParams;
  if (demo === "1") redirect(demoDashboardPath("overview"));
  if (projectId) redirect(dashboardPath(projectId, "overview"));
  return <MeterSelector page="invoices" />;
}
