create or replace function public.is_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships
    where memberships.organization_id = target_organization_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
  );
$$;

alter table public.organizations enable row level security;
alter table public.entities enable row level security;
alter table public.users enable row level security;
alter table public.roles enable row level security;
alter table public.memberships enable row level security;
alter table public.fiscal_periods enable row level security;
alter table public.currencies enable row level security;
alter table public.exchange_rates enable row level security;
alter table public.chart_of_accounts enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_lines enable row level security;
alter table public.vendors enable row level security;
alter table public.customers enable row level security;
alter table public.tax_rates enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_lines enable row level security;
alter table public.payments enable row level security;
alter table public.bills enable row level security;
alter table public.bill_lines enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.bank_transactions enable row level security;
alter table public.reconciliations enable row level security;
alter table public.assets enable row level security;
alter table public.depreciation_schedules enable row level security;
alter table public.projects enable row level security;
alter table public.project_transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_lines enable row level security;
alter table public.documents enable row level security;
alter table public.payroll_integrations enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.time_entries enable row level security;
alter table public.expense_entries enable row level security;
alter table public.audit_logs enable row level security;

create policy "users_can_read_their_profile"
on public.users
for select
using (id = auth.uid());

create policy "users_can_update_their_profile"
on public.users
for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "org_member_access_organizations"
on public.organizations
for all
using (public.is_org_member(id))
with check (public.is_org_member(id));

do $$
declare
  tbl text;
  tables text[] := array[
    'entities',
    'roles',
    'memberships',
    'fiscal_periods',
    'exchange_rates',
    'chart_of_accounts',
    'journal_entries',
    'journal_lines',
    'vendors',
    'customers',
    'tax_rates',
    'invoices',
    'invoice_lines',
    'payments',
    'bills',
    'bill_lines',
    'bank_accounts',
    'bank_transactions',
    'reconciliations',
    'assets',
    'depreciation_schedules',
    'projects',
    'project_transactions',
    'budgets',
    'budget_lines',
    'documents',
    'payroll_integrations',
    'inventory_items',
    'inventory_movements',
    'time_entries',
    'expense_entries',
    'audit_logs'
  ];
begin
  foreach tbl in array tables
  loop
    execute format(
      'create policy %I on public.%I for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));',
      'org_member_access_' || tbl,
      tbl
    );
  end loop;
end $$;

create policy "org_member_read_currencies"
on public.currencies
for select
using (
  organization_id is null
  or public.is_org_member(organization_id)
);

create policy "service_role_manage_currencies"
on public.currencies
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
