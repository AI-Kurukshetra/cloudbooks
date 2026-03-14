import { createServerSupabaseClient } from "@/supabase/server";
import type { MembershipContext } from "@/services/auth";
import { listDocumentsForTable } from "@/services/documents";
import type {
  AccountOption,
  BillWorkbenchData,
  InvoiceWorkbenchData,
  LookupOption,
  PeriodOption,
  RecentDocument,
} from "@/types/workbench";

function entityFilter<T extends { eq: (column: string, value: string) => T }>(
  query: T,
  entityId: string | null,
) {
  return entityId ? query.eq("entity_id", entityId) : query;
}

function mapLookupOptions(rows: any[], labelField: string, descriptionField?: string): LookupOption[] {
  return rows.map((row) => ({
    id: row.id,
    label: row[labelField],
    description: descriptionField ? row[descriptionField] : null,
  }));
}

function mapAccountOptions(rows: any[]): AccountOption[] {
  return rows.map((row) => ({
    id: row.id,
    label: `${row.account_code} · ${row.name}`,
    description: row.account_type,
    code: row.account_code,
    accountType: row.account_type,
  }));
}

function mapPeriodOptions(rows: any[]): PeriodOption[] {
  return rows.map((row) => ({
    id: row.id,
    label: row.period_name,
    description: row.status,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
  }));
}

function mapRecentDocuments(rows: any[], numberField: string, partyPath: (row: any) => string): RecentDocument[] {
  return rows.map((row) => ({
    id: row.id,
    number: row[numberField],
    party: partyPath(row),
    amount: Number(row.total_amount ?? 0),
    status: row.status,
    date: row[`${numberField.startsWith("invoice") ? "invoice_date" : "bill_date"}`],
  }));
}

export async function getInvoiceWorkbenchData(
  membership: MembershipContext,
): Promise<InvoiceWorkbenchData> {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;

  const entityResult = membership.entityId
    ? await db
        .from("entities")
        .select("id, reporting_currency_code")
        .eq("id", membership.entityId)
        .single()
    : { data: null, error: null };

  const [customersResult, accountsResult, periodsResult, projectsResult, recentInvoicesResult, attachments] =
    await Promise.all([
      entityFilter(
        db
          .from("customers")
          .select("id, display_name, customer_code")
          .eq("organization_id", membership.organizationId)
          .eq("status", "active")
          .order("display_name", { ascending: true }),
        membership.entityId,
      ),
      entityFilter(
        db
          .from("chart_of_accounts")
          .select("id, account_code, name, account_type")
          .eq("organization_id", membership.organizationId)
          .eq("is_active", true)
          .in("account_type", ["asset", "revenue"])
          .order("account_code", { ascending: true }),
        membership.entityId,
      ),
      entityFilter(
        db
          .from("fiscal_periods")
          .select("id, period_name, starts_on, ends_on, status")
          .eq("organization_id", membership.organizationId)
          .eq("status", "open")
          .order("starts_on", { ascending: false }),
        membership.entityId,
      ),
      entityFilter(
        db
          .from("projects")
          .select("id, name, project_code")
          .eq("organization_id", membership.organizationId)
          .eq("status", "active")
          .order("name", { ascending: true }),
        membership.entityId,
      ),
      entityFilter(
        db
          .from("invoices")
          .select("id, invoice_number, invoice_date, total_amount, status, customer:customers(display_name)")
          .eq("organization_id", membership.organizationId)
          .order("invoice_date", { ascending: false })
          .limit(6),
        membership.entityId,
      ),
      listDocumentsForTable(membership, "invoices"),
    ]);

  const errors = [
    entityResult.error,
    customersResult.error,
    accountsResult.error,
    periodsResult.error,
    projectsResult.error,
    recentInvoicesResult.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(errors[0]?.message ?? "Unable to load invoice workbench.");
  }

  const accountRows = accountsResult.data ?? [];

  return {
    organizationId: membership.organizationId,
    entityId: membership.entityId ?? "",
    currencyCode: entityResult.data?.reporting_currency_code ?? "USD",
    customers: mapLookupOptions(customersResult.data ?? [], "display_name", "customer_code"),
    arAccounts: mapAccountOptions(accountRows.filter((row: any) => row.account_type === "asset")),
    revenueAccounts: mapAccountOptions(accountRows.filter((row: any) => row.account_type === "revenue")),
    periods: mapPeriodOptions(periodsResult.data ?? []),
    projects: mapLookupOptions(projectsResult.data ?? [], "name", "project_code"),
    recentInvoices: mapRecentDocuments(
      recentInvoicesResult.data ?? [],
      "invoice_number",
      (row) => row.customer?.display_name ?? "Customer",
    ),
    attachments,
  };
}

export async function getBillWorkbenchData(
  membership: MembershipContext,
): Promise<BillWorkbenchData> {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;

  const entityResult = membership.entityId
    ? await db
        .from("entities")
        .select("id, reporting_currency_code")
        .eq("id", membership.entityId)
        .single()
    : { data: null, error: null };

  const [vendorsResult, accountsResult, periodsResult, projectsResult, recentBillsResult, attachments] =
    await Promise.all([
      entityFilter(
        db
          .from("vendors")
          .select("id, display_name, vendor_code")
          .eq("organization_id", membership.organizationId)
          .eq("status", "active")
          .order("display_name", { ascending: true }),
        membership.entityId,
      ),
      entityFilter(
        db
          .from("chart_of_accounts")
          .select("id, account_code, name, account_type")
          .eq("organization_id", membership.organizationId)
          .eq("is_active", true)
          .in("account_type", ["liability", "expense"])
          .order("account_code", { ascending: true }),
        membership.entityId,
      ),
      entityFilter(
        db
          .from("fiscal_periods")
          .select("id, period_name, starts_on, ends_on, status")
          .eq("organization_id", membership.organizationId)
          .eq("status", "open")
          .order("starts_on", { ascending: false }),
        membership.entityId,
      ),
      entityFilter(
        db
          .from("projects")
          .select("id, name, project_code")
          .eq("organization_id", membership.organizationId)
          .eq("status", "active")
          .order("name", { ascending: true }),
        membership.entityId,
      ),
      entityFilter(
        db
          .from("bills")
          .select("id, bill_number, bill_date, total_amount, status, vendor:vendors(display_name)")
          .eq("organization_id", membership.organizationId)
          .order("bill_date", { ascending: false })
          .limit(6),
        membership.entityId,
      ),
      listDocumentsForTable(membership, "bills"),
    ]);

  const errors = [
    entityResult.error,
    vendorsResult.error,
    accountsResult.error,
    periodsResult.error,
    projectsResult.error,
    recentBillsResult.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(errors[0]?.message ?? "Unable to load bill workbench.");
  }

  const accountRows = accountsResult.data ?? [];

  return {
    organizationId: membership.organizationId,
    entityId: membership.entityId ?? "",
    currencyCode: entityResult.data?.reporting_currency_code ?? "USD",
    vendors: mapLookupOptions(vendorsResult.data ?? [], "display_name", "vendor_code"),
    apAccounts: mapAccountOptions(accountRows.filter((row: any) => row.account_type === "liability")),
    expenseAccounts: mapAccountOptions(accountRows.filter((row: any) => row.account_type === "expense")),
    periods: mapPeriodOptions(periodsResult.data ?? []),
    projects: mapLookupOptions(projectsResult.data ?? [], "name", "project_code"),
    recentBills: mapRecentDocuments(
      recentBillsResult.data ?? [],
      "bill_number",
      (row) => row.vendor?.display_name ?? "Vendor",
    ),
    attachments,
  };
}
