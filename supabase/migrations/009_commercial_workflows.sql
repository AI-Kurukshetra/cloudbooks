create table public.estimates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  fiscal_period_id uuid references public.fiscal_periods(id) on delete restrict,
  estimate_number text not null,
  estimate_date date not null,
  valid_until date not null,
  status text not null default 'draft',
  currency_code text not null references public.currencies(code),
  subtotal_amount numeric(18, 2) not null default 0,
  tax_amount numeric(18, 2) not null default 0,
  total_amount numeric(18, 2) not null default 0,
  converted_invoice_id uuid references public.invoices(id) on delete set null,
  notes text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, entity_id, estimate_number)
);

create table public.estimate_lines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  line_number integer not null,
  description text not null,
  quantity numeric(18, 4) not null default 1 check (quantity > 0),
  unit_price numeric(18, 4) not null default 0 check (unit_price >= 0),
  line_amount numeric(18, 2) not null default 0,
  revenue_account_id uuid not null references public.chart_of_accounts(id) on delete restrict,
  tax_rate_id uuid references public.tax_rates(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  recognition_start_date date,
  recognition_end_date date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (estimate_id, line_number)
);

create table public.invoice_reminders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  reminder_type text not null,
  delivery_channel text not null,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  status text not null default 'scheduled',
  pay_link_token text unique,
  pay_link_expires_at timestamptz,
  note text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.bank_transactions
  add column if not exists suggested_account_id uuid references public.chart_of_accounts(id) on delete set null,
  add column if not exists applied_rule_id uuid,
  add column if not exists counterparty_name text;

create table public.bank_categorization_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  bank_account_id uuid references public.bank_accounts(id) on delete cascade,
  rule_name text not null,
  match_field text not null,
  match_operator text not null,
  match_value text not null,
  direction text,
  suggested_account_id uuid references public.chart_of_accounts(id) on delete set null,
  priority integer not null default 100,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.bank_transactions
  add constraint bank_transactions_applied_rule_fk
  foreign key (applied_rule_id) references public.bank_categorization_rules(id) on delete set null;

create table public.vat_returns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  filing_due_on date not null,
  currency_code text not null references public.currencies(code),
  output_tax_amount numeric(18, 2) not null default 0,
  input_tax_amount numeric(18, 2) not null default 0,
  net_tax_amount numeric(18, 2) not null default 0,
  taxable_sales_amount numeric(18, 2) not null default 0,
  taxable_purchases_amount numeric(18, 2) not null default 0,
  status text not null default 'draft',
  submitted_at timestamptz,
  reference_number text,
  notes text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index idx_estimates_org_entity on public.estimates (organization_id, entity_id, estimate_date desc);
create index idx_estimate_lines_estimate on public.estimate_lines (estimate_id, line_number);
create index idx_invoice_reminders_invoice on public.invoice_reminders (organization_id, entity_id, invoice_id, scheduled_for desc);
create index idx_bank_categorization_rules_scope on public.bank_categorization_rules (organization_id, entity_id, bank_account_id, priority);
create index idx_vat_returns_period on public.vat_returns (organization_id, entity_id, period_start, period_end);

create trigger trg_estimates_updated_at before update on public.estimates for each row execute function public.set_updated_at();
create trigger trg_estimate_lines_updated_at before update on public.estimate_lines for each row execute function public.set_updated_at();
create trigger trg_invoice_reminders_updated_at before update on public.invoice_reminders for each row execute function public.set_updated_at();
create trigger trg_bank_categorization_rules_updated_at before update on public.bank_categorization_rules for each row execute function public.set_updated_at();
create trigger trg_vat_returns_updated_at before update on public.vat_returns for each row execute function public.set_updated_at();
