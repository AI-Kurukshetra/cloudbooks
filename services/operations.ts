import { createServerSupabaseClient } from "@/supabase/server";
import type { MembershipContext } from "@/services/auth";
import { deleteRelatedDocuments, listDocumentsForTable, type AttachmentRecord } from "@/services/documents";
import type { JournalDraft } from "@/types/accounting";
import type {
  CreateAssetInput,
  CreateBankAccountInput,
  CreateBankTransactionInput,
  CreateBudgetInput,
  DeleteAssetInput,
  CreateFiscalPeriodInput,
  ImportBankTransactionsInput,
  CreateReconciliationInput,
  CreateTaxRateInput,
  UpdateAssetInput,
} from "@/validators/operations";
import {
  createAssetSchema,
  createBankAccountSchema,
  createBankTransactionSchema,
  createBudgetSchema,
  deleteAssetSchema,
  createFiscalPeriodSchema,
  importBankTransactionsSchema,
  createReconciliationSchema,
  createTaxRateSchema,
  updateAssetSchema,
} from "@/validators/operations";

type Lookup = { id: string; label: string; detail?: string };
type RecordRow = { id: string; primary: string; secondary: string; tertiary: string; status: string };
export type AssetRegistryRecord = {
  id: string;
  assetCode: string;
  name: string;
  category: string;
  acquisitionDate: string;
  inServiceDate: string;
  cost: number;
  salvageValue: number;
  usefulLifeMonths: number;
  depreciationMethod: string;
  assetAccountId: string;
  accumulatedDepreciationAccountId: string;
  depreciationExpenseAccountId: string;
  status: string;
};

export type JournalWorkbench = {
  organizationId: string;
  entityId: string;
  currencyCode: string;
  periods: Lookup[];
  accounts: Lookup[];
  customers: Lookup[];
  vendors: Lookup[];
  projects: Lookup[];
  records: RecordRow[];
};

export type AssetsWorkbench = {
  organizationId: string;
  entityId: string;
  accounts: Lookup[];
  expenseAccounts: Lookup[];
  records: RecordRow[];
  assetRecords: AssetRegistryRecord[];
  attachments: AttachmentRecord[];
};

export type BudgetsWorkbench = {
  organizationId: string;
  entityId: string;
  periods: Lookup[];
  accounts: Lookup[];
  records: RecordRow[];
};

export type BankingWorkbench = {
  organizationId: string;
  entityId: string;
  currencyCode: string;
  bankAccounts: Lookup[];
  cashAccounts: Lookup[];
  transactionRecords: RecordRow[];
  accountRecords: RecordRow[];
  reconciliationRecords: RecordRow[];
};

export type SettingsWorkbench = {
  organizationId: string;
  entityId: string;
  taxRateRecords: RecordRow[];
  fiscalPeriodRecords: RecordRow[];
};

function entityFilter<T extends { eq: (column: string, value: string) => T }>(query: T, entityId: string | null) {
  return entityId ? query.eq("entity_id", entityId) : query;
}

function mapLookup(rows: any[], label: (row: any) => string, detail?: (row: any) => string | undefined): Lookup[] {
  return rows.map((row) => ({
    id: row.id,
    label: label(row),
    detail: detail ? detail(row) : undefined,
  }));
}

function formatAmount(value: unknown) {
  return `$${Number(value ?? 0).toLocaleString()}`;
}

function toSignedBankAmount(amount: number, direction: "credit" | "debit") {
  return direction === "debit" ? -amount : amount;
}

