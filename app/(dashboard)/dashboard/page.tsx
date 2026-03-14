import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { requireActiveMembership } from "@/services/auth";
import { getDashboardSnapshot } from "@/services/dashboard";

export default async function DashboardPage() {
  const membership = await requireActiveMembership();
  const snapshot = await getDashboardSnapshot(membership);

  return <DashboardOverview initialData={snapshot} />;
}
