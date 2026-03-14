"use server";

import { revalidatePath } from "next/cache";

import {
  createBankAccount,
  createBankCategorizationRule,
  createBankTransaction,
  createReconciliation,
} from "@/services/operations";
import type {
  CreateBankAccountInput,
  CreateBankCategorizationRuleInput,
  CreateBankTransactionInput,
  CreateReconciliationInput,
} from "@/validators/operations";

export async function createBankAccountAction(input: CreateBankAccountInput) {
  const result = await createBankAccount(input);
  revalidatePath("/banking");
  revalidatePath("/dashboard");
  return result;
}

export async function createBankTransactionAction(input: CreateBankTransactionInput) {
  const result = await createBankTransaction(input);
  revalidatePath("/banking");
  revalidatePath("/dashboard");
  return result;
}

export async function createBankCategorizationRuleAction(input: CreateBankCategorizationRuleInput) {
  const result = await createBankCategorizationRule(input);
  revalidatePath("/banking");
  return result;
}

export async function createReconciliationAction(input: CreateReconciliationInput) {
  const result = await createReconciliation(input);
  revalidatePath("/banking");
  return result;
}
