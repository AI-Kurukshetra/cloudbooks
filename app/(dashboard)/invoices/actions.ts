"use server";

import { revalidatePath } from "next/cache";

import { requireActiveMembership } from "@/services/auth";
import { deleteDocument, uploadRelatedDocument } from "@/services/documents";
import {
  convertEstimateToInvoice,
  createEstimate,
  createInvoiceReminder,
  createInvoiceWithJournal,
} from "@/services/invoices";
import { createServerSupabaseClient } from "@/supabase/server";
import type {
  ConvertEstimateInput,
  CreateEstimateInput,
  CreateInvoiceInput,
  CreateInvoiceReminderInput,
} from "@/validators/invoice";

export async function createInvoiceAction(input: CreateInvoiceInput) {
  const supabase = await createServerSupabaseClient();
  const result = await createInvoiceWithJournal(supabase, input);
  revalidatePath("/dashboard");
  revalidatePath("/invoices");
  revalidatePath("/reports");
  return result;
}

export async function createEstimateAction(input: CreateEstimateInput) {
  const supabase = await createServerSupabaseClient();
  const result = await createEstimate(supabase, input);
  revalidatePath("/invoices");
  return result;
}

export async function convertEstimateAction(input: ConvertEstimateInput) {
  const supabase = await createServerSupabaseClient();
  const result = await convertEstimateToInvoice(supabase, input);
  revalidatePath("/dashboard");
  revalidatePath("/invoices");
  revalidatePath("/reports");
  return result;
}

export async function createInvoiceReminderAction(input: CreateInvoiceReminderInput) {
  const supabase = await createServerSupabaseClient();
  const result = await createInvoiceReminder(supabase, input);
  revalidatePath("/invoices");
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