export async function getJournalWorkbench(membership: MembershipContext): Promise<JournalWorkbench> {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const [entityResult, periodsResult, accountsResult, customersResult, vendorsResult, projectsResult, journalsResult] =
    await Promise.all([
      db.from("entities").select("reporting_currency_code").eq("id", membership.entityId).single(),
      entityFilter(
        db.from("fiscal_periods").select("id, period_name, status").eq("organization_id", membership.organizationId).order("starts_on", { ascending: false }),
        membership.entityId,
      ),
      entityFilter(
        db.from("chart_of_accounts").select("id, account_code, name").eq("organization_id", membership.organizationId).eq("is_active", true).order("account_code", { ascending: true }),
        membership.entityId,
      ),
      entityFilter(
        db.from("customers").select("id, display_name").eq("organization_id", membership.organizationId).eq("status", "active").order("display_name", { ascending: true }),
        membership.entityId,
      ),
      entityFilter(
        db.from("vendors").select("id, display_name").eq("organization_id", membership.organizationId).eq("status", "active").order("display_name", { ascending: true }),
        membership.entityId,
      ),
      entityFilter(
        db.from("projects").select("id, name").eq("organization_id", membership.organizationId).eq("status", "active").order("name", { ascending: true }),
        membership.entityId,
      ),
      entityFilter(
        db.from("journal_entries").select("id, entry_number, source_type, entry_date, status").eq("organization_id", membership.organizationId).order("entry_date", { ascending: false }).limit(10),
        membership.entityId,
      ),
    ]);

  const errors = [entityResult.error, periodsResult.error, accountsResult.error, customersResult.error, vendorsResult.error, projectsResult.error, journalsResult.error].filter(Boolean);
  if (errors.length) throw new Error(errors[0]?.message ?? "Unable to load journal workbench.");

  return {
    organizationId: membership.organizationId,
    entityId: membership.entityId ?? "",
    currencyCode: entityResult.data?.reporting_currency_code ?? "USD",
    periods: mapLookup(periodsResult.data ?? [], (row) => row.period_name, (row) => row.status),
    accounts: mapLookup(accountsResult.data ?? [], (row) => `${row.account_code} · ${row.name}`),
    customers: mapLookup(customersResult.data ?? [], (row) => row.display_name),
    vendors: mapLookup(vendorsResult.data ?? [], (row) => row.display_name),
    projects: mapLookup(projectsResult.data ?? [], (row) => row.name),
    records: (journalsResult.data ?? []).map((row: any) => ({
      id: row.id,
      primary: row.entry_number,
      secondary: row.source_type,
      tertiary: row.entry_date,
      status: row.status,
    })),
  };
}

export async function getAssetsWorkbench(membership: MembershipContext): Promise<AssetsWorkbench> {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const [accountsResult, assetsResult, attachments] = await Promise.all([
    entityFilter(
      db.from("chart_of_accounts").select("id, account_code, name, account_type").eq("organization_id", membership.organizationId).eq("is_active", true).order("account_code", { ascending: true }),
      membership.entityId,
    ),
    entityFilter(
      db
        .from("assets")
        .select("id, name, asset_code, category, acquisition_date, in_service_date, cost, salvage_value, useful_life_months, depreciation_method, asset_account_id, accumulated_depreciation_account_id, depreciation_expense_account_id, status")
        .eq("organization_id", membership.organizationId)
        .order("acquisition_date", { ascending: false }),
      membership.entityId,
    ),
    listDocumentsForTable(membership, "assets"),
  ]);
  if (accountsResult.error) throw new Error(accountsResult.error.message);
  if (assetsResult.error) throw new Error(assetsResult.error.message);
  const accounts = accountsResult.data ?? [];
  const assetRows = assetsResult.data ?? [];
  return {
    organizationId: membership.organizationId,
    entityId: membership.entityId ?? "",
    accounts: mapLookup(accounts, (row) => `${row.account_code} · ${row.name}`, (row) => row.account_type),
    expenseAccounts: mapLookup(accounts.filter((row: any) => row.account_type === "expense"), (row) => `${row.account_code} · ${row.name}`),
    records: assetRows.map((row: any) => ({
      id: row.id,
      primary: row.name,
      secondary: row.asset_code,
      tertiary: row.category,
      status: row.status,
    })),
    assetRecords: assetRows.map((row: any) => ({
      id: row.id,
      assetCode: row.asset_code,
      name: row.name,
      category: row.category,
      acquisitionDate: row.acquisition_date,
      inServiceDate: row.in_service_date,
      cost: Number(row.cost ?? 0),
      salvageValue: Number(row.salvage_value ?? 0),
      usefulLifeMonths: row.useful_life_months,
      depreciationMethod: row.depreciation_method,
      assetAccountId: row.asset_account_id,
      accumulatedDepreciationAccountId: row.accumulated_depreciation_account_id,
      depreciationExpenseAccountId: row.depreciation_expense_account_id,
      status: row.status,
    })),
    attachments,
  };
}

