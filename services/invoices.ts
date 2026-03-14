import { randomUUID } from "crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import { accountingEngine } from "@/accounting/engine";
import type { Database } from "@/types/database";
import type {
  ConvertEstimateInput,
  CreateEstimateInput,
  CreateInvoiceInput,
  CreateInvoiceReminderInput,
} from "@/validators/invoice";
import {
  convertEstimateSchema,
  createEstimateSchema,
  createInvoiceReminderSchema,
  createInvoiceSchema,
} from "@/validators/invoice";

type TaxRateRow = {
  id: string;
  rate: number;
};

type InvoiceLinePayload = CreateInvoiceInput["lines"][number];
type EstimateLinePayload = CreateEstimateInput["lines"][number];

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

async function getTaxRates(db: any, taxRateIds: string[]) {
  if (taxRateIds.length === 0) {
    return new Map<string, TaxRateRow>();
  }

  const { data, error } = await db.from("tax_rates").select("id, rate").in("id", taxRateIds);
  if (error) {
    throw new Error(error.message);
  }

  return new Map<string, TaxRateRow>((data ?? []).map((row: any) => [row.id, { id: row.id, rate: Number(row.rate ?? 0) }]));
}

async function calculateLineTotals(db: any, lines: Array<InvoiceLinePayload | EstimateLinePayload>) {
  const taxRateIds = Array.from(new Set(lines.map((line) => line.taxRateId).filter(Boolean))) as string[];
  const taxRates = await getTaxRates(db, taxRateIds);

  return lines.map((line) => {
    const lineAmount = roundCurrency(line.quantity * line.unitPrice);
    const taxRate = line.taxRateId ? taxRates.get(line.taxRateId) : null;
    const taxAmount = roundCurrency(lineAmount * Number(taxRate?.rate ?? 0));

    return {
      ...line,
      lineAmount,
      taxAmount,
    };
  });
}

