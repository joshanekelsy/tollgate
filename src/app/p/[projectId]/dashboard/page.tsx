import { DashboardClient } from "@/components/dashboard-client";
import type { DashboardView } from "@/lib/meter-links";

const dashboardViews = new Set<DashboardView>(["overview", "events", "customers", "pricing", "billing", "setup"]);

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const [{ projectId }, { view }] = await Promise.all([params, searchParams]);
  const initialView = view && dashboardViews.has(view as DashboardView) ? view as DashboardView : "overview";
  return <DashboardClient projectId={projectId} initialView={initialView} />;
}
