import { VendorManager } from "@/components/master-data/master-data-managers";
import { WorkbenchPanel } from "@/components/workbench/workbench-panel";
import { requireActiveMembership } from "@/services/auth";
import { getVendorsWorkbench } from "@/services/master-data";

export default async function VendorsPage() {
  const membership = await requireActiveMembership();
  const data = await getVendorsWorkbench(membership);

  return (
    <div className="space-y-6">
      <WorkbenchPanel
        eyebrow="Vendor Master Data"
        title="Maintain vendor master data"
        description="AP teams can onboard vendors, adjust terms, and inactivate records directly from the application."
      >
        <VendorManager data={data} />
      </WorkbenchPanel>
    </div>
  );
}
