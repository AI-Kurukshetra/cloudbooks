"use server";

import { revalidatePath } from "next/cache";

import { requireActiveMembership } from "@/services/auth";
import { deleteDocument, uploadRelatedDocument } from "@/services/documents";
import {
  createAsset,
  createInventoryItem,
  createInventoryMovement,
  deleteAsset,
  updateAsset,
} from "@/services/operations";
import type {
  CreateAssetInput,
  CreateInventoryItemInput,
  CreateInventoryMovementInput,
  DeleteAssetInput,
  UpdateAssetInput,
} from "@/validators/operations";

export async function createAssetAction(input: CreateAssetInput) {
  const result = await createAsset(input);
  revalidatePath("/assets");
  return result;
}

export async function updateAssetAction(input: UpdateAssetInput) {
  const result = await updateAsset(input);
  revalidatePath("/assets");
  return result;
}

export async function createInventoryItemAction(input: CreateInventoryItemInput) {
  const result = await createInventoryItem(input);
  revalidatePath("/assets");
  return result;
}

export async function createInventoryMovementAction(input: CreateInventoryMovementInput) {
  const result = await createInventoryMovement(input);
  revalidatePath("/assets");
  return result;
}

export async function deleteAssetAction(input: DeleteAssetInput) {
  const membership = await requireActiveMembership();
  await deleteAsset(input, membership);
  revalidatePath("/assets");
}

export async function uploadAssetDocumentAction(formData: FormData) {
  const membership = await requireActiveMembership();
  const relatedRecordId = String(formData.get("relatedRecordId") ?? "");
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("Select a file before uploading.");
  }

  await uploadRelatedDocument(membership, {
    relatedTable: "assets",
    relatedRecordId,
    file,
  });

  revalidatePath("/assets");
}

export async function deleteAssetDocumentAction(documentId: string) {
  const membership = await requireActiveMembership();
  await deleteDocument(membership, documentId);
  revalidatePath("/assets");
}
