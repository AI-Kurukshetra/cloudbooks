"use server";

import { revalidatePath } from "next/cache";

import { createProject, updateProject } from "@/services/master-data";
import type { CreateProjectInput, UpdateProjectInput } from "@/validators/master-data";

export async function createProjectAction(input: CreateProjectInput) {
  const result = await createProject(input);
  revalidatePath("/projects");
  revalidatePath("/invoices");
  revalidatePath("/bills");
  return result;
}

export async function updateProjectAction(input: UpdateProjectInput) {
  const result = await updateProject(input);
  revalidatePath("/projects");
  revalidatePath("/invoices");
  revalidatePath("/bills");
  return result;
}
