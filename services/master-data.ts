import { createServerSupabaseClient } from "@/supabase/server";
import type { MembershipContext } from "@/services/auth";
import type {
  ArchiveAccountInput,
  CreateAccountInput,
  CreateCustomerInput,
  CreateEntityInput,
  CreateProjectInput,
  CreateVendorInput,
  UpdateAccountInput,
  UpdateCustomerInput,
  UpdateEntityInput,
  UpdateProjectInput,
  UpdateVendorInput,
} from "@/validators/master-data";
import {
  archiveAccountSchema,
  createAccountSchema,
  createCustomerSchema,
  createEntitySchema,
  createProjectSchema,
  createVendorSchema,
  updateAccountSchema,
  updateCustomerSchema,
  updateEntitySchema,
  updateProjectSchema,
  updateVendorSchema,
} from "@/validators/master-data";

type Lookup = { id: string; label: string };
type RecordRow = {
  id: string;
  primary: string;
  secondary: string;
  tertiary: string;
  status: string;
};

export type EntityRecord = {
  id: string;
  name: string;
  legalName: string | null;
  code: string;
  jurisdiction: string | null;
  reportingCurrencyCode: string;
};

export type AccountRecord = {
  id: string;
  accountCode: string;
  name: string;
  description: string | null;
  accountType: "asset" | "liability" | "equity" | "revenue" | "expense";
  normalBalance: "debit" | "credit";
  currencyCode: string;
  isActive: boolean;
};

export type CustomerRecord = {
  id: string;
  customerCode: string;
  legalName: string;
  displayName: string;
  email: string | null;
  status: string;
};

export type VendorRecord = {
  id: string;
  vendorCode: string;
  legalName: string;
  displayName: string;
  email: string | null;
  paymentTermsDays: number;
  status: string;
};

export type ProjectRecord = {
  id: string;
  projectCode: string;
  name: string;
  customerId: string | null;
  startDate: string | null;
  budgetAmount: number | null;
  status: string;
};

export type EntitiesWorkbench = {
  organizationId: string;
  reportingCurrencyCode: string;
  records: RecordRow[];
  entities: EntityRecord[];
};

export type AccountsWorkbench = {
  organizationId: string;
  entityId: string;
  currencyCode: string;
  records: RecordRow[];
  accounts: AccountRecord[];
};

export type CustomersWorkbench = {
  organizationId: string;
  entityId: string;
  records: RecordRow[];
  customers: CustomerRecord[];
};

export type VendorsWorkbench = {
  organizationId: string;
  entityId: string;
  records: RecordRow[];
  vendors: VendorRecord[];
};

export type ProjectsWorkbench = {
  organizationId: string;
  entityId: string;
  customers: Lookup[];
  records: RecordRow[];
  projects: ProjectRecord[];
};

function entityFilter<T extends { eq: (column: string, value: string) => T }>(query: T, entityId: string | null) {
  return entityId ? query.eq("entity_id", entityId) : query;
}

export async function getEntitiesWorkbench(membership: MembershipContext): Promise<EntitiesWorkbench> {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const [orgResult, entitiesResult] = await Promise.all([
    db.from("organizations").select("base_currency_code").eq("id", membership.organizationId).single(),
    db
      .from("entities")
      .select("id, name, code, jurisdiction, reporting_currency_code")
      .eq("organization_id", membership.organizationId)
      .order("name", { ascending: true }),
  ]);

  if (orgResult.error) throw new Error(orgResult.error.message);
  if (entitiesResult.error) throw new Error(entitiesResult.error.message);

  return {
    organizationId: membership.organizationId,
    reportingCurrencyCode: orgResult.data?.base_currency_code ?? "USD",
    records: (entitiesResult.data ?? []).map((row: any) => ({
      id: row.id,
      primary: row.name,
      secondary: row.code,
      tertiary: `${row.jurisdiction ?? "N/A"} · ${row.reporting_currency_code}`,
      status: "active",
    })),
    entities: (entitiesResult.data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      legalName: row.legal_name ?? row.name,
      code: row.code,
      jurisdiction: row.jurisdiction,
      reportingCurrencyCode: row.reporting_currency_code,
    })),
  };
}

