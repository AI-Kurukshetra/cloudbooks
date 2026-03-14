"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ZodError } from "zod";
import { startTransition, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { createAssetAction } from "@/app/(dashboard)/assets/actions";
import {
  createBankAccountAction,
  createBankTransactionAction,
  createReconciliationAction,
} from "@/app/(dashboard)/banking/actions";
import { createBudgetAction } from "@/app/(dashboard)/budgets/actions";
import { postManualJournal } from "@/app/(dashboard)/journal/actions";
import {
  createFiscalPeriodAction,
  createTaxRateAction,
} from "@/app/(dashboard)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { JournalDraft } from "@/types/accounting";
import type {
  AssetsWorkbench,
  BankingWorkbench,
  BudgetsWorkbench,
  JournalWorkbench,
  SettingsWorkbench,
} from "@/services/operations";
import type {
  CreateAssetInput,
  CreateBankAccountInput,
  CreateBankTransactionInput,
  CreateBudgetInput,
  CreateFiscalPeriodInput,
  CreateReconciliationInput,
  CreateTaxRateInput,
} from "@/validators/operations";
import {
  createAssetSchema,
  createBankAccountSchema,
  createBankTransactionSchema,
  createBudgetSchema,
  createFiscalPeriodSchema,
  createReconciliationSchema,
  createTaxRateSchema,
} from "@/validators/operations";

function useFormFeedback() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(task: () => Promise<void>, success: string) {
    setIsPending(true);
    setError(null);
    setMessage(null);
    try {
      await task();
      setMessage(success);
    } catch (err) {
      if (err instanceof ZodError) {
        setError(err.issues.map((issue) => issue.message).join(" "));
      } else {
        setError(err instanceof Error ? err.message : "Unable to save.");
      }
    } finally {
      setIsPending(false);
    }
  }

  return { isPending, error, message, run };
}

function renderFeedback(error: string | null, message: string | null) {
  return (
    <>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
    </>
  );
}

function defaultJournalNumber() {
  return `MJE-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Math.floor(Math.random() * 900 + 100)}`;
}

export function ManualJournalForm({ data }: { data: JournalWorkbench }) {
  const feedback = useFormFeedback();
  const form = useForm<JournalDraft>({
    defaultValues: {
      organizationId: data.organizationId,
      entityId: data.entityId,
      fiscalPeriodId: data.periods[0]?.id,
      entryNumber: defaultJournalNumber(),
      entryDate: new Date().toISOString().slice(0, 10),
      description: "",
      sourceType: "manual",
      currencyCode: data.currencyCode,
      lines: [
        { accountId: data.accounts[0]?.id ?? "", description: "", debitAmount: 0, creditAmount: 0 },
        { accountId: data.accounts[0]?.id ?? "", description: "", debitAmount: 0, creditAmount: 0 },
      ],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });
  const lines = form.watch("lines");
  const debitTotal = lines.reduce((sum, line) => sum + Number(line.debitAmount ?? 0), 0);
  const creditTotal = lines.reduce((sum, line) => sum + Number(line.creditAmount ?? 0), 0);
  const canSubmit = fields.length >= 2 && debitTotal > 0 && Math.abs(debitTotal - creditTotal) < 0.001 && !feedback.isPending;

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit((values) =>
        startTransition(() =>
          feedback.run(async () => {
            await postManualJournal({
              ...values,
              lines: values.lines.map((line) => ({
                ...line,
                projectId: line.projectId || undefined,
                customerId: line.customerId || undefined,
                vendorId: line.vendorId || undefined,
              })),
            });
            form.reset({
              ...values,
              entryNumber: defaultJournalNumber(),
              description: "",
              lines: [
                { accountId: data.accounts[0]?.id ?? "", description: "", debitAmount: 0, creditAmount: 0 },
                { accountId: data.accounts[0]?.id ?? "", description: "", debitAmount: 0, creditAmount: 0 },
              ],
            });
          }, "Journal posted."),
        ),
      )}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Input placeholder="Entry number" {...form.register("entryNumber")} />
        <Input type="date" {...form.register("entryDate")} />
        <Select {...form.register("fiscalPeriodId")}>
          <option value="">No period</option>
          {data.periods.map((period) => (
            <option key={period.id} value={period.id}>
              {period.label}
            </option>
          ))}
        </Select>
        <Input placeholder="Currency" {...form.register("currencyCode")} />
      </div>
      <Textarea placeholder="Journal description" {...form.register("description")} />
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold">Line {index + 1}</p>
              {fields.length > 2 ? (
                <Button type="button" variant="ghost" onClick={() => remove(index)}>
                  Remove
                </Button>
              ) : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Select {...form.register(`lines.${index}.accountId`)}>
                {data.accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.label}
                  </option>
                ))}
              </Select>
              <Input placeholder="Line description" {...form.register(`lines.${index}.description`)} />
              <Input type="number" step="0.01" placeholder="Debit" {...form.register(`lines.${index}.debitAmount`, { valueAsNumber: true })} />
              <Input type="number" step="0.01" placeholder="Credit" {...form.register(`lines.${index}.creditAmount`, { valueAsNumber: true })} />
              <Select {...form.register(`lines.${index}.customerId`)}>
                <option value="">No customer</option>
                {data.customers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </Select>
              <Select {...form.register(`lines.${index}.vendorId`)}>
                <option value="">No vendor</option>
                {data.vendors.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </Select>
              <Select {...form.register(`lines.${index}.projectId`)}>
                <option value="">No project</option>
                {data.projects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            append({ accountId: data.accounts[0]?.id ?? "", description: "", debitAmount: 0, creditAmount: 0 })
          }
        >
          Add line
        </Button>
        <span className="text-sm text-muted-foreground">Debits: {debitTotal.toFixed(2)} | Credits: {creditTotal.toFixed(2)}</span>
      </div>
      {renderFeedback(feedback.error, feedback.message)}
      <Button disabled={!canSubmit} type="submit">
        {feedback.isPending ? "Posting..." : "Post manual journal"}
      </Button>
    </form>
  );
}

