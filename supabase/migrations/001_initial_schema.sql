create extension if not exists pgcrypto;

create type public.membership_status as enum ('invited', 'active', 'suspended');
create type public.account_type as enum ('asset', 'liability', 'equity', 'revenue', 'expense');
create type public.normal_balance as enum ('debit', 'credit');
create type public.journal_status as enum ('draft', 'posted', 'reversed');
create type public.invoice_status as enum ('draft', 'approved', 'sent', 'partially_paid', 'paid', 'void');
create type public.bill_status as enum ('draft', 'approved', 'scheduled', 'partially_paid', 'paid', 'void');
create type public.document_type as enum ('invoice', 'bill', 'bank_statement', 'contract', 'receipt', 'other');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  entity_id uuid,
  name text not null,
  legal_name text,
  base_currency_code text not null default 'USD',
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.entities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid,
  name text not null,
  legal_name text,
  code text not null,
  jurisdiction text,
  reporting_currency_code text not null default 'USD',
  is_consolidation boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, code)
);

alter table public.entities
  add constraint entities_entity_id_self_fk
  foreign key (entity_id) references public.entities(id) on delete set null;

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid,
  entity_id uuid,
  full_name text not null,
  email text not null unique,
  job_title text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  entity_id uuid,
  name text not null,
  description text,
  permissions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, name)
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid references public.entities(id) on delete set null,
  user_id uuid not null references public.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  status public.membership_status not null default 'active',
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, user_id, role_id)
);

create table public.fiscal_periods (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid references public.entities(id) on delete cascade,
  period_name text not null,
  starts_on date not null,
  ends_on date not null,
  status text not null default 'open',
  is_adjustment_period boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (starts_on <= ends_on)
);

create table public.currencies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  entity_id uuid,
  code text not null unique,
  name text not null,
  symbol text not null,
  decimal_places integer not null default 2,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid references public.entities(id) on delete cascade,
  from_currency_code text not null references public.currencies(code),
  to_currency_code text not null references public.currencies(code),
  rate numeric(18, 8) not null check (rate > 0),
  effective_on date not null,
  source text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, entity_id, from_currency_code, to_currency_code, effective_on)
);

create table public.chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid references public.entities(id) on delete cascade,
  account_code text not null,
  name text not null,
  description text,
  account_type public.account_type not null,
  normal_balance public.normal_balance not null,
  parent_account_id uuid references public.chart_of_accounts(id) on delete set null,
  currency_code text not null default 'USD' references public.currencies(code),
  is_active boolean not null default true,
  allow_manual_posting boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, entity_id, account_code)
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  fiscal_period_id uuid references public.fiscal_periods(id) on delete restrict,
  entry_number text not null,
  entry_date date not null,
  description text not null,
  status public.journal_status not null default 'draft',
  source_type text not null,
  source_id uuid,
  currency_code text not null references public.currencies(code),
  exchange_rate numeric(18, 8) not null default 1,
  external_reference text,
  posted_at timestamptz,
  posted_by uuid references public.users(id) on delete set null,
  reversed_entry_id uuid references public.journal_entries(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, entity_id, entry_number)
);

create table public.journal_lines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  journal_entry_id uuid not null references public.journal_entries(id) on delete cascade,
  account_id uuid not null references public.chart_of_accounts(id) on delete restrict,
  description text,
  line_number integer not null,
  debit_amount numeric(18, 2) not null default 0 check (debit_amount >= 0),
  credit_amount numeric(18, 2) not null default 0 check (credit_amount >= 0),
  currency_amount numeric(18, 2) not null default 0,
  department text,
  project_id uuid,
  customer_id uuid,
  vendor_id uuid,
  tax_rate_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    (case when debit_amount > 0 then 1 else 0 end) +
    (case when credit_amount > 0 then 1 else 0 end) = 1
  ),
  unique (journal_entry_id, line_number)
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid references public.entities(id) on delete cascade,
  vendor_code text not null,
  legal_name text not null,
  display_name text not null,
  tax_identifier text,
  email text,
  payment_terms_days integer not null default 30,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, entity_id, vendor_code)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid references public.entities(id) on delete cascade,
  customer_code text not null,
  legal_name text not null,
  display_name text not null,
  tax_identifier text,
  email text,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, entity_id, customer_code)
);