export async function getAccountsWorkbench(membership: MembershipContext): Promise<AccountsWorkbench> {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const [entityResult, accountsResult] = await Promise.all([
    db.from("entities").select("reporting_currency_code").eq("id", membership.entityId).single(),
    entityFilter(
      db
        .from("chart_of_accounts")
        .select("id, account_code, name, description, account_type, normal_balance, currency_code, is_active")
        .eq("organization_id", membership.organizationId)
        .order("account_code", { ascending: true }),
      membership.entityId,
    ),
  ]);

  if (entityResult.error) throw new Error(entityResult.error.message);
  if (accountsResult.error) throw new Error(accountsResult.error.message);

  return {
    organizationId: membership.organizationId,
    entityId: membership.entityId ?? "",
    currencyCode: entityResult.data?.reporting_currency_code ?? "USD",
    records: (accountsResult.data ?? []).map((row: any) => ({
      id: row.id,
      primary: `${row.account_code} · ${row.name}`,
      secondary: row.account_type,
      tertiary: row.normal_balance,
      status: row.is_active ? "active" : "inactive",
    })),
    accounts: (accountsResult.data ?? []).map((row: any) => ({
      id: row.id,
      accountCode: row.account_code,
      name: row.name,
      description: row.description,
      accountType: row.account_type,
      normalBalance: row.normal_balance,
      currencyCode: row.currency_code,
      isActive: row.is_active,
    })),
  };
}

export async function getCustomersWorkbench(membership: MembershipContext): Promise<CustomersWorkbench> {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const result = await entityFilter(
    db
      .from("customers")
      .select("id, display_name, customer_code, email, status")
      .eq("organization_id", membership.organizationId)
      .order("display_name", { ascending: true }),
    membership.entityId,
  );
  if (result.error) throw new Error(result.error.message);
  return {
    organizationId: membership.organizationId,
    entityId: membership.entityId ?? "",
    records: (result.data ?? []).map((row: any) => ({
      id: row.id,
      primary: row.display_name,
      secondary: row.customer_code,
      tertiary: row.email ?? "No email",
      status: row.status,
    })),
    customers: (result.data ?? []).map((row: any) => ({
      id: row.id,
      customerCode: row.customer_code,
      legalName: row.legal_name,
      displayName: row.display_name,
      email: row.email,
      status: row.status,
    })),
  };
}

export async function getVendorsWorkbench(membership: MembershipContext): Promise<VendorsWorkbench> {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const result = await entityFilter(
    db
      .from("vendors")
      .select("id, display_name, vendor_code, email, status")
      .eq("organization_id", membership.organizationId)
      .order("display_name", { ascending: true }),
    membership.entityId,
  );
  if (result.error) throw new Error(result.error.message);
  return {
    organizationId: membership.organizationId,
    entityId: membership.entityId ?? "",
    records: (result.data ?? []).map((row: any) => ({
      id: row.id,
      primary: row.display_name,
      secondary: row.vendor_code,
      tertiary: row.email ?? "No email",
      status: row.status,
    })),
    vendors: (result.data ?? []).map((row: any) => ({
      id: row.id,
      vendorCode: row.vendor_code,
      legalName: row.legal_name,
      displayName: row.display_name,
      email: row.email,
      paymentTermsDays: row.payment_terms_days,
      status: row.status,
    })),
  };
}

export async function getProjectsWorkbench(membership: MembershipContext): Promise<ProjectsWorkbench> {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const [projectsResult, customersResult] = await Promise.all([
    entityFilter(
      db
        .from("projects")
        .select("id, name, project_code, customer_id, status, start_date, budget_amount")
        .eq("organization_id", membership.organizationId)
        .order("name", { ascending: true }),
      membership.entityId,
    ),
    entityFilter(
      db
        .from("customers")
        .select("id, display_name")
        .eq("organization_id", membership.organizationId)
        .eq("status", "active")
        .order("display_name", { ascending: true }),
      membership.entityId,
    ),
  ]);
  if (projectsResult.error) throw new Error(projectsResult.error.message);
  if (customersResult.error) throw new Error(customersResult.error.message);

  return {
    organizationId: membership.organizationId,
    entityId: membership.entityId ?? "",
    customers: (customersResult.data ?? []).map((row: any) => ({ id: row.id, label: row.display_name })),
    records: (projectsResult.data ?? []).map((row: any) => ({
      id: row.id,
      primary: row.name,
      secondary: row.project_code,
      tertiary: row.budget_amount ? `$${Number(row.budget_amount).toLocaleString()}` : "No budget",
      status: row.status,
    })),
    projects: (projectsResult.data ?? []).map((row: any) => ({
      id: row.id,
      projectCode: row.project_code,
      name: row.name,
      customerId: row.customer_id,
      startDate: row.start_date,
      budgetAmount: row.budget_amount ? Number(row.budget_amount) : null,
      status: row.status,
    })),
  };
}

