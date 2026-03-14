import { CustomerManager } from "@/components/master-data/master-data-managers";
import { WorkbenchPanel } from "@/components/workbench/workbench-panel";
import { requireActiveMembership } from "@/services/auth";
import { getCustomersWorkbench } from "@/services/master-data";

export default async function CustomersPage() {
  const membership = await requireActiveMembership();
  const data = await getCustomersWorkbench(membership);

  return (
    <div className="space-y-6">
      <WorkbenchPanel
        eyebrow="Customer Master Data"
        title="Maintain customer master data"
        description="Operations teams can create new customers and edit existing ones without leaving the workspace."
      >
        <CustomerManager data={data} />
      </WorkbenchPanel>
    </div>
  );
}
