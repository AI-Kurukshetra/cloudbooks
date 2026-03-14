insert into public.chart_of_accounts (
  id, organization_id, entity_id, account_code, name, account_type, normal_balance, currency_code
)
values
  ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '3000', 'Member Equity', 'equity', 'credit', 'USD'),
  ('66666666-6666-6666-6666-666666666667', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '5200', 'Professional Fees Expense', 'expense', 'debit', 'USD'),
  ('66666666-6666-6666-6666-666666666668', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '6100', 'Payroll Expense', 'expense', 'debit', 'USD')
on conflict do nothing;

insert into public.customers (id, organization_id, entity_id, customer_code, legal_name, display_name, email)
values
  ('77777777-7777-7777-7777-777777777772', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'CUST-002', 'Beacon Institutional Advisors LLC', 'Beacon Institutional', 'ops@beacon.example'),
  ('77777777-7777-7777-7777-777777777773', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'CUST-003', 'Meridian Trustee Services Inc.', 'Meridian Trustee', 'finance@meridian.example')
on conflict do nothing;

insert into public.vendors (id, organization_id, entity_id, vendor_code, legal_name, display_name, email)
values
  ('88888888-8888-8888-8888-888888888882', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'VEND-002', 'Regulatory Filing Services LLC', 'Regulatory Filing Services', 'billing@rfs.example'),
  ('88888888-8888-8888-8888-888888888883', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'VEND-003', 'Harbor Talent Ops Inc.', 'Harbor Talent Ops', 'ap@harbortalent.example')
on conflict do nothing;

insert into public.projects (id, organization_id, entity_id, project_code, name, customer_id, status, start_date, budget_amount)
values
  ('abababab-abab-abab-abab-ababababab06', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'ENG-002', 'Beacon Oversight Program', '77777777-7777-7777-7777-777777777772', 'active', '2026-01-05', 96000.00)
on conflict do nothing;

