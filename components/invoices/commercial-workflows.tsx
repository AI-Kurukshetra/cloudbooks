"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { ZodError } from "zod";

import {
  convertEstimateAction,
  createEstimateAction,
  createInvoiceReminderAction,
} from "@/app/(dashboard)/invoices/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { InvoiceWorkbenchData } from "@/types/workbench";
import {
  convertEstimateSchema,
  createEstimateSchema,
  createInvoiceReminderSchema,
  type ConvertEstimateInput,
  type CreateEstimateInput,
  type CreateInvoiceReminderInput,
} from "@/validators/invoice";

function defaultEstimateNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `EST-${stamp}-${Math.floor(Math.random() * 900 + 100)}`;
}

function fieldError(message?: string) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

export function EstimateForm({ data }: { data: InvoiceWorkbenchData }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const form = useForm<CreateEstimateInput>({
    resolver: zodResolver(createEstimateSchema),
    defaultValues: {
      organizationId: data.organizationId,
      entityId: data.entityId,
      customerId: data.customers[0]?.id ?? "",
      fiscalPeriodId: data.periods[0]?.id,
      estimateNumber: defaultEstimateNumber(),
      estimateDate: new Date().toISOString().slice(0, 10),
      validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().slice(0, 10),
      currencyCode: data.currencyCode,
      taxAccountId: data.taxAccounts[0]?.id,
      notes: "",
      lines: [
        {
          description: "Advisory services",
          quantity: 1,
          unitPrice: 0,
          revenueAccountId: data.revenueAccounts[0]?.id ?? "",
          taxRateId: data.taxRates[0]?.id,
          projectId: data.projects[0]?.id,
        },
      ],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });
  const lines = form.watch("lines");
  const subtotal = lines.reduce((sum, line) => sum + Number(line.quantity ?? 0) * Number(line.unitPrice ?? 0), 0);
  const errors = form.formState.errors;

  function submit(values: CreateEstimateInput) {
    setIsPending(true);
    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        await createEstimateAction({
          ...values,
          fiscalPeriodId: values.fiscalPeriodId || undefined,
          taxAccountId: values.taxAccountId || undefined,
          notes: values.notes || undefined,
          lines: values.lines.map((line) => ({
            ...line,
            taxRateId: line.taxRateId || undefined,
            projectId: line.projectId || undefined,
            recognitionStartDate: line.recognitionStartDate || undefined,
            recognitionEndDate: line.recognitionEndDate || undefined,
          })),
        });
        form.reset({
          ...form.getValues(),
          estimateNumber: defaultEstimateNumber(),
          notes: "",
          lines: [
            {
              description: "",
              quantity: 1,
              unitPrice: 0,
              revenueAccountId: data.revenueAccounts[0]?.id ?? "",
              taxRateId: data.taxRates[0]?.id,
              projectId: data.projects[0]?.id,
            },
          ],
        });
        setMessage("Estimate created.");
      } catch (submitError) {
        if (submitError instanceof ZodError) {
          setError(submitError.issues.map((issue) => issue.message).join(" "));
        } else {
          setError(submitError instanceof Error ? submitError.message : "Unable to create estimate.");
        }
      } finally {
        setIsPending(false);
      }
    });
  }

  return (
    <Card className="border-white/60 bg-white/78">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-2xl">Quotes and estimates</CardTitle>
            <CardDescription>Create sell-side commercial drafts before converting them into posted invoices.</CardDescription>
          </div>
          <Badge variant="outline">{formatCurrency(subtotal, data.currencyCode)}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Customer</label>
              <Select {...form.register("customerId")}>
                {data.customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.label}
                  </option>
                ))}
              </Select>
              {fieldError(errors.customerId?.message)}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estimate number</label>
              <Input {...form.register("estimateNumber")} />
              {fieldError(errors.estimateNumber?.message)}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estimate date</label>
              <Input type="date" {...form.register("estimateDate")} />
              {fieldError(errors.estimateDate?.message)}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Valid until</label>
              <Input type="date" {...form.register("validUntil")} />
              {fieldError(errors.validUntil?.message)}
            </div>
          </div>
          <Textarea placeholder="Internal notes or client-facing summary" {...form.register("notes")} />
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-6">
                <div className="space-y-2 xl:col-span-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input {...form.register(`lines.${index}.description`)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Revenue account</label>
                  <Select {...form.register(`lines.${index}.revenueAccountId`)}>
                    {data.revenueAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tax rate</label>
                  <Select {...form.register(`lines.${index}.taxRateId`)}>
                    <option value="">None</option>
                    {data.taxRates.map((taxRate) => (
                      <option key={taxRate.id} value={taxRate.id}>
                        {taxRate.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Qty</label>
                  <Input type="number" step="0.01" {...form.register(`lines.${index}.quantity`, { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit price</label>
                  <Input type="number" step="0.01" {...form.register(`lines.${index}.unitPrice`, { valueAsNumber: true })} />
                </div>
                <div className="md:col-span-2 xl:col-span-6 flex justify-end">
                  {fields.length > 1 ? (
                    <Button type="button" variant="ghost" onClick={() => remove(index)}>
                      Remove line
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                append({
                  description: "",
                  quantity: 1,
                  unitPrice: 0,
                  revenueAccountId: data.revenueAccounts[0]?.id ?? "",
                  taxRateId: data.taxRates[0]?.id,
                  projectId: data.projects[0]?.id,
                })
              }
            >
              Add estimate line
            </Button>
            <Button disabled={isPending || subtotal <= 0} type="submit">
              {isPending ? "Saving..." : "Create estimate"}
            </Button>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}

export function EstimateConversionCard({ data }: { data: InvoiceWorkbenchData }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const form = useForm<ConvertEstimateInput>({
    resolver: zodResolver(convertEstimateSchema),
    defaultValues: {
      organizationId: data.organizationId,
      entityId: data.entityId,
      estimateId: data.estimates[0]?.id ?? "",
      arAccountId: data.arAccounts[0]?.id ?? "",
      taxAccountId: data.taxAccounts[0]?.id,
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10),
      fiscalPeriodId: data.periods[0]?.id,
    },
  });

  return (
    <Card className="border-white/60 bg-white/78">
      <CardHeader>
        <CardTitle className="text-2xl">Convert estimate to invoice</CardTitle>
        <CardDescription>Turn an accepted quote into a posted invoice without rekeying commercial lines.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => {
            setIsPending(true);
            setError(null);
            setMessage(null);

            startTransition(async () => {
              try {
                const result = await convertEstimateAction({
                  ...values,
                  fiscalPeriodId: values.fiscalPeriodId || undefined,
                  taxAccountId: values.taxAccountId || undefined,
                });
                setMessage(`Converted to invoice ${result.invoiceId}.`);
              } catch (submitError) {
                setError(submitError instanceof Error ? submitError.message : "Unable to convert estimate.");
              } finally {
                setIsPending(false);
              }
            });
          })}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Select {...form.register("estimateId")}>
              {data.estimates.map((estimate) => (
                <option key={estimate.id} value={estimate.id}>
                  {estimate.number} · {estimate.party}
                </option>
              ))}
            </Select>
            <Select {...form.register("arAccountId")}>
              {data.arAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.label}
                </option>
              ))}
            </Select>
            <Input type="date" {...form.register("invoiceDate")} />
            <Input type="date" {...form.register("dueDate")} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          <Button disabled={isPending || data.estimates.length === 0} type="submit">
            {isPending ? "Converting..." : "Convert to invoice"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function ReminderSchedulerCard({ data }: { data: InvoiceWorkbenchData }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const form = useForm<CreateInvoiceReminderInput>({
    resolver: zodResolver(createInvoiceReminderSchema),
    defaultValues: {
      organizationId: data.organizationId,
      entityId: data.entityId,
      invoiceId: data.recentInvoices[0]?.id ?? "",
      reminderType: "invoice_due",
      deliveryChannel: "email",
      scheduledFor: new Date().toISOString().slice(0, 16),
      note: "",
      generatePayLink: true,
      payLinkExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 16),
    },
  });

  return (
    <Card className="border-white/60 bg-white/78">
      <CardHeader>
        <CardTitle className="text-2xl">Reminders and pay links</CardTitle>
        <CardDescription>Schedule collections touches and generate secure payment request links for posted invoices.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => {
            setIsPending(true);
            setError(null);
            setMessage(null);

            startTransition(async () => {
              try {
                const result = await createInvoiceReminderAction({
                  ...values,
                  note: values.note || undefined,
                  payLinkExpiresAt: values.generatePayLink ? values.payLinkExpiresAt : undefined,
                });
                setMessage(result.payLinkToken ? `Reminder scheduled. Pay link: /pay/${result.payLinkToken}` : "Reminder scheduled.");
              } catch (submitError) {
                setError(submitError instanceof Error ? submitError.message : "Unable to schedule reminder.");
              } finally {
                setIsPending(false);
              }
            });
          })}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Select {...form.register("invoiceId")}>
              {data.recentInvoices.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.number} · {invoice.party}
                </option>
              ))}
            </Select>
            <Select {...form.register("reminderType")}>
              <option value="quote_follow_up">Quote follow-up</option>
              <option value="invoice_due">Invoice due</option>
              <option value="invoice_overdue">Invoice overdue</option>
              <option value="final_notice">Final notice</option>
            </Select>
            <Select {...form.register("deliveryChannel")}>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="portal">Portal</option>
            </Select>
            <Input type="datetime-local" {...form.register("scheduledFor")} />
          </div>
          <Textarea placeholder="Collector note or reminder content" {...form.register("note")} />
          <div className="flex items-center gap-3 text-sm">
            <input className="h-4 w-4 rounded border-stone-300" type="checkbox" {...form.register("generatePayLink")} />
            <span>Generate pay link</span>
          </div>
          {form.watch("generatePayLink") ? (
            <Input type="datetime-local" {...form.register("payLinkExpiresAt")} />
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700 break-all">{message}</p> : null}
          <Button disabled={isPending || data.recentInvoices.length === 0} type="submit">
            {isPending ? "Scheduling..." : "Schedule reminder"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function ReminderActivityCard({ data }: { data: InvoiceWorkbenchData }) {
  const rows = useMemo(() => data.reminders, [data.reminders]);

  return (
    <Card className="border-white/60 bg-white/78">
      <CardHeader>
        <CardTitle className="text-2xl">Collections activity</CardTitle>
        <CardDescription>Latest reminder schedule and pay-link activity for receivables follow-up.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell className="py-10 text-sm text-muted-foreground" colSpan={5}>
                  No reminder activity yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p>{row.invoiceNumber}</p>
                      {row.payLinkUrl ? <p className="text-xs text-muted-foreground">{row.payLinkUrl}</p> : null}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{row.reminderType.replaceAll("_", " ")}</TableCell>
                  <TableCell>{formatDate(row.scheduledFor)}</TableCell>
                  <TableCell>{row.channel}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === "sent" ? "success" : "outline"}>{row.status}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
