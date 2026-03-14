import { createServerSupabaseClient } from "@/supabase/server";
import type { MembershipContext } from "@/services/auth";
import { deleteRelatedDocuments, listDocumentsForTable, type AttachmentRecord } from "@/services/documents";
import type { JournalDraft } from "@/types/accounting";
import type {
  CreateAssetInput,
  CreateBankAccountInput,
  CreateBankCategorizationRuleInput,
  CreateBankTransactionInput,
  CreateBudgetInput,
  CreateCustomFieldInput,
  CreateDepartmentInput,
  DeleteAssetInput,
  CreateFiscalPeriodInput,
  CreateInventoryItemInput,
  CreateInventoryMovementInput,
  ImportBankTransactionsInput,
  CreateNotificationRuleInput,
  CreateReconciliationInput,
  CreateTaxRateInput,
  CreateVatReturnInput,
  CreateWorkflowDefinitionInput,
  UpdateAssetInput,
} from "@/validators/operations";
import {
  createAssetSchema,
  createBankAccountSchema,
  createBankCategorizationRuleSchema,
  createBankTransactionSchema,
  createBudgetSchema,
  createCustomFieldSchema,
  createDepartmentSchema,
  deleteAssetSchema,
  createFiscalPeriodSchema,
  createInventoryItemSchema,
  createInventoryMovementSchema,
  importBankTransactionsSchema,
  createNotificationRuleSchema,
  createReconciliationSchema,
  createTaxRateSchema,
  createVatReturnSchema,
  createWorkflowDefinitionSchema,
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
  inventoryRecords: RecordRow[];
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
  categorizationAccounts: Lookup[];
  transactionRecords: RecordRow[];
  accountRecords: RecordRow[];
  reconciliationRecords: RecordRow[];
  categorizationRuleRecords: RecordRow[];
};

export type SettingsWorkbench = {
  organizationId: string;
  entityId: string;
  currencyCode: string;
  taxRateRecords: RecordRow[];
  fiscalPeriodRecords: RecordRow[];
  departmentRecords: RecordRow[];
  customFieldRecords: RecordRow[];
  workflowRecords: RecordRow[];
  notificationRuleRecords: RecordRow[];
  vatReturnRecords: RecordRow[];
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

function matchesRule(value: string, operator: string, expected: string) {
  const haystack = value.toLowerCase();
  const needle = expected.toLowerCase();

  if (operator === "equals") {
    return haystack === needle;
  }

  if (operator === "starts_with") {
    return haystack.startsWith(needle);
  }

  return haystack.includes(needle);
}

async function getCategorizationRules(db: any, organizationId: string, entityId: string | null, bankAccountId: string) {
  let query = db
    .from("bank_categorization_rules")
    .select("id, bank_account_id, match_field, match_operator, match_value, direction, suggested_account_id, status, priority")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("priority", { ascending: true });

  query = entityFilter(query, entityId);

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).filter(
    (rule: any) => !rule.bank_account_id || rule.bank_account_id === bankAccountId,
  );
}

