import { ProjectManager } from "@/components/master-data/master-data-managers";
import { WorkbenchPanel } from "@/components/workbench/workbench-panel";
import { requireActiveMembership } from "@/services/auth";
import { getProjectsWorkbench } from "@/services/master-data";

export default async function ProjectsPage() {
  const membership = await requireActiveMembership();
  const data = await getProjectsWorkbench(membership);

  return (
    <div className="space-y-6">
      <WorkbenchPanel
        eyebrow="Project Accounting"
        title="Maintain project master data"
        description="Project accounting teams can create, update, and close projects directly from the app."
      >
        <ProjectManager data={data} />
      </WorkbenchPanel>
    </div>
  );
}
