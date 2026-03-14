"use server";

import { revalidatePath } from "next/cache";

import { accountingEngine } from "@/accounting/engine";
import { createServerSupabaseClient } from "@/supabase/server";
import type { JournalDraft } from "@/types/accounting";

export async function postManualJournal(draft: JournalDraft) {
  const supabase = await createServerSupabaseClient();
  const engine = accountingEngine({ supabase });
  const result = await engine.createAndPostJournalEntry(draft);
  revalidatePath("/journal");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return result;
}
