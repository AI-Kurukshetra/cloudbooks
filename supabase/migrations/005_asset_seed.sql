-- Fixed asset seed data for the default Northstar Advisory entity.
-- Apply this before attachment_seed.sql if you want asset attachment rows to resolve.

insert into public.chart_of_accounts (
  id,
  organization_id,
  entity_id,
  account_code,
  name,
  account_type,
  normal_balance,
  currency_code
)
values
  (
    '66666666-6666-6666-6666-666666666669',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222221',
    '1500',
    'Computer Equipment',
    'asset',
    'debit',
    'USD'
  ),
  (
    '66666666-6666-6666-6666-666666666670',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222221',
    '1590',
    'Accumulated Depreciation - Computer Equipment',
    'asset',
    'credit',
    'USD'
  ),
  (
    '66666666-6666-6666-6666-666666666671',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222221',
    '5850',
    'Depreciation Expense',
    'expense',
    'debit',
    'USD'
  )
on conflict do nothing;

insert into public.assets (
  id,
  organization_id,
  entity_id,
  asset_code,
  name,
  category,
  acquisition_date,
  in_service_date,
  cost,
  salvage_value,
  useful_life_months,
  depreciation_method,
  asset_account_id,
  accumulated_depreciation_account_id,
  depreciation_expense_account_id,
  status
)
values
  (
    'acacacac-acac-acac-acac-acacacacac01',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222221',
    'FA-2026-001',
    'Dell Precision Advisory Workstation',
    'Technology',
    '2026-01-08',
    '2026-01-10',
    4850.00,
    350.00,
    36,
    'straight_line',
    '66666666-6666-6666-6666-666666666669',
    '66666666-6666-6666-6666-666666666670',
    '66666666-6666-6666-6666-666666666671',
    'active'
  ),
  (
    'acacacac-acac-acac-acac-acacacacac02',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222221',
    'FA-2026-002',
    'Conference Room Display System',
    'Office Equipment',
    '2026-02-03',
    '2026-02-05',
    7200.00,
    600.00,
    48,
    'straight_line',
    '66666666-6666-6666-6666-666666666669',
    '66666666-6666-6666-6666-666666666670',
    '66666666-6666-6666-6666-666666666671',
    'active'
  ),
  (
    'acacacac-acac-acac-acac-acacacacac03',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222221',
    'FA-2026-003',
    'Secure File Archive Appliance',
    'Technology',
    '2026-03-01',
    '2026-03-02',
    12950.00,
    950.00,
    60,
    'straight_line',
    '66666666-6666-6666-6666-666666666669',
    '66666666-6666-6666-6666-666666666670',
    '66666666-6666-6666-6666-666666666671',
    'active'
  )
on conflict do nothing;

insert into public.depreciation_schedules (
  id,
  organization_id,
  entity_id,
  asset_id,
  schedule_date,
  depreciation_amount,
  accumulated_depreciation,
  net_book_value
)
values
  (
    'dadadada-dada-dada-dada-dadadadada01',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222221',
    'acacacac-acac-acac-acac-acacacacac01',
    '2026-02-28',
    125.00,
    125.00,
    4725.00
  ),
  (
    'dadadada-dada-dada-dada-dadadadada02',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222221',
    'acacacac-acac-acac-acac-acacacacac02',
    '2026-02-28',
    137.50,
    137.50,
    7062.50
  )
on conflict do nothing;
