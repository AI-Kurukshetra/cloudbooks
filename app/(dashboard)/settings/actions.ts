"use server";

import { revalidatePath } from "next/cache";

import { createFiscalPeriod, createTaxRate } from "@/services/operations";
import type { CreateFiscalPeriodInput, CreateTaxRateInput } from "@/validators/operations";

export async function createTaxRateAction(input: CreateTaxRateInput) {
  const result = await createTaxRate(input);
  revalidatePath("/settings");
  revalidatePath("/invoices");
  revalidatePath("/bills");
  return result;
}

export async function createFiscalPeriodAction(input: CreateFiscalPeriodInput) {
  const result = await createFiscalPeriod(input);
  revalidatePath("/settings");
  revalidatePath("/journal");
  revalidatePath("/invoices");
  revalidatePath("/bills");
  revalidatePath("/budgets");
  return result;
}
