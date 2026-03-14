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
  taxAccountId: z.string().uuid().optional(),
  lines: z.array(invoiceLineSchema).min(1),
}).refine(
  (value) => value.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0) > 0,
  {
    message: "Invoice total must be greater than zero.",
    path: ["lines"],
  },
);

export const createEstimateSchema = z.object({
  organizationId: z.string().uuid(),
  entityId: z.string().uuid(),
  customerId: z.string().uuid(),
  fiscalPeriodId: z.string().uuid().optional(),
  estimateNumber: z.string().min(1),
  estimateDate: z.string().min(1),
  validUntil: z.string().min(1),
  currencyCode: z.string().length(3),
  notes: z.string().max(1000).optional(),
  lines: z.array(invoiceLineSchema).min(1),
  taxAccountId: z.string().uuid().optional(),
}).refine(
  (value) => value.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0) > 0,
  {
    message: "Estimate total must be greater than zero.",
    path: ["lines"],
  },
);

export const convertEstimateSchema = z.object({
  organizationId: z.string().uuid(),
  entityId: z.string().uuid(),
  estimateId: z.string().uuid(),
  arAccountId: z.string().uuid(),
  taxAccountId: z.string().uuid().optional(),
  invoiceDate: z.string().min(1),
  dueDate: z.string().min(1),
  fiscalPeriodId: z.string().uuid().optional(),
});

export const createInvoiceReminderSchema = z.object({
  organizationId: z.string().uuid(),
  entityId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  reminderType: z.enum(["quote_follow_up", "invoice_due", "invoice_overdue", "final_notice"]),
  deliveryChannel: z.enum(["email", "sms", "portal"]),
  scheduledFor: z.string().min(1),
  note: z.string().max(1000).optional(),
  generatePayLink: z.boolean().default(false),
  payLinkExpiresAt: z.string().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type CreateEstimateInput = z.infer<typeof createEstimateSchema>;
export type ConvertEstimateInput = z.infer<typeof convertEstimateSchema>;
export type CreateInvoiceReminderInput = z.infer<typeof createInvoiceReminderSchema>;
