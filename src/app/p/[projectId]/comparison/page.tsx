import { redirect } from "next/navigation";
import { dashboardPath } from "@/lib/meter-links";

export default async function ComparisonPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  redirect(`${dashboardPath(projectId, "setup")}#model-test`);
}
