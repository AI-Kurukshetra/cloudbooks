import { AssetRegistryManager } from "@/components/assets/asset-registry-manager";
import { InventoryManager } from "@/components/assets/inventory-manager";
import {
  deleteAssetDocumentAction,
  uploadAssetDocumentAction,
} from "@/app/(dashboard)/assets/actions";
import { DocumentAttachmentPanel } from "@/components/workbench/document-attachment-panel";
import { RecordsTableCard } from "@/components/master-data/records-table-card";
import { WorkbenchPanel } from "@/components/workbench/workbench-panel";
import { requireActiveMembership } from "@/services/auth";
import { getAssetsWorkbench } from "@/services/operations";

export default async function AssetsPage() {
  const membership = await requireActiveMembership();
  const data = await getAssetsWorkbench(membership);

  return (
    <div className="space-y-6">
      <WorkbenchPanel
        eyebrow="Fixed Assets"
        title="Fixed Asset Registry"
        description="Finance teams can create, refine, and retire fixed asset records without leaving the platform."
      >
        <AssetRegistryManager data={data} />
      </WorkbenchPanel>
      <InventoryManager data={data} />
      <RecordsTableCard
        title="Inventory register"
        description="Current inventory items and calculated quantity on hand."
        rows={data.inventoryRecords}
      />
      <DocumentAttachmentPanel
        title="Asset documents"
        description="Attach purchase orders, vendor invoices, warranty files, and onboarding paperwork to assets in the register."
        targetLabel="Asset"
        targets={data.assetRecords.map((asset) => ({
          id: asset.id,
          label: `${asset.assetCode} · ${asset.name}`,
        }))}
        attachments={data.attachments}
        uploadAction={uploadAssetDocumentAction}
        deleteAction={deleteAssetDocumentAction}
      />
    </div>
  );
}
