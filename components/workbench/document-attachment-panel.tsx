"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import type { AttachmentDocument } from "@/types/workbench";

type TargetOption = {
  id: string;
  label: string;
};

export function DocumentAttachmentPanel({
  title,
  description,
  immutableNote,
  targetLabel,
  targets,
  attachments,
  uploadAction,
  deleteAction,
  initialSelectedRecordId,
  hideTargetSelector = false,
}: {
  title: string;
  description: string;
  immutableNote?: string;
  targetLabel: string;
  targets: TargetOption[];
  attachments: AttachmentDocument[];
  uploadAction: (formData: FormData) => Promise<void>;
  deleteAction: (documentId: string) => Promise<void>;
  initialSelectedRecordId?: string;
  hideTargetSelector?: boolean;
}) {
  const router = useRouter();
  const [selectedRecordId, setSelectedRecordId] = useState(initialSelectedRecordId ?? targets[0]?.id ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialSelectedRecordId) {
      setSelectedRecordId(initialSelectedRecordId);
      return;
    }

    if (!targets.find((target) => target.id === selectedRecordId)) {
      setSelectedRecordId(targets[0]?.id ?? "");
    }
  }, [initialSelectedRecordId, selectedRecordId, targets]);

  const attachmentsByRecord = useMemo(() => {
    return attachments.reduce<Record<string, AttachmentDocument[]>>((acc, item) => {
      const key = item.relatedRecordId ?? "unassigned";
      acc[key] = [...(acc[key] ?? []), item];
      return acc;
    }, {});
  }, [attachments]);

  const visibleAttachments = selectedRecordId ? attachmentsByRecord[selectedRecordId] ?? [] : attachments;

  function handleUpload() {
    setError(null);
    setMessage(null);

    if (!selectedRecordId) {
      setError(`Select a ${targetLabel.toLowerCase()} first.`);
      return;
    }

    if (!selectedFile) {
      setError("Choose a file before uploading.");
      return;
    }

    const formData = new FormData();
    formData.set("relatedRecordId", selectedRecordId);
    formData.set("file", selectedFile);

    setIsPending(true);
    startTransition(async () => {
      try {
        await uploadAction(formData);
        setSelectedFile(null);
        setMessage("Attachment uploaded.");
        router.refresh();
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : "Unable to upload attachment.");
      } finally {
        setIsPending(false);
      }
    });
  }

  function handleDelete(documentId: string) {
    setError(null);
    setMessage(null);
    setIsPending(true);

    startTransition(async () => {
      try {
        await deleteAction(documentId);
        setMessage("Attachment removed.");
        router.refresh();
      } catch (deleteError) {
        setError(deleteError instanceof Error ? deleteError.message : "Unable to delete attachment.");
      } finally {
        setIsPending(false);
      }
    });
  }

  return (
    <Card className="border-slate-200 bg-white/95">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white via-slate-50 to-emerald-50">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Document control</p>
        <CardTitle className="mt-2 text-2xl">{title}</CardTitle>
        <CardDescription className="mt-2">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-6">
        {immutableNote ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {immutableNote}
          </div>
        ) : null}
        <div className={`grid gap-4 ${hideTargetSelector ? "md:grid-cols-[1fr_auto]" : "md:grid-cols-[1.2fr_1fr_auto]"}`}>
          {hideTargetSelector ? null : (
            <div className="space-y-2">
              <label className="text-sm font-medium">{targetLabel}</label>
              <Select value={selectedRecordId} onChange={(event) => setSelectedRecordId(event.target.value)}>
                {targets.length ? null : <option value="">No records available</option>}
                {targets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.label}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {hideTargetSelector ? `${targetLabel} attachment` : "File"}
            </label>
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              type="file"
            />
          </div>
          <div className="flex items-end">
            <Button className="w-full" disabled={isPending || !targets.length} onClick={handleUpload} type="button">
              {isPending ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        <div className="space-y-3">
          {visibleAttachments.length ? null : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-muted-foreground">
              No attachments for the selected record yet.
            </div>
          )}
          {visibleAttachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div>
                <p className="font-medium text-foreground">{attachment.fileName}</p>
                <p className="text-sm text-muted-foreground">
                  {attachment.documentType} · {formatDate(attachment.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {attachment.downloadUrl ? (
                  <a
                    className="inline-flex h-10 items-center rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700"
                    href={attachment.downloadUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    View
                  </a>
                ) : null}
                <Button onClick={() => handleDelete(attachment.id)} type="button" variant="ghost">
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
