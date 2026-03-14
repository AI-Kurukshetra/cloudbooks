import { z } from "zod";

export const journalLineSchema = z
  .object({
    accountId: z.string().uuid(),
    description: z.string().max(255).optional(),
    debitAmount: z.number().nonnegative(),
    creditAmount: z.number().nonnegative(),
    currencyAmount: z.number().nonnegative().optional(),
    department: z.string().max(100).optional(),
    projectId: z.string().uuid().optional(),
    customerId: z.string().uuid().optional(),
    vendorId: z.string().uuid().optional(),
    taxRateId: z.string().uuid().optional(),
  })
  .refine((value) => Number(value.debitAmount > 0) + Number(value.creditAmount > 0) === 1, {
    message: "Each journal line must be either a debit or a credit.",
    path: ["debitAmount"],
  });

export const journalDraftSchema = z
  .object({
    organizationId: z.string().uuid(),
    entityId: z.string().uuid(),
    fiscalPeriodId: z.string().uuid().optional(),
    entryNumber: z.string().min(1),
    entryDate: z.string().min(1),
    description: z.string().min(1),
    sourceType: z.string().min(1),
    sourceId: z.string().uuid().optional(),
    currencyCode: z.string().length(3),
    exchangeRate: z.number().positive().optional(),
    externalReference: z.string().optional(),
    lines: z.array(journalLineSchema).min(2),
  })
  .refine(
    (value) => {
      const debitTotal = value.lines.reduce((sum, line) => sum + line.debitAmount, 0);
      const creditTotal = value.lines.reduce((sum, line) => sum + line.creditAmount, 0);
      return Math.abs(debitTotal - creditTotal) < 0.001;
    },
    {
      message: "Journal entry must balance before posting.",
      path: ["lines"],
    },
  );

export type JournalDraftInput = z.infer<typeof journalDraftSchema>;