export function AssetForm({ data }: { data: AssetsWorkbench }) {
  const feedback = useFormFeedback();
  const form = useForm<CreateAssetInput>({
    resolver: zodResolver(createAssetSchema),
    defaultValues: {
      organizationId: data.organizationId,
      entityId: data.entityId,
      assetCode: "",
      name: "",
      category: "",
      acquisitionDate: new Date().toISOString().slice(0, 10),
      inServiceDate: new Date().toISOString().slice(0, 10),
      cost: 0,
      salvageValue: 0,
      usefulLifeMonths: 36,
      depreciationMethod: "straight_line",
      assetAccountId: data.accounts[0]?.id ?? "",
      accumulatedDepreciationAccountId: data.accounts[0]?.id ?? "",
      depreciationExpenseAccountId: data.expenseAccounts[0]?.id ?? "",
    },
  });
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        startTransition(() =>
          feedback.run(async () => {
            await createAssetAction(values);
            form.reset({ ...values, assetCode: "", name: "", category: "", cost: 0, salvageValue: 0 });
          }, "Asset created."),
        ),
      )}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Input placeholder="Asset code" {...form.register("assetCode")} />
        <Input placeholder="Asset name" {...form.register("name")} />
        <Input placeholder="Category" {...form.register("category")} />
        <Input type="date" {...form.register("acquisitionDate")} />
        <Input type="date" {...form.register("inServiceDate")} />
        <Input type="number" step="0.01" placeholder="Cost" {...form.register("cost", { valueAsNumber: true })} />
        <Input type="number" step="0.01" placeholder="Salvage value" {...form.register("salvageValue", { valueAsNumber: true })} />
        <Input type="number" placeholder="Useful life months" {...form.register("usefulLifeMonths", { valueAsNumber: true })} />
        <Input placeholder="Depreciation method" {...form.register("depreciationMethod")} />
        <Select {...form.register("assetAccountId")}>
          {data.accounts.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </Select>
        <Select {...form.register("accumulatedDepreciationAccountId")}>
          {data.accounts.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </Select>
        <Select {...form.register("depreciationExpenseAccountId")}>
          {data.expenseAccounts.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </Select>
      </div>
      {renderFeedback(feedback.error, feedback.message)}
      <Button disabled={feedback.isPending} type="submit">{feedback.isPending ? "Creating..." : "Create asset"}</Button>
    </form>
  );
}

export function BudgetForm({ data }: { data: BudgetsWorkbench }) {
  const feedback = useFormFeedback();
  const form = useForm<CreateBudgetInput>({
    resolver: zodResolver(createBudgetSchema),
    defaultValues: {
      organizationId: data.organizationId,
      entityId: data.entityId,
      name: "",
      fiscalYear: new Date().getUTCFullYear(),
      scenario: "baseline",
      lines: [{ accountId: data.accounts[0]?.id ?? "", fiscalPeriodId: data.periods[0]?.id ?? "", amount: 0 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        startTransition(() =>
          feedback.run(async () => {
            await createBudgetAction(values);
            form.reset({
              ...values,
              name: "",
              lines: [{ accountId: data.accounts[0]?.id ?? "", fiscalPeriodId: data.periods[0]?.id ?? "", amount: 0 }],
            });
          }, "Budget created."),
        ),
      )}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Input placeholder="Budget name" {...form.register("name")} />
        <Input type="number" placeholder="Fiscal year" {...form.register("fiscalYear", { valueAsNumber: true })} />
        <Input placeholder="Scenario" {...form.register("scenario")} />
      </div>
      {fields.map((field, index) => (
        <div key={field.id} className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
          <Select {...form.register(`lines.${index}.accountId`)}>
            {data.accounts.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </Select>
          <Select {...form.register(`lines.${index}.fiscalPeriodId`)}>
            <option value="">No period</option>
            {data.periods.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </Select>
          <div className="flex gap-2">
            <Input type="number" step="0.01" placeholder="Amount" {...form.register(`lines.${index}.amount`, { valueAsNumber: true })} />
            {fields.length > 1 ? (
              <Button type="button" variant="ghost" onClick={() => remove(index)}>Remove</Button>
            ) : null}
          </div>
        </div>
      ))}
      <Button type="button" variant="secondary" onClick={() => append({ accountId: data.accounts[0]?.id ?? "", fiscalPeriodId: data.periods[0]?.id ?? "", amount: 0 })}>
        Add budget line
      </Button>
      {renderFeedback(feedback.error, feedback.message)}
      <Button disabled={feedback.isPending} type="submit">{feedback.isPending ? "Creating..." : "Create budget"}</Button>
    </form>
  );
}

export function BankAccountForm({ data }: { data: BankingWorkbench }) {
  const feedback = useFormFeedback();
  const form = useForm<CreateBankAccountInput>({
    resolver: zodResolver(createBankAccountSchema),
    defaultValues: {
      organizationId: data.organizationId,
      entityId: data.entityId,
      accountName: "",
      bankName: "",
      maskedAccountNumber: "",
      currencyCode: data.currencyCode,
      chartAccountId: data.cashAccounts[0]?.id ?? "",
      integrationProvider: "",
    },
  });
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        startTransition(() =>
          feedback.run(async () => {
            await createBankAccountAction(values);
            form.reset({ ...values, accountName: "", bankName: "", maskedAccountNumber: "", integrationProvider: "" });
          }, "Bank account created."),
        ),
      )}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Input placeholder="Account name" {...form.register("accountName")} />
        <Input placeholder="Bank name" {...form.register("bankName")} />
        <Input placeholder="Masked account number" {...form.register("maskedAccountNumber")} />
        <Select {...form.register("chartAccountId")}>
          {data.cashAccounts.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </Select>
      </div>
      {renderFeedback(feedback.error, feedback.message)}
      <Button disabled={feedback.isPending} type="submit">{feedback.isPending ? "Creating..." : "Create bank account"}</Button>
    </form>
  );
}

export function BankTransactionForm({ data }: { data: BankingWorkbench }) {
  const feedback = useFormFeedback();
  const form = useForm<CreateBankTransactionInput>({
    resolver: zodResolver(createBankTransactionSchema),
    defaultValues: {
      organizationId: data.organizationId,
      entityId: data.entityId,
      bankAccountId: data.bankAccounts[0]?.id ?? "",
      transactionDate: new Date().toISOString().slice(0, 10),
      postedDate: new Date().toISOString().slice(0, 10),
      description: "",
      amount: 0,
      direction: "credit",
      status: "unmatched",
    },
  });
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        startTransition(() =>
          feedback.run(async () => {
            await createBankTransactionAction(values);
            form.reset({ ...values, description: "", amount: 0 });
          }, "Bank transaction created."),
        ),
      )}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Select {...form.register("bankAccountId")}>
          {data.bankAccounts.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </Select>
        <Input type="date" {...form.register("transactionDate")} />
        <Input type="date" {...form.register("postedDate")} />
        <Select {...form.register("direction")}>
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </Select>
        <Input type="number" step="0.01" placeholder="Amount" {...form.register("amount", { valueAsNumber: true })} />
        <Select {...form.register("status")}>
          <option value="unmatched">Unmatched</option>
          <option value="matched">Matched</option>
          <option value="review">Review</option>
        </Select>
      </div>
      <Input placeholder="Description" {...form.register("description")} />
      {renderFeedback(feedback.error, feedback.message)}
      <Button disabled={feedback.isPending} type="submit">{feedback.isPending ? "Creating..." : "Create bank transaction"}</Button>
    </form>
  );
}

export function ReconciliationForm({ data }: { data: BankingWorkbench }) {
  const feedback = useFormFeedback();
  const form = useForm<CreateReconciliationInput>({
    resolver: zodResolver(createReconciliationSchema),
    defaultValues: {
      organizationId: data.organizationId,
      entityId: data.entityId,
      bankAccountId: data.bankAccounts[0]?.id ?? "",
      statementEndingOn: new Date().toISOString().slice(0, 10),
      statementBalance: 0,
      bookBalance: 0,
      status: "draft",
    },
  });
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        startTransition(() =>
          feedback.run(async () => {
            await createReconciliationAction(values);
            form.reset({ ...values, statementBalance: 0, bookBalance: 0 });
          }, "Reconciliation created."),
        ),
      )}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Select {...form.register("bankAccountId")}>
          {data.bankAccounts.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </Select>
        <Input type="date" {...form.register("statementEndingOn")} />
        <Input type="number" step="0.01" placeholder="Statement balance" {...form.register("statementBalance", { valueAsNumber: true })} />
        <Input type="number" step="0.01" placeholder="Book balance" {...form.register("bookBalance", { valueAsNumber: true })} />
      </div>
      {renderFeedback(feedback.error, feedback.message)}
      <Button disabled={feedback.isPending} type="submit">{feedback.isPending ? "Creating..." : "Create reconciliation"}</Button>
    </form>
  );
}

