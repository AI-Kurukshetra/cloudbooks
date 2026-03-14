"use server";

import { revalidatePath } from "next/cache";

import {
  createCustomField,
  createDepartment,
  createFiscalPeriod,
  createNotificationRule,
  createTaxRate,
  createVatReturn,
  createWorkflowDefinition,
} from "@/services/operations";
import type {
  CreateCustomFieldInput,
  CreateDepartmentInput,
  CreateFiscalPeriodInput,
  CreateNotificationRuleInput,
  CreateTaxRateInput,
  CreateVatReturnInput,
  CreateWorkflowDefinitionInput,
} from "@/validators/operations";

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

export async function createVatReturnAction(input: CreateVatReturnInput) {
  const result = await createVatReturn(input);
  revalidatePath("/settings");
  revalidatePath("/reports");
  return result;
}

export async function createDepartmentAction(input: CreateDepartmentInput) {
  const result = await createDepartment(input);
  revalidatePath("/settings");
  return result;
}

export async function createCustomFieldAction(input: CreateCustomFieldInput) {
  const result = await createCustomField(input);
  revalidatePath("/settings");
  return result;
}

export async function createWorkflowDefinitionAction(input: CreateWorkflowDefinitionInput) {
  const result = await createWorkflowDefinition(input);
  revalidatePath("/settings");
  return result;
}

export async function createNotificationRuleAction(input: CreateNotificationRuleInput) {
  const result = await createNotificationRule(input);
  revalidatePath("/settings");
  return result;
}
