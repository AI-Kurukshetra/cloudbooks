import type { SupabaseClient } from "@supabase/supabase-js";

import { accountingEngine } from "@/accounting/engine";
import type { Database } from "@/types/database";
import type { CreateBillInput } from "@/validators/bill";
import { createBillSchema } from "@/validators/bill";

export async function createBillWithJournal(
  supabase: SupabaseClient<Database>,
  input: CreateBillInput,
) {
  const db = supabase as any;
  const payload = createBillSchema.parse(input);
  const subtotal = payload.lines.reduce((sum, line) => sum + line.quantity * line.unitCost, 0);
  const total = subtotal;
  let billId: string | null = null;

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
        tax_amount: 0,
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

    const billLines = payload.lines.map((line, index) => ({
      organization_id: payload.organizationId,
      entity_id: payload.entityId,
      bill_id: bill.id,
      line_number: index + 1,
      description: line.description,
      quantity: line.quantity,
      unit_cost: line.unitCost,
      line_amount: line.quantity * line.unitCost,
      expense_account_id: line.expenseAccountId,
      tax_rate_id: line.taxRateId,
      project_id: line.projectId,
    }));

    const { error: linesError } = await db.from("bill_lines").insert(billLines);
    if (linesError) {
      throw new Error(linesError.message);
    }

    const expenseAccountTotals = new Map<string, number>();
    payload.lines.forEach((line) => {
      const lineAmount = line.quantity * line.unitCost;
      expenseAccountTotals.set(
        line.expenseAccountId,
        (expenseAccountTotals.get(line.expenseAccountId) ?? 0) + lineAmount,
      );
    });

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
