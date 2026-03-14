import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, UUID } from "@/types/database";
import type { JournalDraft, JournalDraftLine, JournalPostResult } from "@/types/accounting";
import { journalDraftSchema } from "@/validators/journal";

type AccountingEngineContext = {
  supabase: SupabaseClient<Database>;
};

function validateBalancedLines(lines: JournalDraftLine[]) {
  const debitTotal = lines.reduce((sum, line) => sum + line.debitAmount, 0);
  const creditTotal = lines.reduce((sum, line) => sum + line.creditAmount, 0);

  if (Math.abs(debitTotal - creditTotal) > 0.001) {
    throw new Error("Journal entry is out of balance.");
  }
}

export function accountingEngine({ supabase }: AccountingEngineContext) {
  const db = supabase as any;

  return {
    async createJournalEntry(draft: JournalDraft): Promise<JournalPostResult> {
      const parsed = journalDraftSchema.parse(draft);
      validateBalancedLines(parsed.lines);

      const { data: entry, error: entryError } = await db.rpc("create_journal_entry", {
        p_organization_id: parsed.organizationId,
        p_entity_id: parsed.entityId,
        p_fiscal_period_id: parsed.fiscalPeriodId ?? null,
        p_entry_number: parsed.entryNumber,
        p_entry_date: parsed.entryDate,
        p_description: parsed.description,
        p_source_type: parsed.sourceType,
        p_source_id: parsed.sourceId ?? null,
        p_currency_code: parsed.currencyCode,
        p_exchange_rate: parsed.exchangeRate ?? 1,
        p_external_reference: parsed.externalReference ?? null,
        p_lines: parsed.lines,
      });

      if (entryError || !entry) {
        throw new Error(entryError?.message ?? "Unable to create journal entry.");
      }

      return {
        entryId: entry.id,
        status: entry.status,
        postedAt: entry.posted_at,
      };
    },

    async postJournalEntry(entryId: UUID): Promise<JournalPostResult> {
      const { data, error } = await db.rpc("post_journal_entry", {
        p_journal_entry_id: entryId,
      });

      if (error || !data) {
        throw new Error(error?.message ?? "Unable to post journal entry.");
      }

      return {
        entryId: data.id,
        status: data.status,
        postedAt: data.posted_at,
      };
    },

    async createAndPostJournalEntry(draft: JournalDraft) {
      const created = await this.createJournalEntry(draft);
      return this.postJournalEntry(created.entryId);
    },
  };
}
