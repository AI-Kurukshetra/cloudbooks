import path from "node:path";

import { createAdminSupabaseClient } from "@/supabase/admin";
import { createServerSupabaseClient } from "@/supabase/server";
import type { MembershipContext } from "@/services/auth";

const DOCUMENT_BUCKET = "documents";

export type AttachmentTarget = {
  id: string;
  label: string;
};

export type AttachmentRecord = {
  id: string;
  fileName: string;
  documentType: "invoice" | "bill" | "bank_statement" | "contract" | "receipt" | "other";
  createdAt: string;
  relatedRecordId: string | null;
  downloadUrl: string | null;
};

type RelatedTable = "invoices" | "bills" | "assets";

async function ensureDocumentBucket() {
  const admin = createAdminSupabaseClient();
  const { data: buckets, error } = await admin.storage.listBuckets();

  if (error) {
    throw new Error(error.message);
  }

  if (!buckets.find((bucket) => bucket.name === DOCUMENT_BUCKET)) {
    const { error: createError } = await admin.storage.createBucket(DOCUMENT_BUCKET, {
      public: false,
      fileSizeLimit: 10 * 1024 * 1024,
    });

    if (createError && !createError.message.toLowerCase().includes("already exists")) {
      throw new Error(createError.message);
    }
  }
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

function inferDocumentType(relatedTable: RelatedTable) {
  if (relatedTable === "invoices") return "invoice" as const;
  if (relatedTable === "bills") return "bill" as const;
  return "other" as const;
}

export async function listDocumentsForTable(
  membership: MembershipContext,
  relatedTable: RelatedTable,
  limit = 12,
): Promise<AttachmentRecord[]> {
  const supabase = await createServerSupabaseClient();
  const admin = createAdminSupabaseClient();
  const db = supabase as any;

  let query = db
    .from("documents")
    .select("id, file_name, document_type, created_at, related_record_id, storage_bucket, storage_path")
    .eq("organization_id", membership.organizationId)
    .eq("related_table", relatedTable)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (membership.entityId) {
    query = query.eq("entity_id", membership.entityId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  const signedUrls = await Promise.all(
    rows.map(async (row: any) => {
      const { data: signed, error: signedError } = await admin.storage
        .from(row.storage_bucket)
        .createSignedUrl(row.storage_path, 60 * 60);

      if (signedError) {
        return null;
      }

      return signed.signedUrl;
    }),
  );

  return rows.map((row: any, index: number) => ({
    id: row.id,
    fileName: row.file_name,
    documentType: row.document_type,
    createdAt: row.created_at,
    relatedRecordId: row.related_record_id,
    downloadUrl: signedUrls[index],
  }));
}

export async function uploadRelatedDocument(
  membership: MembershipContext,
  input: {
    relatedTable: RelatedTable;
    relatedRecordId: string;
    file: File;
  },
) {
  if (!input.file || input.file.size === 0) {
    throw new Error("Select a file before uploading.");
  }

  await ensureDocumentBucket();

  const admin = createAdminSupabaseClient();
  const db = admin as any;
  const ext = path.extname(input.file.name);
  const safeName = sanitizeFileName(path.basename(input.file.name, ext));
  const storagePath = `${membership.organizationId}/${membership.entityId ?? "org"}/${input.relatedTable}/${input.relatedRecordId}/${Date.now()}-${safeName}${ext}`;
  const buffer = Buffer.from(await input.file.arrayBuffer());

  const { error: uploadError } = await admin.storage.from(DOCUMENT_BUCKET).upload(storagePath, buffer, {
    contentType: input.file.type || "application/octet-stream",
    upsert: false,
  });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data, error } = await db
    .from("documents")
    .insert({
      organization_id: membership.organizationId,
      entity_id: membership.entityId,
      document_type: inferDocumentType(input.relatedTable),
      storage_bucket: DOCUMENT_BUCKET,
      storage_path: storagePath,
      file_name: input.file.name,
      file_size_bytes: input.file.size,
      mime_type: input.file.type || null,
      related_table: input.relatedTable,
      related_record_id: input.relatedRecordId,
      created_by: membership.userId,
    })
    .select("id")
    .single();

  if (error) {
    await admin.storage.from(DOCUMENT_BUCKET).remove([storagePath]);
    throw new Error(error.message);
  }

  return data;
}

export async function deleteDocument(
  membership: MembershipContext,
  documentId: string,
) {
  const supabase = await createServerSupabaseClient();
  const admin = createAdminSupabaseClient();
  const queryDb = supabase as any;
  const { data, error } = await queryDb
    .from("documents")
    .select("id, storage_bucket, storage_path")
    .eq("organization_id", membership.organizationId)
    .eq("id", documentId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Document not found.");
  }

  const { error: storageError } = await admin.storage.from(data.storage_bucket).remove([data.storage_path]);
  if (storageError) {
    throw new Error(storageError.message);
  }

  const adminDb = admin as any;
  const { error: deleteError } = await adminDb.from("documents").delete().eq("id", documentId);
  if (deleteError) {
    throw new Error(deleteError.message);
  }
}

export async function deleteRelatedDocuments(
  membership: MembershipContext,
  relatedTable: RelatedTable,
  relatedRecordId: string,
) {
  const supabase = await createServerSupabaseClient();
  const admin = createAdminSupabaseClient();
  const queryDb = supabase as any;
  let query = queryDb
    .from("documents")
    .select("id, storage_bucket, storage_path")
    .eq("organization_id", membership.organizationId)
    .eq("related_table", relatedTable)
    .eq("related_record_id", relatedRecordId);

  if (membership.entityId) {
    query = query.eq("entity_id", membership.entityId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  if (!rows.length) {
    return;
  }

  const buckets = new Map<string, string[]>();
  rows.forEach((row: any) => {
    const bucket = buckets.get(row.storage_bucket) ?? [];
    bucket.push(row.storage_path);
    buckets.set(row.storage_bucket, bucket);
  });

  for (const [bucket, paths] of buckets.entries()) {
    const { error: removeError } = await admin.storage.from(bucket).remove(paths);
    if (removeError) {
      throw new Error(removeError.message);
    }
  }

  const adminDb = admin as any;
  const { error: deleteError } = await adminDb.from("documents").delete().in(
    "id",
    rows.map((row: any) => row.id),
  );
  if (deleteError) {
    throw new Error(deleteError.message);
  }
}
