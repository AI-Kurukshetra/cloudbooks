"use server";

import { revalidatePath } from "next/cache";

import { createEntity, updateEntity } from "@/services/master-data";
import type { CreateEntityInput, UpdateEntityInput } from "@/validators/master-data";

export async function createEntityAction(input: CreateEntityInput) {
  const result = await createEntity(input);
  revalidatePath("/entities");
  return result;
}

export async function updateEntityAction(input: UpdateEntityInput) {
  const result = await updateEntity(input);
  revalidatePath("/entities");
  return result;
}
