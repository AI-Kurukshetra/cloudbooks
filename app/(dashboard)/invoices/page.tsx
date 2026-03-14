import {
  deleteInvoiceDocumentAction,
  uploadInvoiceDocumentAction,
} from "@/app/(dashboard)/invoices/actions";
import { InvoiceForm } from "@/components/forms/invoice-form";
import { DocumentAttachmentPanel } from "@/components/workbench/document-attachment-panel";
import { RecentDocumentsCard } from "@/components/workbench/recent-documents-card";
import { WorkbenchPanel } from "@/components/workbench/workbench-panel";
import { requireActiveMembership } from "@/services/auth";
import { getInvoiceWorkbenchData } from "@/services/workbench";

export default async function InvoicesPage() {
  const membership = await requireActiveMembership();
  const data = await getInvoiceWorkbenchData(membership);

  return (
    <div className="space-y-6">
      <WorkbenchPanel
        eyebrow="Accounts Receivable"
        title="Invoice Command Center"
        description="Create client invoices with account-coded revenue lines and immediate double-entry posting into the general ledger."
      >
        <InvoiceForm data={data} />
      </WorkbenchPanel>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <RecentDocumentsCard
          title="Recent invoices"
          description="Latest invoice activity for the active entity."
          documents={data.recentInvoices}
        />
        <DocumentAttachmentPanel
          title="Invoice attachments"
          description="Store customer purchase orders, signed SOWs, and invoice backup against the posted invoice record."
          immutableNote="Posted invoices remain immutable to preserve audit integrity. Supporting files can still be added or removed."
          targetLabel="Invoice"
          targets={data.recentInvoices.map((invoice) => ({
            id: invoice.id,
            label: `${invoice.number} · ${invoice.party}`,
          }))}
          attachments={data.attachments}
          uploadAction={uploadInvoiceDocumentAction}
          deleteAction={deleteInvoiceDocumentAction}
        />
      </div>
    </div>
  );
}
