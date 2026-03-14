"use server";

import { revalidatePath } from "next/cache";

import { createBudget } from "@/services/operations";
import type { CreateBudgetInput } from "@/validators/operations";

export async function createBudgetAction(input: CreateBudgetInput) {
  const result = await createBudget(input);
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return result;
}
