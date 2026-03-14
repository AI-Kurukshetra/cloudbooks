import { EntityManager } from "@/components/master-data/master-data-managers";
import { WorkbenchPanel } from "@/components/workbench/workbench-panel";
import { requireActiveMembership } from "@/services/auth";
import { getEntitiesWorkbench } from "@/services/master-data";

export default async function EntitiesPage() {
  const membership = await requireActiveMembership();
  const data = await getEntitiesWorkbench(membership);

  return (
    <div className="space-y-6">
      <WorkbenchPanel
        eyebrow="Entity Management"
        title="Maintain legal entities"
        description="Controllers can create and update reporting entities directly from the workspace without dropping into SQL."
      >
        <EntityManager data={data} />
      </WorkbenchPanel>
    </div>
  );
}
