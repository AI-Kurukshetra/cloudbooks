import { z } from "zod";

export const createAssetSchema = z.object({
  organizationId: z.string().uuid(),
  entityId: z.string().uuid(),
  assetCode: z.string().min(2).max(20),
  name: z.string().min(2),
  category: z.string().min(2),
  acquisitionDate: z.string().min(1),
  inServiceDate: z.string().min(1),
  cost: z.number().positive(),
  salvageValue: z.number().nonnegative(),
  usefulLifeMonths: z.number().int().positive(),
  depreciationMethod: z.string().min(2),
  assetAccountId: z.string().uuid(),
  accumulatedDepreciationAccountId: z.string().uuid(),
  depreciationExpenseAccountId: z.string().uuid(),
});

export const updateAssetSchema = createAssetSchema.extend({
  assetId: z.string().uuid(),
});

export const deleteAssetSchema = z.object({
  assetId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

export const budgetLineInputSchema = z.object({
  accountId: z.string().uuid(),
  fiscalPeriodId: z.string().uuid().optional().or(z.literal("")),
  amount: z.number().nonnegative(),
});

export const createBudgetSchema = z
  .object({
    organizationId: z.string().uuid(),
    entityId: z.string().uuid(),
    name: z.string().min(2),
    fiscalYear: z.number().int().min(2000),
    scenario: z.string().min(2),
    lines: z.array(budgetLineInputSchema).min(1),
  })
  .refine((value) => value.lines.some((line) => line.amount > 0), {
    message: "At least one budget line must have an amount greater than zero.",
    path: ["lines"],
  });

export const createBankAccountSchema = z.object({
  organizationId: z.string().uuid(),
  entityId: z.string().uuid(),
  accountName: z.string().min(2),
  bankName: z.string().min(2),
  maskedAccountNumber: z.string().min(4).max(32),
  currencyCode: z.string().length(3),
  chartAccountId: z.string().uuid(),
  integrationProvider: z.string().optional(),
});

export const createBankTransactionSchema = z.object({
  organizationId: z.string().uuid(),
  entityId: z.string().uuid(),
  bankAccountId: z.string().uuid(),
  transactionDate: z.string().min(1),
  postedDate: z.string().optional(),
  description: z.string().min(2),
  amount: z.number().positive(),
  direction: z.enum(["credit", "debit"]),
  status: z.string().min(2),
});

export const createBankCategorizationRuleSchema = z.object({
  organizationId: z.string().uuid(),
  entityId: z.string().uuid(),
  bankAccountId: z.string().uuid().optional(),
  ruleName: z.string().min(2),
  matchField: z.enum(["description", "counterparty_name"]),
  matchOperator: z.enum(["contains", "starts_with", "equals"]),
  matchValue: z.string().min(2),
  direction: z.enum(["credit", "debit"]).optional(),
  suggestedAccountId: z.string().uuid().optional(),
  priority: z.number().int().min(1).max(999).default(100),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const importBankTransactionLineSchema = z.object({
  transactionDate: z.string().min(1),
  postedDate: z.string().optional(),
  description: z.string().min(2),
  amount: z.number().positive(),
  direction: z.enum(["credit", "debit"]),
  status: z.string().min(2).default("unmatched"),
  externalId: z.string().min(2).max(120).optional(),
});

export const importBankTransactionsSchema = z.object({
  bankAccountId: z.string().uuid(),
  transactions: z.array(importBankTransactionLineSchema).min(1).max(500),
});

export const createReconciliationSchema = z.object({
  organizationId: z.string().uuid(),
  entityId: z.string().uuid(),
  bankAccountId: z.string().uuid(),
  statementEndingOn: z.string().min(1),
  statementBalance: z.number(),
  bookBalance: z.number(),
  status: z.string().min(2),
});

export const createTaxRateSchema = z.object({
  organizationId: z.string().uuid(),
  entityId: z.string().uuid(),
  name: z.string().min(2),
  taxCode: z.string().min(2).max(20),
  rate: z.number().nonnegative(),
  recoverablePercent: z.number().min(0).max(100),
  jurisdiction: z.string().optional(),
});

export const createDepartmentSchema = z.object({
  organizationId: z.string().uuid(),
  entityId: z.string().uuid(),
  name: z.string().min(2),
  code: z.string().min(2).max(20),
  managerName: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const createCustomFieldSchema = z.object({
  organizationId: z.string().uuid(),
  entityId: z.string().uuid(),
  moduleName: z.string().min(2),
  fieldKey: z.string().min(2).max(50),
  fieldLabel: z.string().min(2),
  fieldType: z.enum(["text", "number", "date", "select", "boolean"]),
  optionsCsv: z.string().optional(),
  isRequired: z.boolean().default(false),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const createWorkflowDefinitionSchema = z.object({
  organizationId: z.string().uuid(),
  entityId: z.string().uuid(),
  workflowName: z.string().min(2),
  moduleName: z.string().min(2),
  triggerEvent: z.string().min(2),
  approvalRole: z.string().min(2),
  autoApproveBelow: z.number().nonnegative().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const createNotificationRuleSchema = z.object({
  organizationId: z.string().uuid(),
  entityId: z.string().uuid(),
  ruleName: z.string().min(2),
  eventKey: z.string().min(2),
  channel: z.enum(["email", "in_app", "both"]),
  recipientRole: z.string().min(2),
  isEnabled: z.boolean().default(true),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const createFiscalPeriodSchema = z.object({
  organizationId: z.string().uuid(),
  entityId: z.string().uuid(),
  periodName: z.string().min(2),
  startsOn: z.string().min(1),
  endsOn: z.string().min(1),
  status: z.string().min(2),
  isAdjustmentPeriod: z.boolean().default(false),
});

export const createVatReturnSchema = z.object({
  organizationId: z.string().uuid(),
  entityId: z.string().uuid(),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  filingDueOn: z.string().min(1),
  currencyCode: z.string().length(3),
  notes: z.string().max(1000).optional(),
});

export const createInventoryItemSchema = z.object({
  organizationId: z.string().uuid(),
  entityId: z.string().uuid(),
  sku: z.string().min(2).max(40),
  name: z.string().min(2),
  itemType: z.enum(["inventory", "service", "non_inventory"]).default("inventory"),
  assetAccountId: z.string().uuid().optional(),
  cogsAccountId: z.string().uuid().optional(),
  revenueAccountId: z.string().uuid().optional(),
  unitOfMeasure: z.string().min(1).default("ea"),
});

export const createInventoryMovementSchema = z.object({
  organizationId: z.string().uuid(),
  entityId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  movementDate: z.string().min(1),
  movementType: z.enum(["receipt", "issue", "adjustment"]),
  quantity: z.number().positive(),
  unitCost: z.number().nonnegative().optional(),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type DeleteAssetInput = z.infer<typeof deleteAssetSchema>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;
export type CreateBankTransactionInput = z.infer<typeof createBankTransactionSchema>;
export type CreateBankCategorizationRuleInput = z.infer<typeof createBankCategorizationRuleSchema>;
export type ImportBankTransactionsInput = z.infer<typeof importBankTransactionsSchema>;
export type CreateReconciliationInput = z.infer<typeof createReconciliationSchema>;
export type CreateTaxRateInput = z.infer<typeof createTaxRateSchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type CreateCustomFieldInput = z.infer<typeof createCustomFieldSchema>;
export type CreateWorkflowDefinitionInput = z.infer<typeof createWorkflowDefinitionSchema>;
export type CreateNotificationRuleInput = z.infer<typeof createNotificationRuleSchema>;
export type CreateFiscalPeriodInput = z.infer<typeof createFiscalPeriodSchema>;
export type CreateVatReturnInput = z.infer<typeof createVatReturnSchema>;
export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type CreateInventoryMovementInput = z.infer<typeof createInventoryMovementSchema>;