async function insertInvoiceLines(
  db: any,
  organizationId: string,
  entityId: string,
  invoiceId: string,
  lines: Awaited<ReturnType<typeof calculateLineTotals>>,
) {
  const { error } = await db.from("invoice_lines").insert(
    lines.map((line, index) => ({
      organization_id: organizationId,
      entity_id: entityId,
      invoice_id: invoiceId,
      line_number: index + 1,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      line_amount: line.lineAmount,
      revenue_account_id: line.revenueAccountId,
      tax_rate_id: line.taxRateId,
      project_id: line.projectId,
      recognition_start_date: line.recognitionStartDate,
      recognition_end_date: line.recognitionEndDate,
    })),
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function createInvoiceFromPreparedLines(
  supabase: SupabaseClient<Database>,
  payload: Omit<CreateInvoiceInput, "lines"> & { lines: Array<InvoiceLinePayload | EstimateLinePayload> },
) {
  const db = supabase as any;
  const preparedLines = await calculateLineTotals(db, payload.lines);
  const subtotal = roundCurrency(preparedLines.reduce((sum, line) => sum + line.lineAmount, 0));
  const taxTotal = roundCurrency(preparedLines.reduce((sum, line) => sum + line.taxAmount, 0));
  const total = roundCurrency(subtotal + taxTotal);
  let invoiceId: string | null = null;

  if (taxTotal > 0 && !payload.taxAccountId) {
    throw new Error("Select a tax account before posting a taxable invoice.");
  }

  try {
    const { data: invoice, error } = await db
      .from("invoices")
      .insert({
        organization_id: payload.organizationId,
        entity_id: payload.entityId,
        customer_id: payload.customerId,
        fiscal_period_id: payload.fiscalPeriodId,
        invoice_number: payload.invoiceNumber,
        invoice_date: payload.invoiceDate,
        due_date: payload.dueDate,
        currency_code: payload.currencyCode,
        subtotal_amount: subtotal,
        tax_amount: taxTotal,
        total_amount: total,
        outstanding_amount: total,
        status: "draft",
      })
      .select()
      .single();

    if (error || !invoice) {
      throw new Error(error?.message ?? "Unable to create invoice.");
    }

    invoiceId = invoice.id;
    await insertInvoiceLines(db, payload.organizationId, payload.entityId, invoice.id, preparedLines);

    const revenueAccountTotals = new Map<string, number>();

    for (const line of preparedLines) {
      revenueAccountTotals.set(
        line.revenueAccountId,
        roundCurrency((revenueAccountTotals.get(line.revenueAccountId) ?? 0) + line.lineAmount),
      );
    }

    const engine = accountingEngine({ supabase });
    const postedJournal = await engine.createAndPostJournalEntry({
      organizationId: payload.organizationId,
      entityId: payload.entityId,
      fiscalPeriodId: payload.fiscalPeriodId,
      entryNumber: `JE-${payload.invoiceNumber}`,
      entryDate: payload.invoiceDate,
      description: `Invoice ${payload.invoiceNumber} issued`,
      sourceType: "invoice",
      sourceId: invoice.id,
      currencyCode: payload.currencyCode,
      lines: [
        {
          accountId: payload.arAccountId,
          description: "Accounts receivable",
          debitAmount: total,
          creditAmount: 0,
          customerId: payload.customerId,
        },
        ...Array.from(revenueAccountTotals.entries()).map(([accountId, amount]) => ({
          accountId,
          description: "Revenue recognized on invoice issuance",
          debitAmount: 0,
          creditAmount: amount,
          customerId: payload.customerId,
        })),
        ...(taxTotal > 0 && payload.taxAccountId
          ? [
              {
                accountId: payload.taxAccountId,
                description: "Output tax liability",
                debitAmount: 0,
                creditAmount: taxTotal,
                customerId: payload.customerId,
              },
            ]
          : []),
      ],
    });

    await db
      .from("invoices")
      .update({ journal_entry_id: postedJournal.entryId, status: "approved" })
      .eq("id", invoice.id);

    return { invoiceId: invoice.id, journalEntryId: postedJournal.entryId };
  } catch (error) {
    if (invoiceId) {
      await db.from("invoices").delete().eq("id", invoiceId);
    }
    throw error;
  }
}

export async function createInvoiceWithJournal(
  supabase: SupabaseClient<Database>,
  input: CreateInvoiceInput,
) {
  const payload = createInvoiceSchema.parse(input);
  return createInvoiceFromPreparedLines(supabase, payload);
}

export async function createEstimate(supabase: SupabaseClient<Database>, input: CreateEstimateInput) {
  const db = supabase as any;
  const payload = createEstimateSchema.parse(input);
  const preparedLines = await calculateLineTotals(db, payload.lines);
  const subtotal = roundCurrency(preparedLines.reduce((sum, line) => sum + line.lineAmount, 0));
  const taxTotal = roundCurrency(preparedLines.reduce((sum, line) => sum + line.taxAmount, 0));
  const total = roundCurrency(subtotal + taxTotal);
  let estimateId: string | null = null;

  try {
    const { data: estimate, error } = await db
      .from("estimates")
      .insert({
        organization_id: payload.organizationId,
        entity_id: payload.entityId,
        customer_id: payload.customerId,
        fiscal_period_id: payload.fiscalPeriodId,
        estimate_number: payload.estimateNumber,
        estimate_date: payload.estimateDate,
        valid_until: payload.validUntil,
        status: "sent",
        currency_code: payload.currencyCode,
        subtotal_amount: subtotal,
        tax_amount: taxTotal,
        total_amount: total,
        notes: payload.notes || null,
      })
      .select()
      .single();

    if (error || !estimate) {
      throw new Error(error?.message ?? "Unable to create estimate.");
    }

    estimateId = estimate.id;

    const { error: linesError } = await db.from("estimate_lines").insert(
      preparedLines.map((line, index) => ({
        organization_id: payload.organizationId,
        entity_id: payload.entityId,
        estimate_id: estimate.id,
        line_number: index + 1,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        line_amount: line.lineAmount,
        revenue_account_id: line.revenueAccountId,
        tax_rate_id: line.taxRateId,
        project_id: line.projectId,
        recognition_start_date: line.recognitionStartDate,
        recognition_end_date: line.recognitionEndDate,
      })),
    );

    if (linesError) {
      throw new Error(linesError.message);
    }

    return { estimateId: estimate.id };
  } catch (error) {
    if (estimateId) {
      await db.from("estimates").delete().eq("id", estimateId);
    }
    throw error;
  }
}

export async function convertEstimateToInvoice(
  supabase: SupabaseClient<Database>,
  input: ConvertEstimateInput,
) {
  const db = supabase as any;
  const payload = convertEstimateSchema.parse(input);

  const { data: estimate, error } = await db
    .from("estimates")
    .select(
      "id, customer_id, fiscal_period_id, estimate_number, currency_code, subtotal_amount, tax_amount, total_amount, status, converted_invoice_id, estimate_lines(*)",
    )
    .eq("id", payload.estimateId)
    .eq("organization_id", payload.organizationId)
    .single();

  if (error || !estimate) {
    throw new Error(error?.message ?? "Estimate not found.");
  }

  if (estimate.converted_invoice_id) {
    throw new Error("Estimate has already been converted.");
  }

  const invoiceNumber = estimate.estimate_number.replace(/^EST/, "INV");
  const result = await createInvoiceFromPreparedLines(supabase, {
    organizationId: payload.organizationId,
    entityId: payload.entityId,
    customerId: estimate.customer_id,
    fiscalPeriodId: payload.fiscalPeriodId ?? estimate.fiscal_period_id ?? undefined,
    invoiceNumber,
    invoiceDate: payload.invoiceDate,
    dueDate: payload.dueDate,
    currencyCode: estimate.currency_code,
    arAccountId: payload.arAccountId,
    taxAccountId: payload.taxAccountId,
    lines: (estimate.estimate_lines ?? []).map((line: any) => ({
      description: line.description,
      quantity: Number(line.quantity),
      unitPrice: Number(line.unit_price),
      revenueAccountId: line.revenue_account_id,
      taxRateId: line.tax_rate_id ?? undefined,
      projectId: line.project_id ?? undefined,
      recognitionStartDate: line.recognition_start_date ?? undefined,
      recognitionEndDate: line.recognition_end_date ?? undefined,
    })),
  });

  await db
    .from("estimates")
    .update({ status: "converted", converted_invoice_id: result.invoiceId })
    .eq("id", payload.estimateId);

  return result;
}

export async function createInvoiceReminder(
  supabase: SupabaseClient<Database>,
  input: CreateInvoiceReminderInput,
) {
  const db = supabase as any;
  const payload = createInvoiceReminderSchema.parse(input);
  const payLinkToken = payload.generatePayLink ? randomUUID().replaceAll("-", "") : null;

  const { data, error } = await db
    .from("invoice_reminders")
    .insert({
      organization_id: payload.organizationId,
      entity_id: payload.entityId,
      invoice_id: payload.invoiceId,
      reminder_type: payload.reminderType,
      delivery_channel: payload.deliveryChannel,
      scheduled_for: payload.scheduledFor,
      status: "scheduled",
      pay_link_token: payLinkToken,
      pay_link_expires_at: payload.generatePayLink ? payload.payLinkExpiresAt || null : null,
      note: payload.note || null,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to schedule invoice reminder.");
  }

  return {
    reminderId: data.id,
    payLinkToken,
  };
}

export async function getReminderByPayToken(supabase: SupabaseClient<Database>, token: string) {
  const db = supabase as any;
  const { data, error } = await db
    .from("invoice_reminders")
    .select(
      "id, scheduled_for, pay_link_expires_at, invoice:invoices(invoice_number, total_amount, outstanding_amount, due_date, currency_code, customer:customers(display_name))",
    )
    .eq("pay_link_token", token)
    .single();

  if (error || !data) {
    return null;
  }

  if (data.pay_link_expires_at && new Date(data.pay_link_expires_at).getTime() < Date.now()) {
    return null;
  }

  return data;
}
