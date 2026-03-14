alter table public.departments enable row level security;
alter table public.custom_fields enable row level security;
alter table public.workflow_definitions enable row level security;
alter table public.notification_rules enable row level security;

do $$
declare
  tbl text;
  tables text[] := array[
    'departments',
    'custom_fields',
    'workflow_definitions',
    'notification_rules'
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