insert into public.journal_entries (
  id, organization_id, entity_id, fiscal_period_id, entry_number, entry_date, description, status,
  source_type, source_id, currency_code, exchange_rate, posted_at
)
values
  ('dddddddd-dddd-dddd-dddd-ddddddddddd2', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '44444444-4444-4444-4444-444444444441', 'JE-2026-OPEN', '2026-01-01', 'Initial capital funding', 'posted', 'manual', null, 'USD', 1, timezone('utc', now())),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd3', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '44444444-4444-4444-4444-444444444441', 'JE-2026-0101', '2026-01-09', 'Invoice INV-2026-0101 issued', 'posted', 'invoice', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'USD', 1, timezone('utc', now())),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd4', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '44444444-4444-4444-4444-444444444441', 'JE-2026-0102', '2026-01-18', 'Payment received for INV-2026-0101', 'posted', 'payment', 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f101', 'USD', 1, timezone('utc', now())),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd5', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '44444444-4444-4444-4444-444444444441', 'JE-2026-0103', '2026-01-12', 'Bill BILL-2026-0101 accrued', 'posted', 'bill', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'USD', 1, timezone('utc', now())),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd6', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '44444444-4444-4444-4444-444444444441', 'JE-2026-0104', '2026-01-25', 'Vendor payment for BILL-2026-0101', 'posted', 'payment', 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f102', 'USD', 1, timezone('utc', now())),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd7', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '44444444-4444-4444-4444-444444444441', 'JE-2026-0201', '2026-02-11', 'Invoice INV-2026-0201 issued', 'posted', 'invoice', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'USD', 1, timezone('utc', now())),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd8', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '44444444-4444-4444-4444-444444444441', 'JE-2026-0202', '2026-02-25', 'Partial payment for INV-2026-0201', 'posted', 'payment', 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f103', 'USD', 1, timezone('utc', now())),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd9', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '44444444-4444-4444-4444-444444444441', 'JE-2026-0203', '2026-02-15', 'Bill BILL-2026-0201 accrued', 'posted', 'bill', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 'USD', 1, timezone('utc', now())),
  ('dddddddd-dddd-dddd-dddd-dddddddddd10', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '44444444-4444-4444-4444-444444444441', 'JE-2026-0204', '2026-02-28', 'February payroll run', 'posted', 'payroll', null, 'USD', 1, timezone('utc', now())),
  ('dddddddd-dddd-dddd-dddd-dddddddddd11', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '44444444-4444-4444-4444-444444444441', 'JE-2026-0301', '2026-03-05', 'Invoice INV-2026-0301 issued', 'posted', 'invoice', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'USD', 1, timezone('utc', now())),
  ('dddddddd-dddd-dddd-dddd-dddddddddd12', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '44444444-4444-4444-4444-444444444441', 'JE-2026-0302', '2026-03-07', 'Bill BILL-2026-0301 accrued', 'posted', 'bill', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', 'USD', 1, timezone('utc', now()))
on conflict do nothing;

insert into public.journal_lines (
  id, organization_id, entity_id, journal_entry_id, account_id, description, line_number,
  debit_amount, credit_amount, currency_amount, customer_id, vendor_id, project_id
)
values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'dddddddd-dddd-dddd-dddd-ddddddddddd2', '66666666-6666-6666-6666-666666666661', 'Fund operating account', 1, 1500000.00, 0, 1500000.00, null, null, null),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'dddddddd-dddd-dddd-dddd-ddddddddddd2', '66666666-6666-6666-6666-666666666666', 'Record member equity', 2, 0, 1500000.00, 1500000.00, null, null, null),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'dddddddd-dddd-dddd-dddd-ddddddddddd3', '66666666-6666-6666-6666-666666666662', 'Record receivable', 1, 18000.00, 0, 18000.00, '77777777-7777-7777-7777-777777777772', null, 'abababab-abab-abab-abab-ababababab06'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee6', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'dddddddd-dddd-dddd-dddd-ddddddddddd3', '66666666-6666-6666-6666-666666666664', 'Recognize advisory revenue', 2, 0, 18000.00, 18000.00, '77777777-7777-7777-7777-777777777772', null, 'abababab-abab-abab-abab-ababababab06'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee7', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'dddddddd-dddd-dddd-dddd-ddddddddddd4', '66666666-6666-6666-6666-666666666661', 'Cash collection', 1, 18000.00, 0, 18000.00, '77777777-7777-7777-7777-777777777772', null, null),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee8', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'dddddddd-dddd-dddd-dddd-ddddddddddd4', '66666666-6666-6666-6666-666666666662', 'Apply to receivable', 2, 0, 18000.00, 18000.00, '77777777-7777-7777-7777-777777777772', null, null),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee9', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'dddddddd-dddd-dddd-dddd-ddddddddddd5', '66666666-6666-6666-6666-666666666665', 'Record software expense', 1, 6200.00, 0, 6200.00, null, '88888888-8888-8888-8888-888888888882', null),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee10', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'dddddddd-dddd-dddd-dddd-ddddddddddd5', '66666666-6666-6666-6666-666666666663', 'Accrue payable', 2, 0, 6200.00, 6200.00, null, '88888888-8888-8888-8888-888888888882', null),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee11', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'dddddddd-dddd-dddd-dddd-ddddddddddd6', '66666666-6666-6666-6666-666666666663', 'Clear payable', 1, 6200.00, 0, 6200.00, null, '88888888-8888-8888-8888-888888888882', null),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee12', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'dddddddd-dddd-dddd-dddd-ddddddddddd6', '66666666-6666-6666-6666-666666666661', 'Cash disbursement', 2, 0, 6200.00, 6200.00, null, '88888888-8888-8888-8888-888888888882', null),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee13', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'dddddddd-dddd-dddd-dddd-ddddddddddd7', '66666666-6666-6666-6666-666666666662', 'Record receivable', 1, 22500.00, 0, 22500.00, '77777777-7777-7777-7777-777777777771', null, 'abababab-abab-abab-abab-ababababab01'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee14', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'dddddddd-dddd-dddd-dddd-ddddddddddd7', '66666666-6666-6666-6666-666666666664', 'Recognize advisory revenue', 2, 0, 22500.00, 22500.00, '77777777-7777-7777-7777-777777777771', null, 'abababab-abab-abab-abab-ababababab01'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee15', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'dddddddd-dddd-dddd-dddd-ddddddddddd8', '66666666-6666-6666-6666-666666666661', 'Partial cash collection', 1, 10000.00, 0, 10000.00, '77777777-7777-7777-7777-777777777771', null, null),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee16', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'dddddddd-dddd-dddd-dddd-ddddddddddd8', '66666666-6666-6666-6666-666666666662', 'Apply to receivable', 2, 0, 10000.00, 10000.00, '77777777-7777-7777-7777-777777777771', null, null),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee17', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'dddddddd-dddd-dddd-dddd-ddddddddddd9', '66666666-6666-6666-6666-666666666667', 'Record professional fees', 1, 7800.00, 0, 7800.00, null, '88888888-8888-8888-8888-888888888883', null),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee18', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'dddddddd-dddd-dddd-dddd-ddddddddddd9', '66666666-6666-6666-6666-666666666663', 'Accrue payable', 2, 0, 7800.00, 7800.00, null, '88888888-8888-8888-8888-888888888883', null),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee19', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'dddddddd-dddd-dddd-dddd-dddddddddd10', '66666666-6666-6666-6666-666666666668', 'Payroll expense', 1, 12000.00, 0, 12000.00, null, null, null),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee20', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'dddddddd-dddd-dddd-dddd-dddddddddd10', '66666666-6666-6666-6666-666666666661', 'Payroll cash funding', 2, 0, 12000.00, 12000.00, null, null, null),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee21', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'dddddddd-dddd-dddd-dddd-dddddddddd11', '66666666-6666-6666-6666-666666666662', 'Record receivable', 1, 14500.00, 0, 14500.00, '77777777-7777-7777-7777-777777777773', null, null),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee22', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'dddddddd-dddd-dddd-dddd-dddddddddd11', '66666666-6666-6666-6666-666666666664', 'Recognize advisory revenue', 2, 0, 14500.00, 14500.00, '77777777-7777-7777-7777-777777777773', null, null),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee23', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'dddddddd-dddd-dddd-dddd-dddddddddd12', '66666666-6666-6666-6666-666666666665', 'Record software expense', 1, 4300.00, 0, 4300.00, null, '88888888-8888-8888-8888-888888888881', null),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee24', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'dddddddd-dddd-dddd-dddd-dddddddddd12', '66666666-6666-6666-6666-666666666663', 'Accrue payable', 2, 0, 4300.00, 4300.00, null, '88888888-8888-8888-8888-888888888881', null)
on conflict do nothing;

