import { z } from "zod";

export const billLineSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitCost: z.number().nonnegative(),
  expenseAccountId: z.string().uuid(),
  taxRateId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
}).refine((line) => line.quantity * line.unitCost > 0, {
  message: "Bill line amount must be greater than zero.",
  path: ["unitCost"],
});

export const createBillSchema = z.object({
  organizationId: z.string().uuid(),
  entityId: z.string().uuid(),
  vendorId: z.string().uuid(),
  fiscalPeriodId: z.string().uuid().optional(),
  billNumber: z.string().min(1),
  billDate: z.string().min(1),
  dueDate: z.string().min(1),
  currencyCode: z.string().length(3),
  apAccountId: z.string().uuid(),
  taxAccountId: z.string().uuid().optional(),
  lines: z.array(billLineSchema).min(1),
}).refine(
  (value) => value.lines.reduce((sum, line) => sum + line.quantity * line.unitCost, 0) > 0,
  {
    message: "Bill total must be greater than zero.",
    path: ["lines"],
  },
);

export type CreateBillInput = z.infer<typeof createBillSchema>;
