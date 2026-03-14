"use server";

import { revalidatePath } from "next/cache";

import { requireActiveMembership } from "@/services/auth";
import { deleteDocument, uploadRelatedDocument } from "@/services/documents";
import { createBillWithJournal } from "@/services/bills";
import { createServerSupabaseClient } from "@/supabase/server";
import type { CreateBillInput } from "@/validators/bill";

export async function createBillAction(input: CreateBillInput) {
  const supabase = await createServerSupabaseClient();
  const result = await createBillWithJournal(supabase, input);
  revalidatePath("/dashboard");
  revalidatePath("/bills");
  revalidatePath("/reports");
  return result;
}

export async function uploadBillDocumentAction(formData: FormData) {
  const membership = await requireActiveMembership();
  const relatedRecordId = String(formData.get("relatedRecordId") ?? "");
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("Select a file before uploading.");
  }

  await uploadRelatedDocument(membership, {
    relatedTable: "bills",
    relatedRecordId,
    file,
  });

  revalidatePath("/bills");
}

export async function deleteBillDocumentAction(documentId: string) {
  const membership = await requireActiveMembership();
  await deleteDocument(membership, documentId);
  revalidatePath("/bills");
}
