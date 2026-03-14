"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ZodError } from "zod";
import { startTransition, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import {
  createBillAction,
  deleteBillDocumentAction,
  uploadBillDocumentAction,
} from "@/app/(dashboard)/bills/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DocumentAttachmentPanel } from "@/components/workbench/document-attachment-panel";
import { formatCurrency } from "@/lib/utils";
import type { BillWorkbenchData } from "@/types/workbench";
import { createBillSchema, type CreateBillInput } from "@/validators/bill";

function defaultBillNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `BILL-${stamp}-${Math.floor(Math.random() * 900 + 100)}`;
}

function fieldError(message?: string) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

export function BillForm({ data }: { data: BillWorkbenchData }) {
  const [result, setResult] = useState<{ billId: string; journalEntryId: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<CreateBillInput>({
    resolver: zodResolver(createBillSchema),
    defaultValues: {
      organizationId: data.organizationId,
      entityId: data.entityId,
      vendorId: data.vendors[0]?.id ?? "",
      fiscalPeriodId: data.periods[0]?.id,
      billNumber: defaultBillNumber(),
      billDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10),
      currencyCode: data.currencyCode,
      apAccountId: data.apAccounts[0]?.id ?? "",
      lines: [
        {
          description: "Software and services",
          quantity: 1,
          unitCost: 0,
          expenseAccountId: data.expenseAccounts[0]?.id ?? "",
          projectId: data.projects[0]?.id,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });
  const errors = form.formState.errors;

  const lines = form.watch("lines");
  const subtotal = lines.reduce(
    (sum, line) => sum + Number(line.quantity ?? 0) * Number(line.unitCost ?? 0),
    0,
  );
  const canSubmit = subtotal > 0 && !isPending;

  function submit(values: CreateBillInput) {
    setSubmitError(null);
    setResult(null);
    setIsPending(true);

    startTransition(async () => {
      try {
        const payload: CreateBillInput = {
          ...values,
          fiscalPeriodId: values.fiscalPeriodId || undefined,
          taxLiabilityAccountId: values.taxLiabilityAccountId || undefined,
          lines: values.lines.map((line) => ({
            ...line,
            taxRateId: line.taxRateId || undefined,
            projectId: line.projectId || undefined,
          })),
        };

        const response = await createBillAction(payload);
        setResult(response);
        form.reset({
          ...form.getValues(),
          billNumber: defaultBillNumber(),
          lines: [
            {
              description: "",
              quantity: 1,
              unitCost: 0,
              expenseAccountId: data.expenseAccounts[0]?.id ?? "",
              projectId: data.projects[0]?.id,
            },
          ],
        });
      } catch (error) {
        if (error instanceof ZodError) {
          setSubmitError(error.issues.map((issue) => issue.message).join(" "));
        } else {
          setSubmitError(error instanceof Error ? error.message : "Unable to create bill.");
        }
      } finally {
        setIsPending(false);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-slate-50">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Posting model</p>
          <p className="mt-3 text-lg font-semibold">Dr Expense per line account</p>
          <p className="text-sm text-slate-300">Cr Accounts Payable</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Open periods</p>
          <p className="mt-3 text-2xl font-semibold">{data.periods.length}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Expense accounts</p>
          <p className="mt-3 text-2xl font-semibold">{data.expenseAccounts.length}</p>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-700">Draft total</p>
          <p className="mt-3 text-2xl font-semibold text-amber-950">{formatCurrency(subtotal, data.currencyCode)}</p>
        </div>
      </div>

      <form className="space-y-6" onSubmit={form.handleSubmit(submit)}>
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Bill header</p>
                  <h3 className="mt-2 text-xl font-semibold">Obligation details</h3>
                </div>
                <Badge variant="outline">{data.currencyCode}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vendor</label>
                  <Select {...form.register("vendorId")}>
                    {data.vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.label}
                      </option>
                    ))}
                  </Select>
                  {fieldError(errors.vendorId?.message)}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">A/P account</label>
                  <Select {...form.register("apAccountId")}>
                    {data.apAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.label}
                      </option>
                    ))}
                  </Select>
                  {fieldError(errors.apAccountId?.message)}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bill number</label>
                  <Input {...form.register("billNumber")} />
                  {fieldError(errors.billNumber?.message)}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fiscal period</label>
                  <Select {...form.register("fiscalPeriodId")}>
                    <option value="">Unassigned</option>
                    {data.periods.map((period) => (
                      <option key={period.id} value={period.id}>
                        {period.label}
                      </option>
                    ))}
                  </Select>
                  {fieldError(errors.fiscalPeriodId?.message as string | undefined)}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bill date</label>
                  <Input type="date" {...form.register("billDate")} />
                  {fieldError(errors.billDate?.message)}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Due date</label>
                  <Input type="date" {...form.register("dueDate")} />
                  {fieldError(errors.dueDate?.message)}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Expense lines</p>
                  <h3 className="mt-2 text-xl font-semibold">Bill items</h3>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    append({
                      description: "",
                      quantity: 1,
                      unitCost: 0,
                      expenseAccountId: data.expenseAccounts[0]?.id ?? "",
                      projectId: data.projects[0]?.id,
                    })
                  }
                >
                  Add line
                </Button>
              </div>
              <div className="space-y-4">
                {fields.map((field, index) => {
                  const lineSubtotal =
                    Number(lines[index]?.quantity ?? 0) * Number(lines[index]?.unitCost ?? 0);

                  return (
                    <div key={field.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm font-semibold">Line {index + 1}</p>
                        {fields.length > 1 ? (
                          <Button type="button" variant="ghost" onClick={() => remove(index)}>
                            Remove
                          </Button>
                        ) : null}
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium">Description</label>
                          <Textarea {...form.register(`lines.${index}.description`)} />
                          {fieldError(errors.lines?.[index]?.description?.message)}
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Expense account</label>
                          <Select {...form.register(`lines.${index}.expenseAccountId`)}>
                            {data.expenseAccounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.label}
                              </option>
                            ))}
                          </Select>
                          {fieldError(errors.lines?.[index]?.expenseAccountId?.message)}
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Project</label>
                          <Select {...form.register(`lines.${index}.projectId`)}>
                            <option value="">None</option>
                            {data.projects.map((project) => (
                              <option key={project.id} value={project.id}>
                                {project.label}
                              </option>
                            ))}
                          </Select>
                          {fieldError(errors.lines?.[index]?.projectId?.message as string | undefined)}
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Quantity</label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            {...form.register(`lines.${index}.quantity`, { valueAsNumber: true })}
                          />
                          {fieldError(errors.lines?.[index]?.quantity?.message)}
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Unit cost</label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            {...form.register(`lines.${index}.unitCost`, { valueAsNumber: true })}
                          />
                          {fieldError(errors.lines?.[index]?.unitCost?.message)}
                        </div>
                      </div>
                      <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-muted-foreground">
                        Line total: <span className="font-semibold text-foreground">{formatCurrency(lineSubtotal, data.currencyCode)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Submission</p>
              <h3 className="mt-2 text-xl font-semibold">Accrue to ledger</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Approval creates the bill, inserts bill lines, and posts a balanced AP journal entry.
              </p>
              <div className="mt-5 space-y-3 rounded-3xl bg-slate-950 p-5 text-slate-50">
                <div className="flex items-center justify-between text-sm">
                  <span>Currency</span>
                  <span>{data.currencyCode}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Line count</span>
                  <span>{fields.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Total posting</span>
                  <span>{formatCurrency(subtotal, data.currencyCode)}</span>
                </div>
              </div>
              {submitError ? <p className="mt-4 text-sm text-destructive">{submitError}</p> : null}
              {fieldError(errors.lines?.message)}
              {subtotal <= 0 ? (
                <p className="mt-4 text-sm text-amber-700">
                  Add at least one bill line with a positive amount before posting.
                </p>
              ) : null}
              {result ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  Bill created and posted. Bill ID: {result.billId}. Journal ID: {result.journalEntryId}.
                </div>
              ) : null}
              <Button className="mt-5 w-full" disabled={!canSubmit} type="submit">
                {isPending ? "Posting bill..." : "Create and post bill"}
              </Button>
            </section>
          </aside>
        </div>
      </form>
      {result ? (
        <DocumentAttachmentPanel
          title="Attach support to the posted bill"
          description="Add supplier PDF bills, vendor statements, and approval backup to the bill you just posted."
          immutableNote="The bill is already posted and locked for accounting integrity. Attachments remain editable."
          targetLabel="Bill"
          targets={[
            {
              id: result.billId,
              label: `Posted bill ${result.billId}`,
            },
          ]}
          attachments={data.attachments.filter((attachment) => attachment.relatedRecordId === result.billId)}
          uploadAction={uploadBillDocumentAction}
          deleteAction={deleteBillDocumentAction}
          initialSelectedRecordId={result.billId}
          hideTargetSelector
        />
      ) : null}
    </div>
  );
}
