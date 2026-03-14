import { BankSyncImportCard } from "@/components/banking/bank-sync-import-card";
import { BankRuleForm } from "@/components/banking/bank-rule-form";
import {
  BankAccountForm,
  BankTransactionForm,
  ReconciliationForm,
} from "@/components/forms/operations-forms";
import { RecordsTableCard } from "@/components/master-data/records-table-card";
import { WorkbenchPanel } from "@/components/workbench/workbench-panel";
import { requireActiveMembership } from "@/services/auth";
import { getBankingWorkbench } from "@/services/operations";

export default async function BankingPage() {
  const membership = await requireActiveMembership();
  const data = await getBankingWorkbench(membership);

  return (
    <div className="space-y-6">
      <WorkbenchPanel
        eyebrow="Banking"
        title="Create bank accounts, transactions, and reconciliations"
        description="Treasury users can maintain banking structures directly from the app and import external bank feed files without leaving the workspace."
      >
        <div className="space-y-8">
          <BankSyncImportCard bankAccounts={data.bankAccounts} />
          <section>
            <h3 className="mb-4 text-lg font-semibold">Bank accounts</h3>
            <BankAccountForm data={data} />
          </section>
          <section>
            <h3 className="mb-4 text-lg font-semibold">Bank transactions</h3>
            <BankTransactionForm data={data} />
          </section>
          <section>
            <h3 className="mb-4 text-lg font-semibold">Categorization rules</h3>
            <BankRuleForm data={data} />
          </section>
          <section>
            <h3 className="mb-4 text-lg font-semibold">Reconciliations</h3>
            <ReconciliationForm data={data} />
          </section>
        </div>
      </WorkbenchPanel>
      <div className="grid gap-6 xl:grid-cols-3">
        <RecordsTableCard title="Bank accounts" description="Linked cash accounts and bank relationships." rows={data.accountRecords} />
        <RecordsTableCard title="Bank transactions" description="Recent manually entered or synced transactions." rows={data.transactionRecords} />
        <RecordsTableCard title="Reconciliations" description="Recent reconciliation runs by statement date." rows={data.reconciliationRecords} />
      </div>
      <RecordsTableCard title="Categorization rules" description="Active auto-categorization rules applied during bank feed import." rows={data.categorizationRuleRecords} />
    </div>
  );
}