insert into public.invoices (
  id, organization_id, entity_id, customer_id, fiscal_period_id, invoice_number, invoice_date, due_date, status,
  currency_code, subtotal_amount, tax_amount, total_amount, outstanding_amount, recognized_amount, journal_entry_id
)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '77777777-7777-7777-7777-777777777772', '44444444-4444-4444-4444-444444444441', 'INV-2026-0101', '2026-01-09', '2026-01-24', 'paid', 'USD', 18000.00, 0, 18000.00, 0.00, 18000.00, 'dddddddd-dddd-dddd-dddd-ddddddddddd3'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '77777777-7777-7777-7777-777777777771', '44444444-4444-4444-4444-444444444441', 'INV-2026-0201', '2026-02-11', '2026-03-12', 'partially_paid', 'USD', 22500.00, 0, 22500.00, 12500.00, 22500.00, 'dddddddd-dddd-dddd-dddd-ddddddddddd7'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '77777777-7777-7777-7777-777777777773', '44444444-4444-4444-4444-444444444441', 'INV-2026-0301', '2026-03-05', '2026-04-04', 'approved', 'USD', 14500.00, 0, 14500.00, 14500.00, 14500.00, 'dddddddd-dddd-dddd-dddd-dddddddddd11')
on conflict do nothing;

insert into public.invoice_lines (
  id, organization_id, entity_id, invoice_id, line_number, description, quantity, unit_price, line_amount,
  revenue_account_id, project_id
)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 1, 'Institutional oversight monthly retainer', 1, 18000.00, 18000.00, '66666666-6666-6666-6666-666666666664', 'abababab-abab-abab-abab-ababababab06'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 1, 'Quarterly governance advisory', 1, 22500.00, 22500.00, '66666666-6666-6666-6666-666666666664', 'abababab-abab-abab-abab-ababababab01'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 1, 'Trustee reporting services', 1, 14500.00, 14500.00, '66666666-6666-6666-6666-666666666664', null)
on conflict do nothing;

