import { ManualJournalForm } from "@/components/forms/operations-forms";
import { RecordsTableCard } from "@/components/master-data/records-table-card";
import { WorkbenchPanel } from "@/components/workbench/workbench-panel";
import { requireActiveMembership } from "@/services/auth";
import { getJournalWorkbench } from "@/services/operations";

export default async function JournalPage() {
  const membership = await requireActiveMembership();
  const data = await getJournalWorkbench(membership);

  return (
    <div className="space-y-6">
      <WorkbenchPanel
        eyebrow="Manual Journal"
        title="Post balanced manual journals"
        description="Controllers can create manual journals directly in the workspace. Entries must balance before they are posted."
      >
        <ManualJournalForm data={data} />
      </WorkbenchPanel>
      <RecordsTableCard
        title="Recent journal entries"
        description="Latest posted and draft journals for the active entity."
        rows={data.records}
      />
    </div>
  );
}
