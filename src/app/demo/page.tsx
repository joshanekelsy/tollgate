import type { Metadata } from "next";
import { DashboardClient } from "@/components/dashboard-client";
import type { DashboardView } from "@/lib/meter-links";

export const metadata: Metadata = {
  title: "Tollgate sample dashboard — Customer usage and billing",
  description: "Explore a read-only Tollgate dashboard with sample customer usage, raw model cost, pricing, billed amounts, and setup.",
};

const dashboardViews = new Set<DashboardView>(["overview", "events", "customers", "pricing", "billing", "setup"]);

export default async function DemoPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  const initialView = view && dashboardViews.has(view as DashboardView) ? view as DashboardView : "overview";
  return <DashboardClient projectId="sample-meter" initialView={initialView} demo />;
}