function categorizeBankTransaction(
  transaction: { description: string; direction: "credit" | "debit"; counterpartyName?: string },
  rules: any[],
) {
  for (const rule of rules) {
    if (rule.direction && rule.direction !== transaction.direction) {
      continue;
    }

    const fieldValue =
      rule.match_field === "counterparty_name"
        ? transaction.counterpartyName ?? ""
        : transaction.description;

    if (matchesRule(fieldValue, rule.match_operator, rule.match_value)) {
      return {
        appliedRuleId: rule.id as string,
        suggestedAccountId: rule.suggested_account_id as string | null,
      };
    }
  }

  return {
    appliedRuleId: null,
    suggestedAccountId: null,
  };
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
  const [accountsResult, assetsResult, inventoryResult, attachments] = await Promise.all([
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
    entityFilter(
      db
        .from("inventory_items")
        .select("id, sku, name, item_type, is_active, inventory_movements(quantity, movement_type)")
        .eq("organization_id", membership.organizationId)
        .order("name", { ascending: true }),
      membership.entityId,
    ),
    listDocumentsForTable(membership, "assets"),
  ]);
  if (accountsResult.error) throw new Error(accountsResult.error.message);
  if (assetsResult.error) throw new Error(assetsResult.error.message);
  if (inventoryResult.error) throw new Error(inventoryResult.error.message);
  const accounts = accountsResult.data ?? [];
  const assetRows = assetsResult.data ?? [];
  const inventoryRows = inventoryResult.data ?? [];
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
    inventoryRecords: inventoryRows.map((row: any) => {
      const onHand = (row.inventory_movements ?? []).reduce((sum: number, movement: any) => {
        const quantity = Number(movement.quantity ?? 0);
        return movement.movement_type === "issue" ? sum - quantity : sum + quantity;
      }, 0);

      return {
        id: row.id,
        primary: row.name,
        secondary: row.sku,
        tertiary: `${row.item_type} · On hand ${onHand.toFixed(2)}`,
        status: row.is_active === false ? "inactive" : "active",
      };
    }),
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
  const [entityResult, accountsResult, bankAccountsResult, transactionsResult, reconciliationsResult, categorizationRulesResult] = await Promise.all([
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
      db.from("bank_transactions").select("id, description, transaction_date, amount, status, applied_rule:bank_categorization_rules(rule_name), suggested_account:chart_of_accounts(account_code, name)").eq("organization_id", membership.organizationId).order("transaction_date", { ascending: false }).limit(10),
      membership.entityId,
    ),
    entityFilter(
      db.from("reconciliations").select("id, statement_ending_on, statement_balance, status").eq("organization_id", membership.organizationId).order("statement_ending_on", { ascending: false }).limit(10),
      membership.entityId,
    ),
    entityFilter(
      db.from("bank_categorization_rules").select("id, rule_name, match_field, match_value, status").eq("organization_id", membership.organizationId).order("priority", { ascending: true }).limit(10),
      membership.entityId,
    ),
  ]);
  const errors = [entityResult.error, accountsResult.error, bankAccountsResult.error, transactionsResult.error, reconciliationsResult.error, categorizationRulesResult.error].filter(Boolean);
  if (errors.length) throw new Error(errors[0]?.message ?? "Unable to load banking workbench.");
  const accounts = accountsResult.data ?? [];
  return {
    organizationId: membership.organizationId,
    entityId: membership.entityId ?? "",
    currencyCode: entityResult.data?.reporting_currency_code ?? "USD",
    bankAccounts: mapLookup(bankAccountsResult.data ?? [], (row) => `${row.account_name} · ${row.bank_name}`, (row) => row.masked_account_number),
    cashAccounts: mapLookup(accounts.filter((row: any) => row.account_type === "asset"), (row) => `${row.account_code} · ${row.name}`),
    categorizationAccounts: mapLookup(accounts.filter((row: any) => ["asset", "expense", "revenue", "liability"].includes(row.account_type)), (row) => `${row.account_code} · ${row.name}`),
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
      tertiary: [
        formatAmount(row.amount),
        row.applied_rule?.rule_name ? `Rule ${row.applied_rule.rule_name}` : null,
        row.suggested_account ? `Suggest ${row.suggested_account.account_code} · ${row.suggested_account.name}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      status: row.status,
    })),
    reconciliationRecords: (reconciliationsResult.data ?? []).map((row: any) => ({
      id: row.id,
      primary: row.statement_ending_on,
      secondary: formatAmount(row.statement_balance),
      tertiary: "Statement balance",
      status: row.status,
    })),
    categorizationRuleRecords: (categorizationRulesResult.data ?? []).map((row: any) => ({
      id: row.id,
      primary: row.rule_name,
      secondary: row.match_field,
      tertiary: row.match_value,
      status: row.status,
    })),
  };
}

export async function getSettingsWorkbench(membership: MembershipContext): Promise<SettingsWorkbench> {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const [entityResult, taxRatesResult, periodsResult, departmentsResult, customFieldsResult, workflowsResult, notificationRulesResult, vatReturnsResult] = await Promise.all([
    db.from("entities").select("reporting_currency_code").eq("id", membership.entityId).single(),
    entityFilter(
      db.from("tax_rates").select("id, name, tax_code, rate, jurisdiction").eq("organization_id", membership.organizationId).order("name", { ascending: true }),
      membership.entityId,
    ),
    entityFilter(
      db.from("fiscal_periods").select("id, period_name, starts_on, ends_on, status").eq("organization_id", membership.organizationId).order("starts_on", { ascending: false }),
      membership.entityId,
    ),
    entityFilter(
      db.from("departments").select("id, name, code, manager_name, status").eq("organization_id", membership.organizationId).order("name", { ascending: true }),
      membership.entityId,
    ),
    entityFilter(
      db.from("custom_fields").select("id, module_name, field_label, field_type, status").eq("organization_id", membership.organizationId).order("module_name", { ascending: true }),
      membership.entityId,
    ),
    entityFilter(
      db.from("workflow_definitions").select("id, workflow_name, module_name, trigger_event, status").eq("organization_id", membership.organizationId).order("workflow_name", { ascending: true }),
      membership.entityId,
    ),
    entityFilter(
      db.from("notification_rules").select("id, rule_name, event_key, channel, is_enabled").eq("organization_id", membership.organizationId).order("rule_name", { ascending: true }),
      membership.entityId,
    ),
    entityFilter(
      db.from("vat_returns").select("id, period_start, period_end, filing_due_on, net_tax_amount, status").eq("organization_id", membership.organizationId).order("period_end", { ascending: false }),
      membership.entityId,
    ),
  ]);
  if (entityResult.error) throw new Error(entityResult.error.message);
  if (taxRatesResult.error) throw new Error(taxRatesResult.error.message);
  if (periodsResult.error) throw new Error(periodsResult.error.message);
  if (departmentsResult.error) throw new Error(departmentsResult.error.message);
  if (customFieldsResult.error) throw new Error(customFieldsResult.error.message);
  if (workflowsResult.error) throw new Error(workflowsResult.error.message);
  if (notificationRulesResult.error) throw new Error(notificationRulesResult.error.message);
  if (vatReturnsResult.error) throw new Error(vatReturnsResult.error.message);
  return {
    organizationId: membership.organizationId,
    entityId: membership.entityId ?? "",
    currencyCode: entityResult.data?.reporting_currency_code ?? "USD",
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
    departmentRecords: (departmentsResult.data ?? []).map((row: any) => ({
      id: row.id,
      primary: row.name,
      secondary: row.code,
      tertiary: row.manager_name || "No manager",
      status: row.status,
    })),
    customFieldRecords: (customFieldsResult.data ?? []).map((row: any) => ({
      id: row.id,
      primary: row.field_label,
      secondary: row.module_name,
      tertiary: row.field_type,
      status: row.status,
    })),
    workflowRecords: (workflowsResult.data ?? []).map((row: any) => ({
      id: row.id,
      primary: row.workflow_name,
      secondary: row.module_name,
      tertiary: row.trigger_event,
      status: row.status,
    })),
    notificationRuleRecords: (notificationRulesResult.data ?? []).map((row: any) => ({
      id: row.id,
      primary: row.rule_name,
      secondary: row.channel,
      tertiary: row.event_key,
      status: row.is_enabled ? "active" : "inactive",
    })),
    vatReturnRecords: (vatReturnsResult.data ?? []).map((row: any) => ({
      id: row.id,
      primary: `${row.period_start} → ${row.period_end}`,
      secondary: formatAmount(row.net_tax_amount),
      tertiary: `Due ${row.filing_due_on}`,
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

export async function createBankCategorizationRule(input: CreateBankCategorizationRuleInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = createBankCategorizationRuleSchema.parse(input);
  const { data, error } = await db
    .from("bank_categorization_rules")
    .insert({
      organization_id: payload.organizationId,
      entity_id: payload.entityId,
      bank_account_id: payload.bankAccountId || null,
      rule_name: payload.ruleName,
      match_field: payload.matchField,
      match_operator: payload.matchOperator,
      match_value: payload.matchValue,
      direction: payload.direction || null,
      suggested_account_id: payload.suggestedAccountId || null,
      priority: payload.priority,
      status: payload.status,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createBankTransaction(input: CreateBankTransactionInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = createBankTransactionSchema.parse(input);
  const signedAmount = toSignedBankAmount(payload.amount, payload.direction);
  const rules = await getCategorizationRules(db, payload.organizationId, payload.entityId, payload.bankAccountId);
  const categorization = categorizeBankTransaction(
    {
      description: payload.description,
      direction: payload.direction,
    },
    rules,
  );
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
    suggested_account_id: categorization.suggestedAccountId,
    applied_rule_id: categorization.appliedRuleId,
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
  const rules = await getCategorizationRules(db, membership.organizationId, membership.entityId, payload.bankAccountId);

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
      rowsToInsert.map((transaction) => {
        const categorization = categorizeBankTransaction(
          {
            description: transaction.description,
            direction: transaction.direction,
          },
          rules,
        );

        return {
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
          suggested_account_id: categorization.suggestedAccountId,
          applied_rule_id: categorization.appliedRuleId,
        };
      }),
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

export async function createDepartment(input: CreateDepartmentInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = createDepartmentSchema.parse(input);
  const { data, error } = await db.from("departments").insert({
    organization_id: payload.organizationId,
    entity_id: payload.entityId,
    name: payload.name,
    code: payload.code,
    manager_name: payload.managerName || null,
    status: payload.status,
  }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createCustomField(input: CreateCustomFieldInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = createCustomFieldSchema.parse(input);
  const options = (payload.optionsCsv ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const { data, error } = await db.from("custom_fields").insert({
    organization_id: payload.organizationId,
    entity_id: payload.entityId,
    module_name: payload.moduleName,
    field_key: payload.fieldKey,
    field_label: payload.fieldLabel,
    field_type: payload.fieldType,
    options,
    is_required: payload.isRequired,
    status: payload.status,
  }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createWorkflowDefinition(input: CreateWorkflowDefinitionInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = createWorkflowDefinitionSchema.parse(input);
  const { data, error } = await db.from("workflow_definitions").insert({
    organization_id: payload.organizationId,
    entity_id: payload.entityId,
    workflow_name: payload.workflowName,
    module_name: payload.moduleName,
    trigger_event: payload.triggerEvent,
    approval_role: payload.approvalRole,
    auto_approve_below: payload.autoApproveBelow ?? null,
    status: payload.status,
  }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createNotificationRule(input: CreateNotificationRuleInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = createNotificationRuleSchema.parse(input);
  const { data, error } = await db.from("notification_rules").insert({
    organization_id: payload.organizationId,
    entity_id: payload.entityId,
    rule_name: payload.ruleName,
    event_key: payload.eventKey,
    channel: payload.channel,
    recipient_role: payload.recipientRole,
    is_enabled: payload.isEnabled,
    status: payload.status,
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

export async function createVatReturn(input: CreateVatReturnInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = createVatReturnSchema.parse(input);

  const [invoicesResult, billsResult] = await Promise.all([
    entityFilter(
      db
        .from("invoices")
        .select("subtotal_amount, tax_amount")
        .eq("organization_id", payload.organizationId)
        .gte("invoice_date", payload.periodStart)
        .lte("invoice_date", payload.periodEnd)
        .eq("status", "approved"),
      payload.entityId,
    ),
    entityFilter(
      db
        .from("bills")
        .select("subtotal_amount, tax_amount")
        .eq("organization_id", payload.organizationId)
        .gte("bill_date", payload.periodStart)
        .lte("bill_date", payload.periodEnd)
        .in("status", ["approved", "paid"]),
      payload.entityId,
    ),
  ]);

  if (invoicesResult.error) throw new Error(invoicesResult.error.message);
  if (billsResult.error) throw new Error(billsResult.error.message);

  const taxableSalesAmount = Number(
    (invoicesResult.data ?? []).reduce((sum: number, row: any) => sum + Number(row.subtotal_amount ?? 0), 0),
  );
  const outputTaxAmount = Number(
    (invoicesResult.data ?? []).reduce((sum: number, row: any) => sum + Number(row.tax_amount ?? 0), 0),
  );
  const taxablePurchasesAmount = Number(
    (billsResult.data ?? []).reduce((sum: number, row: any) => sum + Number(row.subtotal_amount ?? 0), 0),
  );
  const inputTaxAmount = Number(
    (billsResult.data ?? []).reduce((sum: number, row: any) => sum + Number(row.tax_amount ?? 0), 0),
  );
  const netTaxAmount = outputTaxAmount - inputTaxAmount;

  const { data, error } = await db
    .from("vat_returns")
    .insert({
      organization_id: payload.organizationId,
      entity_id: payload.entityId,
      period_start: payload.periodStart,
      period_end: payload.periodEnd,
      filing_due_on: payload.filingDueOn,
      currency_code: payload.currencyCode,
      output_tax_amount: outputTaxAmount,
      input_tax_amount: inputTaxAmount,
      net_tax_amount: netTaxAmount,
      taxable_sales_amount: taxableSalesAmount,
      taxable_purchases_amount: taxablePurchasesAmount,
      status: "prepared",
      notes: payload.notes || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createInventoryItem(input: CreateInventoryItemInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = createInventoryItemSchema.parse(input);
  const { data, error } = await db
    .from("inventory_items")
    .insert({
      organization_id: payload.organizationId,
      entity_id: payload.entityId,
      sku: payload.sku,
      name: payload.name,
      item_type: payload.itemType,
      asset_account_id: payload.assetAccountId || null,
      cogs_account_id: payload.cogsAccountId || null,
      revenue_account_id: payload.revenueAccountId || null,
      unit_of_measure: payload.unitOfMeasure,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createInventoryMovement(input: CreateInventoryMovementInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = createInventoryMovementSchema.parse(input);
  const signedQuantity = payload.movementType === "issue" ? -payload.quantity : payload.quantity;

  const { data, error } = await db
    .from("inventory_movements")
    .insert({
      organization_id: payload.organizationId,
      entity_id: payload.entityId,
      inventory_item_id: payload.inventoryItemId,
      movement_date: payload.movementDate,
      movement_type: payload.movementType,
      quantity: Math.abs(signedQuantity),
      unit_cost: payload.unitCost ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