insert into public.bills (
  id, organization_id, entity_id, vendor_id, fiscal_period_id, bill_number, bill_date, due_date, status,
  currency_code, subtotal_amount, tax_amount, total_amount, outstanding_amount, approval_state, journal_entry_id
)
values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '88888888-8888-8888-8888-888888888882', '44444444-4444-4444-4444-444444444441', 'BILL-2026-0101', '2026-01-12', '2026-01-27', 'paid', 'USD', 6200.00, 0, 6200.00, 0.00, 'approved', 'dddddddd-dddd-dddd-dddd-ddddddddddd5'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '88888888-8888-8888-8888-888888888883', '44444444-4444-4444-4444-444444444441', 'BILL-2026-0201', '2026-02-15', '2026-03-10', 'approved', 'USD', 7800.00, 0, 7800.00, 7800.00, 'approved', 'dddddddd-dddd-dddd-dddd-ddddddddddd9'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '88888888-8888-8888-8888-888888888881', '44444444-4444-4444-4444-444444444441', 'BILL-2026-0301', '2026-03-07', '2026-04-06', 'approved', 'USD', 4300.00, 0, 4300.00, 4300.00, 'approved', 'dddddddd-dddd-dddd-dddd-dddddddddd12')
on conflict do nothing;

insert into public.bill_lines (
  id, organization_id, entity_id, bill_id, line_number, description, quantity, unit_cost, line_amount,
  expense_account_id
)
values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 1, 'Annual filing software license', 1, 6200.00, 6200.00, '66666666-6666-6666-6666-666666666665'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb7', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 1, 'Regulatory consulting support', 1, 7800.00, 7800.00, '66666666-6666-6666-6666-666666666667'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb8', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', 1, 'Platform subscription renewal', 1, 4300.00, 4300.00, '66666666-6666-6666-6666-666666666665')
on conflict do nothing;

insert into public.payments (
  id, organization_id, entity_id, customer_id, invoice_id, bill_id, bank_account_id, payment_date,
  payment_reference, payment_method, currency_code, amount, direction, journal_entry_id
)
values
  ('f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f101', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '77777777-7777-7777-7777-777777777772', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', null, 'cccccccc-cccc-cccc-cccc-ccccccccccc1', '2026-01-18', 'RCPT-2026-0101', 'wire', 'USD', 18000.00, 'inbound', 'dddddddd-dddd-dddd-dddd-ddddddddddd4'),
  ('f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f102', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', null, null, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', '2026-01-25', 'PMT-2026-0101', 'ach', 'USD', 6200.00, 'outbound', 'dddddddd-dddd-dddd-dddd-ddddddddddd6'),
  ('f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f103', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '77777777-7777-7777-7777-777777777771', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', null, 'cccccccc-cccc-cccc-cccc-ccccccccccc1', '2026-02-25', 'RCPT-2026-0201', 'wire', 'USD', 10000.00, 'inbound', 'dddddddd-dddd-dddd-dddd-ddddddddddd8')
on conflict do nothing;

insert into public.bank_transactions (
  id, organization_id, entity_id, bank_account_id, transaction_date, posted_date, description, amount,
  direction, status, external_id, journal_entry_id
)
values
  ('12121212-1212-1212-1212-121212121201', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', '2026-01-18', '2026-01-18', 'Beacon invoice receipt', 18000.00, 'credit', 'matched', 'seed-bank-001', 'dddddddd-dddd-dddd-dddd-ddddddddddd4'),
  ('12121212-1212-1212-1212-121212121202', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', '2026-01-25', '2026-01-25', 'Regulatory vendor payment', -6200.00, 'debit', 'matched', 'seed-bank-002', 'dddddddd-dddd-dddd-dddd-ddddddddddd6'),
  ('12121212-1212-1212-1212-121212121203', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', '2026-02-25', '2026-02-25', 'Aurora partial invoice receipt', 10000.00, 'credit', 'matched', 'seed-bank-003', 'dddddddd-dddd-dddd-dddd-ddddddddddd8')
on conflict do nothing;
