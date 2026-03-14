import type { SupabaseClient } from "@supabase/supabase-js";

import { accountingEngine } from "@/accounting/engine";
import type { Database } from "@/types/database";
import type { CreateBillInput } from "@/validators/bill";
import { createBillSchema } from "@/validators/bill";

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export async function createBillWithJournal(
  supabase: SupabaseClient<Database>,
  input: CreateBillInput,
) {
  const db = supabase as any;
  const payload = createBillSchema.parse(input);
  const taxRateIds = Array.from(new Set(payload.lines.map((line) => line.taxRateId).filter(Boolean))) as string[];
  const taxRates = new Map<string, number>();
  let billId: string | null = null;

  if (taxRateIds.length > 0) {
    const { data: rows, error } = await db.from("tax_rates").select("id, rate").in("id", taxRateIds);
    if (error) {
      throw new Error(error.message);
    }
    for (const row of rows ?? []) {
      taxRates.set(row.id, Number(row.rate ?? 0));
    }
  }

  const preparedLines = payload.lines.map((line) => {
    const lineAmount = roundCurrency(line.quantity * line.unitCost);
    const taxAmount = roundCurrency(lineAmount * Number(line.taxRateId ? taxRates.get(line.taxRateId) ?? 0 : 0));

    return {
      ...line,
      lineAmount,
      taxAmount,
    };
  });

  const subtotal = roundCurrency(preparedLines.reduce((sum, line) => sum + line.lineAmount, 0));
  const taxTotal = roundCurrency(preparedLines.reduce((sum, line) => sum + line.taxAmount, 0));
  const total = roundCurrency(subtotal + taxTotal);

  if (taxTotal > 0 && !payload.taxAccountId) {
    throw new Error("Select a tax account before posting a taxable bill.");
  }

  try {
    const { data: bill, error } = await db
      .from("bills")
      .insert({
        organization_id: payload.organizationId,
        entity_id: payload.entityId,
        vendor_id: payload.vendorId,
        fiscal_period_id: payload.fiscalPeriodId,
        bill_number: payload.billNumber,
        bill_date: payload.billDate,
        due_date: payload.dueDate,
        currency_code: payload.currencyCode,
        subtotal_amount: subtotal,
        tax_amount: taxTotal,
        total_amount: total,
        outstanding_amount: total,
        status: "draft",
        approval_state: "pending",
      })
      .select()
      .single();

    if (error || !bill) {
      throw new Error(error?.message ?? "Unable to create bill.");
    }

    billId = bill.id;

    const { error: linesError } = await db.from("bill_lines").insert(
      preparedLines.map((line, index) => ({
        organization_id: payload.organizationId,
        entity_id: payload.entityId,
        bill_id: bill.id,
        line_number: index + 1,
        description: line.description,
        quantity: line.quantity,
        unit_cost: line.unitCost,
        line_amount: line.lineAmount,
        expense_account_id: line.expenseAccountId,
        tax_rate_id: line.taxRateId,
        project_id: line.projectId,
      })),
    );

    if (linesError) {
      throw new Error(linesError.message);
    }

    const expenseAccountTotals = new Map<string, number>();
    for (const line of preparedLines) {
      expenseAccountTotals.set(
        line.expenseAccountId,
        roundCurrency((expenseAccountTotals.get(line.expenseAccountId) ?? 0) + line.lineAmount),
      );
    }

    const engine = accountingEngine({ supabase });
    const postedJournal = await engine.createAndPostJournalEntry({
      organizationId: payload.organizationId,
      entityId: payload.entityId,
      fiscalPeriodId: payload.fiscalPeriodId,
      entryNumber: `JE-${payload.billNumber}`,
      entryDate: payload.billDate,
      description: `Bill ${payload.billNumber} accrued`,
      sourceType: "bill",
      sourceId: bill.id,
      currencyCode: payload.currencyCode,
      lines: [
        ...Array.from(expenseAccountTotals.entries()).map(([accountId, amount]) => ({
          accountId,
          description: "Expense recognized",
          debitAmount: amount,
          creditAmount: 0,
          vendorId: payload.vendorId,
        })),
        ...(taxTotal > 0 && payload.taxAccountId
          ? [
              {
                accountId: payload.taxAccountId,
                description: "Recoverable tax",
                debitAmount: taxTotal,
                creditAmount: 0,
                vendorId: payload.vendorId,
              },
            ]
          : []),
        {
          accountId: payload.apAccountId,
          description: "Accounts payable",
          debitAmount: 0,
          creditAmount: total,
          vendorId: payload.vendorId,
        },
      ],
    });

    await db
      .from("bills")
      .update({ journal_entry_id: postedJournal.entryId, status: "approved", approval_state: "approved" })
      .eq("id", bill.id);

    return { billId: bill.id, journalEntryId: postedJournal.entryId };
  } catch (error) {
    if (billId) {
      await db.from("bills").delete().eq("id", billId);
    }
    throw error;
  }
}
