"use server";

import { revalidatePath } from "next/cache";

import { createCustomer, updateCustomer } from "@/services/master-data";
import type { CreateCustomerInput, UpdateCustomerInput } from "@/validators/master-data";

export async function createCustomerAction(input: CreateCustomerInput) {
  const result = await createCustomer(input);
  revalidatePath("/customers");
  revalidatePath("/invoices");
  return result;
}

export async function updateCustomerAction(input: UpdateCustomerInput) {
  const result = await updateCustomer(input);
  revalidatePath("/customers");
  revalidatePath("/invoices");
  return result;
}
