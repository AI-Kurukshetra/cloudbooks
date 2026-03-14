"use server";

import { revalidatePath } from "next/cache";

import { requireActiveMembership } from "@/services/auth";
import { deleteDocument, uploadRelatedDocument } from "@/services/documents";
import { createInvoiceWithJournal } from "@/services/invoices";
import { createServerSupabaseClient } from "@/supabase/server";
import type { CreateInvoiceInput } from "@/validators/invoice";

export async function createInvoiceAction(input: CreateInvoiceInput) {
  const supabase = await createServerSupabaseClient();
  const result = await createInvoiceWithJournal(supabase, input);
  revalidatePath("/dashboard");
  revalidatePath("/invoices");
  revalidatePath("/reports");
  return result;
}

export async function uploadInvoiceDocumentAction(formData: FormData) {
  const membership = await requireActiveMembership();
  const relatedRecordId = String(formData.get("relatedRecordId") ?? "");
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("Select a file before uploading.");
  }

  await uploadRelatedDocument(membership, {
    relatedTable: "invoices",
    relatedRecordId,
    file,
  });

  revalidatePath("/invoices");
}

export async function deleteInvoiceDocumentAction(documentId: string) {
  const membership = await requireActiveMembership();
  await deleteDocument(membership, documentId);
  revalidatePath("/invoices");
}
