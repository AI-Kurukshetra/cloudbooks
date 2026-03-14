import { BudgetForm } from "@/components/forms/operations-forms";
import { RecordsTableCard } from "@/components/master-data/records-table-card";
import { WorkbenchPanel } from "@/components/workbench/workbench-panel";
import { requireActiveMembership } from "@/services/auth";
import { getBudgetsWorkbench } from "@/services/operations";

export default async function BudgetsPage() {
  const membership = await requireActiveMembership();
  const data = await getBudgetsWorkbench(membership);

  return (
    <div className="space-y-6">
      <WorkbenchPanel
        eyebrow="Budget Planning"
        title="Create budgets and budget lines"
        description="Finance users can create operating budgets directly in the workspace and tie each line to accounts and optional fiscal periods."
      >
        <BudgetForm data={data} />
      </WorkbenchPanel>
      <RecordsTableCard
        title="Existing budgets"
        description="Budgets currently available for variance reporting."
        rows={data.records}
      />
    </div>
  );
}
