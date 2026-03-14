insert into public.currencies (id, code, name, symbol, decimal_places)
values
  ('00000000-0000-0000-0000-000000000001', 'USD', 'US Dollar', '$', 2),
  ('00000000-0000-0000-0000-000000000002', 'EUR', 'Euro', 'EUR', 2)
on conflict (code) do nothing;

insert into public.organizations (id, organization_id, entity_id, name, legal_name, base_currency_code)
values (
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  null,
  'Northstar Capital',
  'Northstar Capital Holdings LLC',
  'USD'
)
on conflict (id) do nothing;

insert into public.entities (id, organization_id, entity_id, name, legal_name, code, jurisdiction, reporting_currency_code, is_consolidation)
values
  (
    '22222222-2222-2222-2222-222222222221',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222221',
    'Northstar Advisory',
    'Northstar Advisory LLC',
    'ADV',
    'US-DE',
    'USD',
    false
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Northstar Wealth',
    'Northstar Wealth Management LLC',
    'PWM',
    'US-NY',
    'USD',
    false
  )
on conflict (id) do nothing;

insert into public.roles (id, organization_id, name, description, permissions)
values
  (
    '33333333-3333-3333-3333-333333333331',
    '11111111-1111-1111-1111-111111111111',
    'admin',
    'Full organization controller access',
    '["dashboard.read","journal.post","reporting.read","ap.manage","ar.manage","settings.manage"]'::jsonb
  ),
  (
    '33333333-3333-3333-3333-333333333332',
    '11111111-1111-1111-1111-111111111111',
    'accountant',
    'Daily accounting operations',
    '["dashboard.read","journal.post","reporting.read","ap.manage","ar.manage"]'::jsonb
  )
on conflict (id) do nothing;

insert into public.fiscal_periods (id, organization_id, entity_id, period_name, starts_on, ends_on, status)
values
  (
    '44444444-4444-4444-4444-444444444441',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222221',
    'FY2026-Q1',
    '2026-01-01',
    '2026-03-31',
    'open'
  )
on conflict (id) do nothing;

insert into public.exchange_rates (id, organization_id, entity_id, from_currency_code, to_currency_code, rate, effective_on, source)
values (
  '55555555-5555-5555-5555-555555555551',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222221',
  'EUR',
  'USD',
  1.08950000,
  '2026-03-01',
  'seed'
)
on conflict do nothing;

insert into public.chart_of_accounts (
  id, organization_id, entity_id, account_code, name, account_type, normal_balance, currency_code
)
values
  ('66666666-6666-6666-6666-666666666661', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '1000', 'Cash', 'asset', 'debit', 'USD'),
  ('66666666-6666-6666-6666-666666666662', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '1100', 'Accounts Receivable', 'asset', 'debit', 'USD'),
  ('66666666-6666-6666-6666-666666666663', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '2000', 'Accounts Payable', 'liability', 'credit', 'USD'),
  ('66666666-6666-6666-6666-666666666664', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '4000', 'Advisory Revenue', 'revenue', 'credit', 'USD'),
  ('66666666-6666-6666-6666-666666666665', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '5100', 'Software Expense', 'expense', 'debit', 'USD')
on conflict do nothing;

insert into public.customers (id, organization_id, entity_id, customer_code, legal_name, display_name, email)
values (
  '77777777-7777-7777-7777-777777777771',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222221',
  'CUST-001',
  'Aurora Family Office LP',
  'Aurora Family Office',
  'finance@aurora.example'
)
on conflict do nothing;

insert into public.vendors (id, organization_id, entity_id, vendor_code, legal_name, display_name, email)
values (
  '88888888-8888-8888-8888-888888888881',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222221',
  'VEND-001',
  'Cloud ERP Services Inc.',
  'Cloud ERP Services',
  'ap@clouderp.example'
)
on conflict do nothing;

insert into public.projects (id, organization_id, entity_id, project_code, name, customer_id, status, start_date, budget_amount)
values (
  'abababab-abab-abab-abab-ababababab01',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222221',
  'ENG-001',
  'Aurora Onboarding',
  '77777777-7777-7777-7777-777777777771',
  'active',
  '2026-02-01',
  120000.00
)
on conflict do nothing;

insert into public.budgets (id, organization_id, entity_id, name, fiscal_year, scenario, status)
values (
  'abababab-abab-abab-abab-ababababab02',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222221',
  'FY2026 Operating Plan',
  2026,
  'baseline',
  'draft'
)
on conflict do nothing;

insert into public.budget_lines (id, organization_id, entity_id, budget_id, account_id, fiscal_period_id, amount)
values (
  'abababab-abab-abab-abab-ababababab03',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222221',
  'abababab-abab-abab-abab-ababababab02',
  '66666666-6666-6666-6666-666666666665',
  '44444444-4444-4444-4444-444444444441',
  15000.00
)
on conflict do nothing;

