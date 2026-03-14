import {
  FiscalPeriodForm,
  TaxRateForm,
} from "@/components/forms/operations-forms";
import { RecordsTableCard } from "@/components/master-data/records-table-card";
import {
  CustomFieldForm,
  DepartmentForm,
  ExportCenterCard,
  NotificationRuleForm,
  WorkflowDefinitionForm,
} from "@/components/settings/settings-admin-tools";
import { VatReturnForm } from "@/components/settings/vat-return-form";
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
        title="Configure compliance, controls, and admin tooling"
        description="Maintain tax, period, department, custom field, workflow, notification, and data export settings from one admin surface."
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
          <section>
            <h3 className="mb-4 text-lg font-semibold">VAT returns</h3>
            <VatReturnForm data={data} />
          </section>
          <section>
            <h3 className="mb-4 text-lg font-semibold">Departments</h3>
            <DepartmentForm data={data} />
          </section>
          <section>
            <h3 className="mb-4 text-lg font-semibold">Custom fields</h3>
            <CustomFieldForm data={data} />
          </section>
          <section>
            <h3 className="mb-4 text-lg font-semibold">Approval workflows</h3>
            <WorkflowDefinitionForm data={data} />
          </section>
          <section>
            <h3 className="mb-4 text-lg font-semibold">Notification rules</h3>
            <NotificationRuleForm data={data} />
          </section>
          <section>
            <h3 className="mb-4 text-lg font-semibold">Exports</h3>
            <ExportCenterCard />
          </section>
        </div>
      </WorkbenchPanel>
      <div className="grid gap-6 xl:grid-cols-2">
        <RecordsTableCard title="Tax rates" description="Configured tax structures." rows={data.taxRateRecords} />
        <RecordsTableCard title="Fiscal periods" description="Current close calendar." rows={data.fiscalPeriodRecords} />
        <RecordsTableCard title="VAT returns" description="Prepared indirect tax filings and liability summary." rows={data.vatReturnRecords} />
        <RecordsTableCard title="Departments" description="Departments and cost-center style groupings." rows={data.departmentRecords} />
        <RecordsTableCard title="Custom fields" description="Tenant-defined metadata fields by module." rows={data.customFieldRecords} />
        <RecordsTableCard title="Workflow definitions" description="Approval flow rules by module and event." rows={data.workflowRecords} />
        <RecordsTableCard title="Notification rules" description="Event delivery rules for operational alerts." rows={data.notificationRuleRecords} />
      </div>
    </div>
  );
}
