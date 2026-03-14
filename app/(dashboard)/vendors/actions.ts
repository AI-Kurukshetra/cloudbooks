"use server";

import { revalidatePath } from "next/cache";

import { createVendor, updateVendor } from "@/services/master-data";
import type { CreateVendorInput, UpdateVendorInput } from "@/validators/master-data";

export async function createVendorAction(input: CreateVendorInput) {
  const result = await createVendor(input);
  revalidatePath("/vendors");
  revalidatePath("/bills");
  return result;
}

export async function updateVendorAction(input: UpdateVendorInput) {
  const result = await updateVendor(input);
  revalidatePath("/vendors");
  revalidatePath("/bills");
  return result;
}
