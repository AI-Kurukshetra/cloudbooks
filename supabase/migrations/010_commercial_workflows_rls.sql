alter table public.estimates enable row level security;
alter table public.estimate_lines enable row level security;
alter table public.invoice_reminders enable row level security;
alter table public.bank_categorization_rules enable row level security;
alter table public.vat_returns enable row level security;

do $$
declare
  tbl text;
  tables text[] := array[
    'estimates',
    'estimate_lines',
    'invoice_reminders',
    'bank_categorization_rules',
    'vat_returns'
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
