import {
  deleteBillDocumentAction,
  uploadBillDocumentAction,
} from "@/app/(dashboard)/bills/actions";
import { BillForm } from "@/components/forms/bill-form";
import { DocumentAttachmentPanel } from "@/components/workbench/document-attachment-panel";
import { RecentDocumentsCard } from "@/components/workbench/recent-documents-card";
import { WorkbenchPanel } from "@/components/workbench/workbench-panel";
import { requireActiveMembership } from "@/services/auth";
import { getBillWorkbenchData } from "@/services/workbench";

export default async function BillsPage() {
  const membership = await requireActiveMembership();
  const data = await getBillWorkbenchData(membership);

  return (
    <div className="space-y-6">
      <WorkbenchPanel
        eyebrow="Accounts Payable"
        title="Bill Accrual Workbench"
        description="Capture vendor obligations with line-level expense coding and post balanced AP journals as soon as the bill is approved."
      >
        <BillForm data={data} />
      </WorkbenchPanel>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <RecentDocumentsCard
          title="Recent bills"
          description="Latest vendor bill activity for the active entity."
          documents={data.recentBills}
        />
        <DocumentAttachmentPanel
          title="Bill attachments"
          description="Attach supplier invoices, statements, and backup to the posted payable without reopening the accounting document."
          immutableNote="Posted bills remain immutable for ledger integrity. Documentation is managed separately from the journal-backed obligation."
          targetLabel="Bill"
          targets={data.recentBills.map((bill) => ({
            id: bill.id,
            label: `${bill.number} · ${bill.party}`,
          }))}
          attachments={data.attachments}
          uploadAction={uploadBillDocumentAction}
          deleteAction={deleteBillDocumentAction}
        />
      </div>
    </div>
  );
}
