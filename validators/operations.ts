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

export const createFiscalPeriodSchema = z.object({
  organizationId: z.string().uuid(),
  entityId: z.string().uuid(),
  periodName: z.string().min(2),
  startsOn: z.string().min(1),
  endsOn: z.string().min(1),
  status: z.string().min(2),
  isAdjustmentPeriod: z.boolean().default(false),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type DeleteAssetInput = z.infer<typeof deleteAssetSchema>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;
export type CreateBankTransactionInput = z.infer<typeof createBankTransactionSchema>;
export type ImportBankTransactionsInput = z.infer<typeof importBankTransactionsSchema>;
export type CreateReconciliationInput = z.infer<typeof createReconciliationSchema>;
export type CreateTaxRateInput = z.infer<typeof createTaxRateSchema>;
export type CreateFiscalPeriodInput = z.infer<typeof createFiscalPeriodSchema>;
