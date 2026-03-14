import { z } from "zod";

export const invoiceLineSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  revenueAccountId: z.string().uuid(),
  taxRateId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  recognitionStartDate: z.string().optional(),
  recognitionEndDate: z.string().optional(),
}).refine((line) => line.quantity * line.unitPrice > 0, {
  message: "Invoice line amount must be greater than zero.",
  path: ["unitPrice"],
});

export const createInvoiceSchema = z.object({
  organizationId: z.string().uuid(),
  entityId: z.string().uuid(),
  customerId: z.string().uuid(),
  fiscalPeriodId: z.string().uuid().optional(),
  invoiceNumber: z.string().min(1),
  invoiceDate: z.string().min(1),
  dueDate: z.string().min(1),
  currencyCode: z.string().length(3),
  arAccountId: z.string().uuid(),
  taxLiabilityAccountId: z.string().uuid().optional(),
  lines: z.array(invoiceLineSchema).min(1),
}).refine(
  (value) => value.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0) > 0,
  {
    message: "Invoice total must be greater than zero.",
    path: ["lines"],
  },
);

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
