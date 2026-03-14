import {
  FiscalPeriodForm,
  TaxRateForm,
} from "@/components/forms/operations-forms";
import { RecordsTableCard } from "@/components/master-data/records-table-card";
import { WorkbenchPanel } from "@/components/workbench/workbench-panel";
import { requireActiveMembership } from "@/services/auth";
import { getSettingsWorkbench } from "@/services/operations";

export default async function SettingsPage() {
  const membership = await requireActiveMembership();
  const data = await getSettingsWorkbench(membership);

  return (
    <div className="space-y-6">
      <WorkbenchPanel
        eyebrow="Administration"
        title="Create tax rates and fiscal periods"
        description="Admins can maintain tax compliance and close-calendar structures directly in the application."
      >
        <div className="space-y-8">
          <section>
            <h3 className="mb-4 text-lg font-semibold">Tax rates</h3>
            <TaxRateForm data={data} />
          </section>
          <section>
            <h3 className="mb-4 text-lg font-semibold">Fiscal periods</h3>
            <FiscalPeriodForm data={data} />
          </section>
        </div>
      </WorkbenchPanel>
      <div className="grid gap-6 xl:grid-cols-2">
        <RecordsTableCard title="Tax rates" description="Configured tax structures." rows={data.taxRateRecords} />
        <RecordsTableCard title="Fiscal periods" description="Current close calendar." rows={data.fiscalPeriodRecords} />
      </div>
    </div>
  );
}
