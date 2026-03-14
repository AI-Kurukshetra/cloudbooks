import { AccountManager } from "@/components/master-data/master-data-managers";
import { WorkbenchPanel } from "@/components/workbench/workbench-panel";
import { requireActiveMembership } from "@/services/auth";
import { getAccountsWorkbench } from "@/services/master-data";

export default async function AccountsPage() {
  const membership = await requireActiveMembership();
  const data = await getAccountsWorkbench(membership);

  return (
    <div className="space-y-6">
      <WorkbenchPanel
        eyebrow="Chart of Accounts"
        title="Maintain chart of accounts"
        description="Controllers can create, revise, and deactivate accounts directly in the application."
      >
        <AccountManager data={data} />
      </WorkbenchPanel>
    </div>
  );
}