create table public.tax_rates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid references public.entities(id) on delete cascade,
  name text not null,
  tax_code text not null,
  rate numeric(9, 6) not null check (rate >= 0),
  recoverable_percent numeric(5, 2) not null default 100 check (recoverable_percent between 0 and 100),
  jurisdiction text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, entity_id, tax_code)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  fiscal_period_id uuid references public.fiscal_periods(id) on delete restrict,
  invoice_number text not null,
  invoice_date date not null,
  due_date date not null,
  status public.invoice_status not null default 'draft',
  currency_code text not null references public.currencies(code),
  subtotal_amount numeric(18, 2) not null default 0,
  tax_amount numeric(18, 2) not null default 0,
  total_amount numeric(18, 2) not null default 0,
  outstanding_amount numeric(18, 2) not null default 0,
  revenue_start_date date,
  revenue_end_date date,
  recognized_amount numeric(18, 2) not null default 0,
  journal_entry_id uuid references public.journal_entries(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, entity_id, invoice_number)
);

create table public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  line_number integer not null,
  description text not null,
  quantity numeric(18, 2) not null default 1,
  unit_price numeric(18, 2) not null default 0,
  line_amount numeric(18, 2) not null default 0,
  revenue_account_id uuid not null references public.chart_of_accounts(id) on delete restrict,
  project_id uuid,
  tax_rate_id uuid references public.tax_rates(id) on delete set null,
  recognition_start_date date,
  recognition_end_date date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (invoice_id, line_number)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  bill_id uuid,
  bank_account_id uuid,
  payment_date date not null,
  payment_reference text not null,
  payment_method text not null,
  currency_code text not null references public.currencies(code),
  amount numeric(18, 2) not null check (amount > 0),
  direction text not null check (direction in ('inbound', 'outbound')),
  journal_entry_id uuid references public.journal_entries(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.bills (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete restrict,
  fiscal_period_id uuid references public.fiscal_periods(id) on delete restrict,
  bill_number text not null,
  bill_date date not null,
  due_date date not null,
  status public.bill_status not null default 'draft',
  currency_code text not null references public.currencies(code),
  subtotal_amount numeric(18, 2) not null default 0,
  tax_amount numeric(18, 2) not null default 0,
  total_amount numeric(18, 2) not null default 0,
  outstanding_amount numeric(18, 2) not null default 0,
  approval_state text not null default 'pending',
  journal_entry_id uuid references public.journal_entries(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, entity_id, bill_number)
);

create table public.bill_lines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  bill_id uuid not null references public.bills(id) on delete cascade,
  line_number integer not null,
  description text not null,
  quantity numeric(18, 2) not null default 1,
  unit_cost numeric(18, 2) not null default 0,
  line_amount numeric(18, 2) not null default 0,
  expense_account_id uuid not null references public.chart_of_accounts(id) on delete restrict,
  project_id uuid,
  tax_rate_id uuid references public.tax_rates(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (bill_id, line_number)
);

create table public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  account_name text not null,
  bank_name text not null,
  masked_account_number text not null,
  currency_code text not null references public.currencies(code),
  chart_account_id uuid not null references public.chart_of_accounts(id) on delete restrict,
  integration_provider text,
  integration_reference text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.bank_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  bank_account_id uuid not null references public.bank_accounts(id) on delete cascade,
  transaction_date date not null,
  posted_date date,
  description text not null,
  amount numeric(18, 2) not null,
  direction text not null check (direction in ('credit', 'debit')),
  status text not null default 'unmatched',
  external_id text,
  journal_entry_id uuid references public.journal_entries(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.reconciliations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  bank_account_id uuid not null references public.bank_accounts(id) on delete cascade,
  statement_ending_on date not null,
  statement_balance numeric(18, 2) not null,
  book_balance numeric(18, 2) not null,
  status text not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  asset_code text not null,
  name text not null,
  category text not null,
  acquisition_date date not null,
  in_service_date date not null,
  cost numeric(18, 2) not null,
  salvage_value numeric(18, 2) not null default 0,
  useful_life_months integer not null,
  depreciation_method text not null default 'straight_line',
  asset_account_id uuid not null references public.chart_of_accounts(id) on delete restrict,
  accumulated_depreciation_account_id uuid not null references public.chart_of_accounts(id) on delete restrict,
  depreciation_expense_account_id uuid not null references public.chart_of_accounts(id) on delete restrict,
  status text not null default 'active',
  disposal_date date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, entity_id, asset_code)
);