export function TaxRateForm({ data }: { data: SettingsWorkbench }) {
  const feedback = useFormFeedback();
  const form = useForm<CreateTaxRateInput>({
    resolver: zodResolver(createTaxRateSchema),
    defaultValues: {
      organizationId: data.organizationId,
      entityId: data.entityId,
      name: "",
      taxCode: "",
      rate: 0,
      recoverablePercent: 100,
      jurisdiction: "",
    },
  });
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        startTransition(() =>
          feedback.run(async () => {
            await createTaxRateAction(values);
            form.reset({ ...values, name: "", taxCode: "", rate: 0, jurisdiction: "" });
          }, "Tax rate created."),
        ),
      )}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Input placeholder="Tax name" {...form.register("name")} />
        <Input placeholder="Tax code" {...form.register("taxCode")} />
        <Input type="number" step="0.0001" placeholder="Rate" {...form.register("rate", { valueAsNumber: true })} />
        <Input type="number" step="0.01" placeholder="Recoverable %" {...form.register("recoverablePercent", { valueAsNumber: true })} />
      </div>
      <Input placeholder="Jurisdiction" {...form.register("jurisdiction")} />
      {renderFeedback(feedback.error, feedback.message)}
      <Button disabled={feedback.isPending} type="submit">{feedback.isPending ? "Creating..." : "Create tax rate"}</Button>
    </form>
  );
}

export function FiscalPeriodForm({ data }: { data: SettingsWorkbench }) {
  const feedback = useFormFeedback();
  const form = useForm<CreateFiscalPeriodInput>({
    resolver: zodResolver(createFiscalPeriodSchema),
    defaultValues: {
      organizationId: data.organizationId,
      entityId: data.entityId,
      periodName: "",
      startsOn: new Date().toISOString().slice(0, 10),
      endsOn: new Date().toISOString().slice(0, 10),
      status: "open",
      isAdjustmentPeriod: false,
    },
  });
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        startTransition(() =>
          feedback.run(async () => {
            await createFiscalPeriodAction(values);
            form.reset({ ...values, periodName: "" });
          }, "Fiscal period created."),
        ),
      )}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Input placeholder="Period name" {...form.register("periodName")} />
        <Input type="date" {...form.register("startsOn")} />
        <Input type="date" {...form.register("endsOn")} />
        <Select {...form.register("status")}>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </Select>
      </div>
      {renderFeedback(feedback.error, feedback.message)}
      <Button disabled={feedback.isPending} type="submit">{feedback.isPending ? "Creating..." : "Create fiscal period"}</Button>
    </form>
  );
}
