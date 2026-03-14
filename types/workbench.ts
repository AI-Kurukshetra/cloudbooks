export type LookupOption = {
  id: string;
  label: string;
  description?: string | null;
};

export type AccountOption = LookupOption & {
  code: string;
  accountType: string;
};

export type PeriodOption = LookupOption & {
  startsOn: string;
  endsOn: string;
};

export type RecentDocument = {
  id: string;
  number: string;
  party: string;
  amount: number;
  status: string;
  date: string;
};

export type TaxRateOption = LookupOption & {
  rate: number;
};

export type ReminderRecord = {
  id: string;
  invoiceNumber: string;
  channel: string;
  reminderType: string;
  scheduledFor: string;
  status: string;
  payLinkUrl: string | null;
};

export type AttachmentDocument = {
  id: string;
  fileName: string;
  documentType: string;
  createdAt: string;
  relatedRecordId: string | null;
  downloadUrl: string | null;
};

export type InvoiceWorkbenchData = {
  organizationId: string;
  entityId: string;
  currencyCode: string;
  customers: LookupOption[];
  arAccounts: AccountOption[];
  revenueAccounts: AccountOption[];
  taxAccounts: AccountOption[];
  taxRates: TaxRateOption[];
  periods: PeriodOption[];
  projects: LookupOption[];
  recentInvoices: RecentDocument[];
  estimates: RecentDocument[];
  reminders: ReminderRecord[];
  attachments: AttachmentDocument[];
};

export type BillWorkbenchData = {
  organizationId: string;
  entityId: string;
  currencyCode: string;
  vendors: LookupOption[];
  apAccounts: AccountOption[];
  expenseAccounts: AccountOption[];
  taxAccounts: AccountOption[];
  taxRates: TaxRateOption[];
  periods: PeriodOption[];
  projects: LookupOption[];
  recentBills: RecentDocument[];
  attachments: AttachmentDocument[];
};