export async function createEntity(input: CreateEntityInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = createEntitySchema.parse(input);
  const { data, error } = await db
    .from("entities")
    .insert({
      organization_id: payload.organizationId,
      name: payload.name,
      legal_name: payload.legalName || payload.name,
      code: payload.code,
      jurisdiction: payload.jurisdiction,
      reporting_currency_code: payload.reportingCurrencyCode,
      is_consolidation: false,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createAccount(input: CreateAccountInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = createAccountSchema.parse(input);
  const { data, error } = await db
    .from("chart_of_accounts")
    .insert({
      organization_id: payload.organizationId,
      entity_id: payload.entityId,
      account_code: payload.accountCode,
      name: payload.name,
      description: payload.description,
      account_type: payload.accountType,
      normal_balance: payload.normalBalance,
      currency_code: payload.currencyCode,
      is_active: true,
      allow_manual_posting: true,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createCustomer(input: CreateCustomerInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = createCustomerSchema.parse(input);
  const { data, error } = await db
    .from("customers")
    .insert({
      organization_id: payload.organizationId,
      entity_id: payload.entityId,
      customer_code: payload.customerCode,
      legal_name: payload.legalName,
      display_name: payload.displayName,
      email: payload.email || null,
      status: "active",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createVendor(input: CreateVendorInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = createVendorSchema.parse(input);
  const { data, error } = await db
    .from("vendors")
    .insert({
      organization_id: payload.organizationId,
      entity_id: payload.entityId,
      vendor_code: payload.vendorCode,
      legal_name: payload.legalName,
      display_name: payload.displayName,
      email: payload.email || null,
      payment_terms_days: payload.paymentTermsDays,
      status: "active",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createProject(input: CreateProjectInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = createProjectSchema.parse(input);
  const { data, error } = await db
    .from("projects")
    .insert({
      organization_id: payload.organizationId,
      entity_id: payload.entityId,
      project_code: payload.projectCode,
      name: payload.name,
      customer_id: payload.customerId || null,
      status: "active",
      start_date: payload.startDate || null,
      budget_amount: payload.budgetAmount ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateEntity(input: UpdateEntityInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = updateEntitySchema.parse(input);
  const { data, error } = await db
    .from("entities")
    .update({
      name: payload.name,
      legal_name: payload.legalName || payload.name,
      code: payload.code,
      jurisdiction: payload.jurisdiction || null,
      reporting_currency_code: payload.reportingCurrencyCode,
    })
    .eq("id", payload.entityId)
    .eq("organization_id", payload.organizationId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateAccount(input: UpdateAccountInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = updateAccountSchema.parse(input);
  const { data, error } = await db
    .from("chart_of_accounts")
    .update({
      account_code: payload.accountCode,
      name: payload.name,
      description: payload.description || null,
      account_type: payload.accountType,
      normal_balance: payload.normalBalance,
      currency_code: payload.currencyCode,
      is_active: payload.isActive,
    })
    .eq("id", payload.accountId)
    .eq("organization_id", payload.organizationId)
    .eq("entity_id", payload.entityId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function archiveAccount(input: ArchiveAccountInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = archiveAccountSchema.parse(input);
  const { data, error } = await db
    .from("chart_of_accounts")
    .update({ is_active: payload.isActive })
    .eq("id", payload.accountId)
    .eq("organization_id", payload.organizationId)
    .eq("entity_id", payload.entityId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateCustomer(input: UpdateCustomerInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = updateCustomerSchema.parse(input);
  const { data, error } = await db
    .from("customers")
    .update({
      customer_code: payload.customerCode,
      legal_name: payload.legalName,
      display_name: payload.displayName,
      email: payload.email || null,
      status: payload.status,
    })
    .eq("id", payload.customerId)
    .eq("organization_id", payload.organizationId)
    .eq("entity_id", payload.entityId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateVendor(input: UpdateVendorInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = updateVendorSchema.parse(input);
  const { data, error } = await db
    .from("vendors")
    .update({
      vendor_code: payload.vendorCode,
      legal_name: payload.legalName,
      display_name: payload.displayName,
      email: payload.email || null,
      payment_terms_days: payload.paymentTermsDays,
      status: payload.status,
    })
    .eq("id", payload.vendorId)
    .eq("organization_id", payload.organizationId)
    .eq("entity_id", payload.entityId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateProject(input: UpdateProjectInput) {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const payload = updateProjectSchema.parse(input);
  const { data, error } = await db
    .from("projects")
    .update({
      project_code: payload.projectCode,
      name: payload.name,
      customer_id: payload.customerId || null,
      start_date: payload.startDate || null,
      budget_amount: payload.budgetAmount ?? null,
      status: payload.status,
    })
    .eq("id", payload.projectId)
    .eq("organization_id", payload.organizationId)
    .eq("entity_id", payload.entityId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
