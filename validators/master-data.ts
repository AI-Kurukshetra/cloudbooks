import { z } from "zod";

export const createEntitySchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(2),
  legalName: z.string().min(2).optional(),
  code: z.string().min(2).max(10),
  jurisdiction: z.string().min(2).optional(),
  reportingCurrencyCode: z.string().length(3),
});

export const updateEntitySchema = createEntitySchema.extend({
  entityId: z.string().uuid(),
});

export const createAccountSchema = z.object({
  organizationId: z.string().uuid(),
  entityId: z.string().uuid(),
  accountCode: z.string().min(3).max(20),
  name: z.string().min(2),
  description: z.string().optional(),
  accountType: z.enum(["asset", "liability", "equity", "revenue", "expense"]),
  normalBalance: z.enum(["debit", "credit"]),
  currencyCode: z.string().length(3),
});

export const updateAccountSchema = createAccountSchema.extend({
  accountId: z.string().uuid(),
  isActive: z.boolean(),
});

export const archiveAccountSchema = z.object({
  accountId: z.string().uuid(),
  organizationId: z.string().uuid(),
  entityId: z.string().uuid(),
  isActive: z.boolean(),
});

export const createCustomerSchema = z.object({
  organizationId: z.string().uuid(),
  entityId: z.string().uuid(),
  customerCode: z.string().min(2).max(20),
  legalName: z.string().min(2),
  displayName: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
});

export const updateCustomerSchema = createCustomerSchema.extend({
  customerId: z.string().uuid(),
  status: z.string().min(2),
});

export const createVendorSchema = z.object({
  organizationId: z.string().uuid(),
  entityId: z.string().uuid(),
  vendorCode: z.string().min(2).max(20),
  legalName: z.string().min(2),
  displayName: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  paymentTermsDays: z.number().int().positive(),
});

export const updateVendorSchema = createVendorSchema.extend({
  vendorId: z.string().uuid(),
  status: z.string().min(2),
});

export const createProjectSchema = z.object({
  organizationId: z.string().uuid(),
  entityId: z.string().uuid(),
  projectCode: z.string().min(2).max(20),
  name: z.string().min(2),
  customerId: z.string().uuid().optional().or(z.literal("")),
  startDate: z.string().optional(),
  budgetAmount: z.number().nonnegative().optional(),
});

export const updateProjectSchema = createProjectSchema.extend({
  projectId: z.string().uuid(),
  status: z.string().min(2),
});

export type CreateEntityInput = z.infer<typeof createEntitySchema>;
export type UpdateEntityInput = z.infer<typeof updateEntitySchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type ArchiveAccountInput = z.infer<typeof archiveAccountSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