export async function getBudgetsWorkbench(membership: MembershipContext): Promise<BudgetsWorkbench> {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const [periodsResult, accountsResult, budgetsResult] = await Promise.all([
    entityFilter(
      db.from("fiscal_periods").select("id, period_name, status").eq("organization_id", membership.organizationId).order("starts_on", { ascending: false }),
      membership.entityId,
    ),
    entityFilter(
      db.from("chart_of_accounts").select("id, account_code, name, account_type").eq("organization_id", membership.organizationId).in("account_type", ["revenue", "expense"]).order("account_code", { ascending: true }),
      membership.entityId,
    ),
    entityFilter(
      db.from("budgets").select("id, name, fiscal_year, scenario, status").eq("organization_id", membership.organizationId).order("fiscal_year", { ascending: false }),
      membership.entityId,
    ),
  ]);
  if (periodsResult.error) throw new Error(periodsResult.error.message);
  if (accountsResult.error) throw new Error(accountsResult.error.message);
  if (budgetsResult.error) throw new Error(budgetsResult.error.message);
  return {
    organizationId: membership.organizationId,
    entityId: membership.entityId ?? "",
    periods: mapLookup(periodsResult.data ?? [], (row) => row.period_name, (row) => row.status),
    accounts: mapLookup(accountsResult.data ?? [], (row) => `${row.account_code} · ${row.name}`, (row) => row.account_type),
    records: (budgetsResult.data ?? []).map((row: any) => ({
      id: row.id,
      primary: row.name,
      secondary: String(row.fiscal_year),
      tertiary: row.scenario,
      status: row.status,
    })),
  };
}

export async function getBankingWorkbench(membership: MembershipContext): Promise<BankingWorkbench> {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const [entityResult, accountsResult, bankAccountsResult, transactionsResult, reconciliationsResult] = await Promise.all([
    db.from("entities").select("reporting_currency_code").eq("id", membership.entityId).single(),
    entityFilter(
      db.from("chart_of_accounts").select("id, account_code, name, account_type").eq("organization_id", membership.organizationId).eq("is_active", true).order("account_code", { ascending: true }),
      membership.entityId,
    ),
    entityFilter(
      db.from("bank_accounts").select("id, account_name, bank_name, masked_account_number").eq("organization_id", membership.organizationId).order("account_name", { ascending: true }),
      membership.entityId,
    ),
    entityFilter(
      db.from("bank_transactions").select("id, description, transaction_date, amount, status").eq("organization_id", membership.organizationId).order("transaction_date", { ascending: false }).limit(10),
      membership.entityId,
    ),
    entityFilter(
      db.from("reconciliations").select("id, statement_ending_on, statement_balance, status").eq("organization_id", membership.organizationId).order("statement_ending_on", { ascending: false }).limit(10),
      membership.entityId,
    ),
  ]);
  const errors = [entityResult.error, accountsResult.error, bankAccountsResult.error, transactionsResult.error, reconciliationsResult.error].filter(Boolean);
  if (errors.length) throw new Error(errors[0]?.message ?? "Unable to load banking workbench.");
  const accounts = accountsResult.data ?? [];
  return {
    organizationId: membership.organizationId,
    entityId: membership.entityId ?? "",
    currencyCode: entityResult.data?.reporting_currency_code ?? "USD",
    bankAccounts: mapLookup(bankAccountsResult.data ?? [], (row) => `${row.account_name} · ${row.bank_name}`, (row) => row.masked_account_number),
    cashAccounts: mapLookup(accounts.filter((row: any) => row.account_type === "asset"), (row) => `${row.account_code} · ${row.name}`),
    accountRecords: (bankAccountsResult.data ?? []).map((row: any) => ({
      id: row.id,
      primary: row.account_name,
      secondary: row.bank_name,
      tertiary: row.masked_account_number,
      status: "connected",
    })),
    transactionRecords: (transactionsResult.data ?? []).map((row: any) => ({
      id: row.id,
      primary: row.description,
      secondary: row.transaction_date,
      tertiary: formatAmount(row.amount),
      status: row.status,
    })),
    reconciliationRecords: (reconciliationsResult.data ?? []).map((row: any) => ({
      id: row.id,
      primary: row.statement_ending_on,
      secondary: formatAmount(row.statement_balance),
      tertiary: "Statement balance",
      status: row.status,
    })),
  };
}

export async function getSettingsWorkbench(membership: MembershipContext): Promise<SettingsWorkbench> {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const [taxRatesResult, periodsResult] = await Promise.all([
    entityFilter(
      db.from("tax_rates").select("id, name, tax_code, rate, jurisdiction").eq("organization_id", membership.organizationId).order("name", { ascending: true }),
      membership.entityId,
    ),
    entityFilter(
      db.from("fiscal_periods").select("id, period_name, starts_on, ends_on, status").eq("organization_id", membership.organizationId).order("starts_on", { ascending: false }),
      membership.entityId,
    ),
  ]);
  if (taxRatesResult.error) throw new Error(taxRatesResult.error.message);
  if (periodsResult.error) throw new Error(periodsResult.error.message);
  return {
    organizationId: membership.organizationId,
    entityId: membership.entityId ?? "",
    taxRateRecords: (taxRatesResult.data ?? []).map((row: any) => ({
      id: row.id,
      primary: row.name,
      secondary: row.tax_code,
      tertiary: `${Number(row.rate) * 100}% · ${row.jurisdiction ?? "N/A"}`,
      status: "active",
    })),
    fiscalPeriodRecords: (periodsResult.data ?? []).map((row: any) => ({
      id: row.id,
      primary: row.period_name,
      secondary: `${row.starts_on} → ${row.ends_on}`,
      tertiary: "Fiscal period",
      status: row.status,
    })),
  };
}

