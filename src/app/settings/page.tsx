import { MeterSelector } from "@/components/meter-selector";
import { redirect } from "next/navigation";
import { dashboardPath, demoDashboardPath } from "@/lib/meter-links";
import "../billing.css";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ projectId?: string; demo?: string }> }) {
  const { projectId, demo } = await searchParams;
  if (demo === "1") redirect(demoDashboardPath("pricing"));
  if (projectId) redirect(dashboardPath(projectId, "pricing"));
  return <MeterSelector page="settings" />;
}