create table public.depreciation_schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  schedule_date date not null,
  depreciation_amount numeric(18, 2) not null,
  accumulated_depreciation numeric(18, 2) not null,
  net_book_value numeric(18, 2) not null,
  journal_entry_id uuid references public.journal_entries(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (asset_id, schedule_date)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid references public.entities(id) on delete cascade,
  project_code text not null,
  name text not null,
  customer_id uuid references public.customers(id) on delete set null,
  status text not null default 'active',
  start_date date,
  end_date date,
  budget_amount numeric(18, 2),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, entity_id, project_code)
);

create table public.project_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  transaction_date date not null,
  source_type text not null,
  source_id uuid,
  amount numeric(18, 2) not null,
  cost_or_revenue text not null check (cost_or_revenue in ('cost', 'revenue')),
  journal_line_id uuid references public.journal_lines(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid references public.entities(id) on delete cascade,
  name text not null,
  fiscal_year integer not null,
  scenario text not null default 'baseline',
  status text not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.budget_lines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid references public.entities(id) on delete cascade,
  budget_id uuid not null references public.budgets(id) on delete cascade,
  account_id uuid not null references public.chart_of_accounts(id) on delete restrict,
  fiscal_period_id uuid references public.fiscal_periods(id) on delete set null,
  amount numeric(18, 2) not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid references public.entities(id) on delete cascade,
  document_type public.document_type not null,
  storage_bucket text not null default 'documents',
  storage_path text not null,
  file_name text not null,
  file_size_bytes bigint,
  mime_type text,
  related_table text,
  related_record_id uuid,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.payroll_integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid references public.entities(id) on delete cascade,
  provider_name text not null,
  external_company_id text,
  liability_account_id uuid references public.chart_of_accounts(id) on delete set null,
  expense_account_id uuid references public.chart_of_accounts(id) on delete set null,
  last_sync_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid references public.entities(id) on delete cascade,
  sku text not null,
  name text not null,
  item_type text not null default 'inventory',
  asset_account_id uuid references public.chart_of_accounts(id) on delete set null,
  cogs_account_id uuid references public.chart_of_accounts(id) on delete set null,
  revenue_account_id uuid references public.chart_of_accounts(id) on delete set null,
  unit_of_measure text not null default 'ea',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, entity_id, sku)
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid references public.entities(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  movement_date date not null,
  movement_type text not null,
  quantity numeric(18, 2) not null,
  unit_cost numeric(18, 2),
  source_type text,
  source_id uuid,
  journal_entry_id uuid references public.journal_entries(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid references public.entities(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  user_id uuid references public.users(id) on delete set null,
  work_date date not null,
  hours numeric(8, 2) not null check (hours >= 0),
  billable_rate numeric(18, 2),
  cost_rate numeric(18, 2),
  description text,
  approval_status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.expense_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid references public.entities(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  user_id uuid references public.users(id) on delete set null,
  expense_date date not null,
  category text not null,
  amount numeric(18, 2) not null,
  currency_code text not null references public.currencies(code),
  billable boolean not null default false,
  reimbursement_status text not null default 'unsubmitted',
  document_id uuid references public.documents(id) on delete set null,
  journal_entry_id uuid references public.journal_entries(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid references public.entities(id) on delete cascade,
  actor_user_id uuid references public.users(id) on delete set null,
  table_name text not null,
  record_id uuid not null,
  action text not null,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.payments
  add constraint payments_bill_fk
  foreign key (bill_id) references public.bills(id) on delete set null;

alter table public.payments
  add constraint payments_bank_account_fk
  foreign key (bank_account_id) references public.bank_accounts(id) on delete set null;

alter table public.journal_lines
  add constraint journal_lines_project_fk
  foreign key (project_id) references public.projects(id) on delete set null;

alter table public.journal_lines
  add constraint journal_lines_customer_fk
  foreign key (customer_id) references public.customers(id) on delete set null;

alter table public.journal_lines
  add constraint journal_lines_vendor_fk
  foreign key (vendor_id) references public.vendors(id) on delete set null;

alter table public.journal_lines
  add constraint journal_lines_tax_rate_fk
  foreign key (tax_rate_id) references public.tax_rates(id) on delete set null;

create index idx_entities_org on public.entities (organization_id);
create index idx_memberships_user_org on public.memberships (user_id, organization_id);
create index idx_accounts_org_entity on public.chart_of_accounts (organization_id, entity_id);
create index idx_journal_entries_org_entity_date on public.journal_entries (organization_id, entity_id, entry_date);
create index idx_journal_lines_entry on public.journal_lines (journal_entry_id);
create index idx_invoices_customer on public.invoices (customer_id, status);
create index idx_bills_vendor on public.bills (vendor_id, status);
create index idx_bank_transactions_bank on public.bank_transactions (bank_account_id, transaction_date);
create index idx_audit_logs_record on public.audit_logs (table_name, record_id);

create or replace function public.prevent_posted_journal_changes()
returns trigger
language plpgsql
as $$
declare
  current_status public.journal_status;
begin
  select status into current_status
  from public.journal_entries
  where id = coalesce(new.journal_entry_id, old.journal_entry_id);

  if current_status = 'posted' then
    raise exception 'Posted journal entries cannot be modified';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger trg_journal_lines_no_posted_changes
before update or delete on public.journal_lines
for each row
execute function public.prevent_posted_journal_changes();

create or replace function public.create_journal_entry(
  p_organization_id uuid,
  p_entity_id uuid,
  p_fiscal_period_id uuid,
  p_entry_number text,
  p_entry_date date,
  p_description text,
  p_source_type text,
  p_source_id uuid,
  p_currency_code text,
  p_exchange_rate numeric,
  p_external_reference text,
  p_lines jsonb
)
returns public.journal_entries
language plpgsql
security definer
set search_path = public
as $$
declare
  line jsonb;
  ordinality bigint;
  debit_total numeric(18, 2) := 0;
  credit_total numeric(18, 2) := 0;
  entry_record public.journal_entries;
begin
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) < 2 then
    raise exception 'Journal entry requires at least two lines';
  end if;

  for line, ordinality in
    select value, row_number() over ()
    from jsonb_array_elements(p_lines)
  loop
    debit_total := debit_total + coalesce((line ->> 'debitAmount')::numeric, 0);
    credit_total := credit_total + coalesce((line ->> 'creditAmount')::numeric, 0);
  end loop;

  if round(debit_total - credit_total, 2) <> 0 then
    raise exception 'Journal entry is out of balance';
  end if;

  insert into public.journal_entries (
    organization_id,
    entity_id,
    fiscal_period_id,
    entry_number,
    entry_date,
    description,
    source_type,
    source_id,
    currency_code,
    exchange_rate,
    external_reference,
    status
  )
  values (
    p_organization_id,
    p_entity_id,
    p_fiscal_period_id,
    p_entry_number,
    p_entry_date,
    p_description,
    p_source_type,
    p_source_id,
    p_currency_code,
    coalesce(p_exchange_rate, 1),
    p_external_reference,
    'draft'
  )
  returning * into entry_record;

  insert into public.journal_lines (
    organization_id,
    entity_id,
    journal_entry_id,
    account_id,
    description,
    line_number,
    debit_amount,
    credit_amount,
    currency_amount,
    department,
    project_id,
    customer_id,
    vendor_id,
    tax_rate_id
  )
  select
    p_organization_id,
    p_entity_id,
    entry_record.id,
    (line.value ->> 'accountId')::uuid,
    line.value ->> 'description',
    line.ordinality::integer,
    coalesce((line.value ->> 'debitAmount')::numeric, 0),
    coalesce((line.value ->> 'creditAmount')::numeric, 0),
    coalesce((line.value ->> 'currencyAmount')::numeric, greatest(
      coalesce((line.value ->> 'debitAmount')::numeric, 0),
      coalesce((line.value ->> 'creditAmount')::numeric, 0)
    )),
    line.value ->> 'department',
    nullif(line.value ->> 'projectId', '')::uuid,
    nullif(line.value ->> 'customerId', '')::uuid,
    nullif(line.value ->> 'vendorId', '')::uuid,
    nullif(line.value ->> 'taxRateId', '')::uuid
  from jsonb_array_elements(p_lines) with ordinality as line(value, ordinality);

  return entry_record;
end;
$$;

create or replace function public.post_journal_entry(p_journal_entry_id uuid, p_posted_by uuid default auth.uid())
returns public.journal_entries
language plpgsql
security definer
set search_path = public
as $$
declare
  debit_total numeric(18, 2);
  credit_total numeric(18, 2);
  line_count integer;
  target_entry public.journal_entries;
begin
  select * into target_entry
  from public.journal_entries
  where id = p_journal_entry_id
  for update;

  if not found then
    raise exception 'Journal entry not found';
  end if;

  if target_entry.status <> 'draft' then
    raise exception 'Only draft journal entries can be posted';
  end if;

  select
    count(*),
    coalesce(sum(debit_amount), 0),
    coalesce(sum(credit_amount), 0)
  into line_count, debit_total, credit_total
  from public.journal_lines
  where journal_entry_id = p_journal_entry_id;

  if line_count < 2 then
    raise exception 'Journal entry requires at least two lines';
  end if;

  if round(debit_total - credit_total, 2) <> 0 then
    raise exception 'Journal entry is out of balance';
  end if;

  update public.journal_entries
  set
    status = 'posted',
    posted_at = timezone('utc', now()),
    posted_by = p_posted_by,
    updated_at = timezone('utc', now())
  where id = p_journal_entry_id
  returning * into target_entry;

  return target_entry;
end;
$$;

create or replace function public.create_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_org_id uuid;
  target_entity_id uuid;
  target_record_id uuid;
begin
  target_org_id := coalesce(new.organization_id, old.organization_id);
  target_entity_id := coalesce(new.entity_id, old.entity_id);
  target_record_id := coalesce(new.id, old.id);

  insert into public.audit_logs (
    organization_id,
    entity_id,
    actor_user_id,
    table_name,
    record_id,
    action,
    old_values,
    new_values
  )
  values (
    target_org_id,
    target_entity_id,
    auth.uid(),
    tg_table_name,
    target_record_id,
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  return coalesce(new, old);
end;
$$;

create trigger trg_org_updated_at before update on public.organizations for each row execute function public.set_updated_at();
create trigger trg_entities_updated_at before update on public.entities for each row execute function public.set_updated_at();
create trigger trg_users_updated_at before update on public.users for each row execute function public.set_updated_at();
create trigger trg_roles_updated_at before update on public.roles for each row execute function public.set_updated_at();
create trigger trg_memberships_updated_at before update on public.memberships for each row execute function public.set_updated_at();
create trigger trg_fiscal_periods_updated_at before update on public.fiscal_periods for each row execute function public.set_updated_at();
create trigger trg_currencies_updated_at before update on public.currencies for each row execute function public.set_updated_at();
create trigger trg_exchange_rates_updated_at before update on public.exchange_rates for each row execute function public.set_updated_at();
create trigger trg_accounts_updated_at before update on public.chart_of_accounts for each row execute function public.set_updated_at();
create trigger trg_journal_entries_updated_at before update on public.journal_entries for each row execute function public.set_updated_at();
create trigger trg_journal_lines_updated_at before update on public.journal_lines for each row execute function public.set_updated_at();
create trigger trg_vendors_updated_at before update on public.vendors for each row execute function public.set_updated_at();
create trigger trg_customers_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger trg_tax_rates_updated_at before update on public.tax_rates for each row execute function public.set_updated_at();
create trigger trg_invoices_updated_at before update on public.invoices for each row execute function public.set_updated_at();
create trigger trg_invoice_lines_updated_at before update on public.invoice_lines for each row execute function public.set_updated_at();
create trigger trg_payments_updated_at before update on public.payments for each row execute function public.set_updated_at();
create trigger trg_bills_updated_at before update on public.bills for each row execute function public.set_updated_at();
create trigger trg_bill_lines_updated_at before update on public.bill_lines for each row execute function public.set_updated_at();
create trigger trg_bank_accounts_updated_at before update on public.bank_accounts for each row execute function public.set_updated_at();
create trigger trg_bank_transactions_updated_at before update on public.bank_transactions for each row execute function public.set_updated_at();
create trigger trg_reconciliations_updated_at before update on public.reconciliations for each row execute function public.set_updated_at();
create trigger trg_assets_updated_at before update on public.assets for each row execute function public.set_updated_at();
create trigger trg_depreciation_schedules_updated_at before update on public.depreciation_schedules for each row execute function public.set_updated_at();
create trigger trg_projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger trg_project_transactions_updated_at before update on public.project_transactions for each row execute function public.set_updated_at();
create trigger trg_budgets_updated_at before update on public.budgets for each row execute function public.set_updated_at();
create trigger trg_budget_lines_updated_at before update on public.budget_lines for each row execute function public.set_updated_at();
create trigger trg_documents_updated_at before update on public.documents for each row execute function public.set_updated_at();
create trigger trg_payroll_integrations_updated_at before update on public.payroll_integrations for each row execute function public.set_updated_at();
create trigger trg_inventory_items_updated_at before update on public.inventory_items for each row execute function public.set_updated_at();
create trigger trg_inventory_movements_updated_at before update on public.inventory_movements for each row execute function public.set_updated_at();
create trigger trg_time_entries_updated_at before update on public.time_entries for each row execute function public.set_updated_at();
create trigger trg_expense_entries_updated_at before update on public.expense_entries for each row execute function public.set_updated_at();
create trigger trg_audit_logs_updated_at before update on public.audit_logs for each row execute function public.set_updated_at();

create trigger trg_accounts_audit after insert or update or delete on public.chart_of_accounts for each row execute function public.create_audit_log();
create trigger trg_journal_entries_audit after insert or update or delete on public.journal_entries for each row execute function public.create_audit_log();
create trigger trg_journal_lines_audit after insert or update or delete on public.journal_lines for each row execute function public.create_audit_log();
create trigger trg_invoices_audit after insert or update or delete on public.invoices for each row execute function public.create_audit_log();
create trigger trg_bills_audit after insert or update or delete on public.bills for each row execute function public.create_audit_log();
create trigger trg_bank_transactions_audit after insert or update or delete on public.bank_transactions for each row execute function public.create_audit_log();
