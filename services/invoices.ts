import type { SupabaseClient } from "@supabase/supabase-js";

import { accountingEngine } from "@/accounting/engine";
import type { Database } from "@/types/database";
import type { CreateInvoiceInput } from "@/validators/invoice";
import { createInvoiceSchema } from "@/validators/invoice";

export async function createInvoiceWithJournal(
  supabase: SupabaseClient<Database>,
  input: CreateInvoiceInput,
) {
  const db = supabase as any;
  const payload = createInvoiceSchema.parse(input);
  const subtotal = payload.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const total = subtotal;
  let invoiceId: string | null = null;

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
        tax_amount: 0,
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

    const invoiceLines = payload.lines.map((line, index) => ({
      organization_id: payload.organizationId,
      entity_id: payload.entityId,
      invoice_id: invoice.id,
      line_number: index + 1,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      line_amount: line.quantity * line.unitPrice,
      revenue_account_id: line.revenueAccountId,
      tax_rate_id: line.taxRateId,
      project_id: line.projectId,
      recognition_start_date: line.recognitionStartDate,
      recognition_end_date: line.recognitionEndDate,
    }));

    const { error: linesError } = await db.from("invoice_lines").insert(invoiceLines);
    if (linesError) {
      throw new Error(linesError.message);
    }

    const engine = accountingEngine({ supabase });
    const revenueAccountTotals = new Map<string, number>();

    payload.lines.forEach((line) => {
      const lineAmount = line.quantity * line.unitPrice;
      revenueAccountTotals.set(
        line.revenueAccountId,
        (revenueAccountTotals.get(line.revenueAccountId) ?? 0) + lineAmount,
      );
    });

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
