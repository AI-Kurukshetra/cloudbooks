import type { UUID } from "@/types/database";

export type JournalSourceType =
  | "manual"
  | "invoice"
  | "payment"
  | "bill"
  | "asset_depreciation"
  | "bank_reconciliation"
  | "payroll"
  | "inventory";

export type JournalDraftLine = {
  accountId: UUID;
  description?: string;
  debitAmount: number;
  creditAmount: number;
  currencyAmount?: number;
  department?: string;
  projectId?: UUID;
  customerId?: UUID;
  vendorId?: UUID;
  taxRateId?: UUID;
};

export type JournalDraft = {
  organizationId: UUID;
  entityId: UUID;
  fiscalPeriodId?: UUID;
  entryNumber: string;
  entryDate: string;
  description: string;
  sourceType: JournalSourceType;
  sourceId?: UUID;
  currencyCode: string;
  exchangeRate?: number;
  externalReference?: string;
  lines: JournalDraftLine[];
};

export type JournalPostResult = {
  entryId: UUID;
  status: "draft" | "posted" | "reversed";
  postedAt?: string | null;
};
