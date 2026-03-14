"use server";

import { revalidatePath } from "next/cache";

import { archiveAccount, createAccount, updateAccount } from "@/services/master-data";
import type {
  ArchiveAccountInput,
  CreateAccountInput,
  UpdateAccountInput,
} from "@/validators/master-data";

export async function createAccountAction(input: CreateAccountInput) {
  const result = await createAccount(input);
  revalidatePath("/accounts");
  revalidatePath("/reports");
  return result;
}

export async function updateAccountAction(input: UpdateAccountInput) {
  const result = await updateAccount(input);
  revalidatePath("/accounts");
  revalidatePath("/reports");
  return result;
}

export async function archiveAccountAction(input: ArchiveAccountInput) {
  const result = await archiveAccount(input);
  revalidatePath("/accounts");
  revalidatePath("/reports");
  return result;
}