export async function createAsset(input: CreateAssetInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = createAssetSchema.parse(input);
  const { data, error } = await db.from("assets").insert({
    organization_id: payload.organizationId,
    entity_id: payload.entityId,
    asset_code: payload.assetCode,
    name: payload.name,
    category: payload.category,
    acquisition_date: payload.acquisitionDate,
    in_service_date: payload.inServiceDate,
    cost: payload.cost,
    salvage_value: payload.salvageValue,
    useful_life_months: payload.usefulLifeMonths,
    depreciation_method: payload.depreciationMethod,
    asset_account_id: payload.assetAccountId,
    accumulated_depreciation_account_id: payload.accumulatedDepreciationAccountId,
    depreciation_expense_account_id: payload.depreciationExpenseAccountId,
    status: "active",
  }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateAsset(input: UpdateAssetInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = updateAssetSchema.parse(input);
  const { data, error } = await db
    .from("assets")
    .update({
      asset_code: payload.assetCode,
      name: payload.name,
      category: payload.category,
      acquisition_date: payload.acquisitionDate,
      in_service_date: payload.inServiceDate,
      cost: payload.cost,
      salvage_value: payload.salvageValue,
      useful_life_months: payload.usefulLifeMonths,
      depreciation_method: payload.depreciationMethod,
      asset_account_id: payload.assetAccountId,
      accumulated_depreciation_account_id: payload.accumulatedDepreciationAccountId,
      depreciation_expense_account_id: payload.depreciationExpenseAccountId,
    })
    .eq("id", payload.assetId)
    .eq("organization_id", payload.organizationId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteAsset(input: DeleteAssetInput, membership: MembershipContext) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = deleteAssetSchema.parse(input);

  await deleteRelatedDocuments(membership, "assets", payload.assetId);

  const { error } = await db
    .from("assets")
    .delete()
    .eq("id", payload.assetId)
    .eq("organization_id", payload.organizationId);

  if (error) throw new Error(error.message);
}

export async function createBudget(input: CreateBudgetInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = createBudgetSchema.parse(input);
  let budgetId: string | null = null;
  try {
    const { data: budget, error } = await db.from("budgets").insert({
      organization_id: payload.organizationId,
      entity_id: payload.entityId,
      name: payload.name,
      fiscal_year: payload.fiscalYear,
      scenario: payload.scenario,
      status: "draft",
    }).select().single();
    if (error || !budget) throw new Error(error?.message ?? "Unable to create budget.");
    budgetId = budget.id;
    const { error: linesError } = await db.from("budget_lines").insert(
      payload.lines
        .filter((line) => line.amount > 0)
        .map((line) => ({
          organization_id: payload.organizationId,
          entity_id: payload.entityId,
          budget_id: budget.id,
          account_id: line.accountId,
          fiscal_period_id: line.fiscalPeriodId || null,
          amount: line.amount,
        })),
    );
    if (linesError) throw new Error(linesError.message);
    return budget;
  } catch (error) {
    if (budgetId) await db.from("budgets").delete().eq("id", budgetId);
    throw error;
  }
}

export async function createBankAccount(input: CreateBankAccountInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = createBankAccountSchema.parse(input);
  const { data, error } = await db.from("bank_accounts").insert({
    organization_id: payload.organizationId,
    entity_id: payload.entityId,
    account_name: payload.accountName,
    bank_name: payload.bankName,
    masked_account_number: payload.maskedAccountNumber,
    currency_code: payload.currencyCode,
    chart_account_id: payload.chartAccountId,
    integration_provider: payload.integrationProvider || null,
  }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createBankTransaction(input: CreateBankTransactionInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = createBankTransactionSchema.parse(input);
  const signedAmount = toSignedBankAmount(payload.amount, payload.direction);
  const { data, error } = await db.from("bank_transactions").insert({
    organization_id: payload.organizationId,
    entity_id: payload.entityId,
    bank_account_id: payload.bankAccountId,
    transaction_date: payload.transactionDate,
    posted_date: payload.postedDate || null,
    description: payload.description,
    amount: signedAmount,
    direction: payload.direction,
    status: payload.status,
  }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function importBankTransactions(
  membership: MembershipContext,
  input: ImportBankTransactionsInput,
) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = importBankTransactionsSchema.parse(input);

  let bankAccountQuery = db
    .from("bank_accounts")
    .select("id")
    .eq("organization_id", membership.organizationId)
    .eq("id", payload.bankAccountId);

  bankAccountQuery = entityFilter(bankAccountQuery, membership.entityId);

  const { data: bankAccount, error: bankAccountError } = await bankAccountQuery.maybeSingle();
  if (bankAccountError) throw new Error(bankAccountError.message);
  if (!bankAccount) throw new Error("Bank account is not available in the active entity scope.");

  const normalizedTransactions = payload.transactions.map((transaction) => ({
    ...transaction,
    externalId: transaction.externalId?.trim() || undefined,
  }));

  const payloadDuplicateCount =
    normalizedTransactions.length -
    new Set(normalizedTransactions.map((transaction) => transaction.externalId).filter(Boolean)).size -
    normalizedTransactions.filter((transaction) => !transaction.externalId).length;

  const uniqueExternalIds = Array.from(
    new Set(normalizedTransactions.map((transaction) => transaction.externalId).filter(Boolean)),
  ) as string[];

  const existingExternalIds = new Set<string>();
  if (uniqueExternalIds.length > 0) {
    let existingQuery = db
      .from("bank_transactions")
      .select("external_id")
      .eq("organization_id", membership.organizationId)
      .eq("bank_account_id", payload.bankAccountId)
      .in("external_id", uniqueExternalIds);

    existingQuery = entityFilter(existingQuery, membership.entityId);

    const { data: existingRows, error: existingError } = await existingQuery;
    if (existingError) throw new Error(existingError.message);
    for (const row of existingRows ?? []) {
      if (row.external_id) existingExternalIds.add(row.external_id);
    }
  }

  const seenPayloadExternalIds = new Set<string>();
  const rowsToInsert = normalizedTransactions.filter((transaction) => {
    if (!transaction.externalId) return true;
    if (existingExternalIds.has(transaction.externalId)) return false;
    if (seenPayloadExternalIds.has(transaction.externalId)) return false;
    seenPayloadExternalIds.add(transaction.externalId);
    return true;
  });

  if (rowsToInsert.length === 0) {
    return {
      insertedCount: 0,
      skippedCount: normalizedTransactions.length,
      duplicateExternalIdCount: normalizedTransactions.length,
    };
  }

  const { data, error } = await db
    .from("bank_transactions")
    .insert(
      rowsToInsert.map((transaction) => ({
        organization_id: membership.organizationId,
        entity_id: membership.entityId,
        bank_account_id: payload.bankAccountId,
        transaction_date: transaction.transactionDate,
        posted_date: transaction.postedDate || null,
        description: transaction.description,
        amount: toSignedBankAmount(transaction.amount, transaction.direction),
        direction: transaction.direction,
        status: transaction.status,
        external_id: transaction.externalId || null,
      })),
    )
    .select("id");

  if (error) throw new Error(error.message);

  const insertedCount = data?.length ?? 0;
  const skippedCount = normalizedTransactions.length - insertedCount;

  return {
    insertedCount,
    skippedCount,
    duplicateExternalIdCount: skippedCount > 0 ? existingExternalIds.size + payloadDuplicateCount : 0,
  };
}

export async function createReconciliation(input: CreateReconciliationInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = createReconciliationSchema.parse(input);
  const { data, error } = await db.from("reconciliations").insert({
    organization_id: payload.organizationId,
    entity_id: payload.entityId,
    bank_account_id: payload.bankAccountId,
    statement_ending_on: payload.statementEndingOn,
    statement_balance: payload.statementBalance,
    book_balance: payload.bookBalance,
    status: payload.status,
  }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createTaxRate(input: CreateTaxRateInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = createTaxRateSchema.parse(input);
  const { data, error } = await db.from("tax_rates").insert({
    organization_id: payload.organizationId,
    entity_id: payload.entityId,
    name: payload.name,
    tax_code: payload.taxCode,
    rate: payload.rate,
    recoverable_percent: payload.recoverablePercent,
    jurisdiction: payload.jurisdiction || null,
  }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createFiscalPeriod(input: CreateFiscalPeriodInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = createFiscalPeriodSchema.parse(input);
  const { data, error } = await db.from("fiscal_periods").insert({
    organization_id: payload.organizationId,
    entity_id: payload.entityId,
    period_name: payload.periodName,
    starts_on: payload.startsOn,
    ends_on: payload.endsOn,
    status: payload.status,
    is_adjustment_period: payload.isAdjustmentPeriod,
  }).select().single();
  if (error) throw new Error(error.message);
  return data;
}