insert into public.tax_rates (id, organization_id, entity_id, name, tax_code, rate, jurisdiction)
values (
  '99999999-9999-9999-9999-999999999991',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222221',
  'US Sales Tax',
  'US-ST',
  0.070000,
  'US'
)
on conflict do nothing;

insert into public.payroll_integrations (
  id, organization_id, entity_id, provider_name, external_company_id, liability_account_id, expense_account_id
)
values (
  'abababab-abab-abab-abab-ababababab04',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222221',
  'Rippling',
  'northstar-capital',
  '66666666-6666-6666-6666-666666666663',
  '66666666-6666-6666-6666-666666666665'
)
on conflict do nothing;

insert into public.inventory_items (
  id, organization_id, entity_id, sku, name, item_type, asset_account_id, cogs_account_id, revenue_account_id
)
values (
  'abababab-abab-abab-abab-ababababab05',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222221',
  'INV-SW-001',
  'White-Label Reporting Package',
  'inventory',
  '66666666-6666-6666-6666-666666666661',
  '66666666-6666-6666-6666-666666666665',
  '66666666-6666-6666-6666-666666666664'
)
on conflict do nothing;

insert into public.invoices (
  id, organization_id, entity_id, customer_id, fiscal_period_id, invoice_number, invoice_date, due_date, status,
  currency_code, subtotal_amount, tax_amount, total_amount, outstanding_amount, recognized_amount
)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222221',
  '77777777-7777-7777-7777-777777777771',
  '44444444-4444-4444-4444-444444444441',
  'INV-2026-0001',
  '2026-03-10',
  '2026-04-09',
  'approved',
  'USD',
  25000.00,
  1750.00,
  26750.00,
  26750.00,
  0
)
on conflict do nothing;

insert into public.invoice_lines (
  id, organization_id, entity_id, invoice_id, line_number, description, quantity, unit_price,
  line_amount, revenue_account_id, tax_rate_id, recognition_start_date, recognition_end_date
)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222221',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  1,
  'Quarterly advisory retainer',
  1,
  25000.00,
  25000.00,
  '66666666-6666-6666-6666-666666666664',
  '99999999-9999-9999-9999-999999999991',
  '2026-03-10',
  '2026-03-31'
)
on conflict do nothing;

insert into public.bills (
  id, organization_id, entity_id, vendor_id, fiscal_period_id, bill_number, bill_date, due_date, status,
  currency_code, subtotal_amount, tax_amount, total_amount, outstanding_amount, approval_state
)
values (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222221',
  '88888888-8888-8888-8888-888888888881',
  '44444444-4444-4444-4444-444444444441',
  'BILL-2026-0042',
  '2026-03-08',
  '2026-04-07',
  'approved',
  'USD',
  4200.00,
  294.00,
  4494.00,
  4494.00,
  'approved'
)
on conflict do nothing;

insert into public.bill_lines (
  id, organization_id, entity_id, bill_id, line_number, description, quantity, unit_cost, line_amount,
  expense_account_id, tax_rate_id
)
values (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222221',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
  1,
  'Portfolio analytics platform subscription',
  1,
  4200.00,
  4200.00,
  '66666666-6666-6666-6666-666666666665',
  '99999999-9999-9999-9999-999999999991'
)
on conflict do nothing;

insert into public.bank_accounts (
  id, organization_id, entity_id, account_name, bank_name, masked_account_number, currency_code, chart_account_id,
  integration_provider, integration_reference
)
values (
  'cccccccc-cccc-cccc-cccc-ccccccccccc1',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222221',
  'Operating Account',
  'First National Bank',
  '****4321',
  'USD',
  '66666666-6666-6666-6666-666666666661',
  'plaid',
  'bank_seed_001'
)
on conflict do nothing;

insert into public.journal_entries (
  id, organization_id, entity_id, fiscal_period_id, entry_number, entry_date, description, status,
  source_type, source_id, currency_code, exchange_rate, posted_at
)
values (
  'dddddddd-dddd-dddd-dddd-ddddddddddd1',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222221',
  '44444444-4444-4444-4444-444444444441',
  'JE-2026-0001',
  '2026-03-10',
  'Invoice INV-2026-0001 initial recognition',
  'posted',
  'invoice',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  'USD',
  1,
  timezone('utc', now())
)
on conflict do nothing;

insert into public.journal_lines (
  id, organization_id, entity_id, journal_entry_id, account_id, description, line_number, debit_amount, credit_amount, currency_amount, customer_id
)
values
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222221',
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    '66666666-6666-6666-6666-666666666662',
    'Record receivable',
    1,
    26750.00,
    0,
    26750.00,
    '77777777-7777-7777-7777-777777777771'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222221',
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    '66666666-6666-6666-6666-666666666664',
    'Recognize advisory revenue',
    2,
    0,
    26750.00,
    26750.00,
    '77777777-7777-7777-7777-777777777771'
  )
on conflict do nothing;
