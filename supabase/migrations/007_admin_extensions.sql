create table public.departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  name text not null,
  code text not null,
  manager_name text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.custom_fields (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  module_name text not null,
  field_key text not null,
  field_label text not null,
  field_type text not null,
  options jsonb not null default '[]'::jsonb,
  is_required boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workflow_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  workflow_name text not null,
  module_name text not null,
  trigger_event text not null,
  approval_role text not null,
  auto_approve_below numeric(18,2),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  rule_name text not null,
  event_key text not null,
  channel text not null,
  recipient_role text not null,
  is_enabled boolean not null default true,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_departments_org_entity on public.departments (organization_id, entity_id);
create index idx_custom_fields_org_entity on public.custom_fields (organization_id, entity_id, module_name);
create index idx_workflow_definitions_org_entity on public.workflow_definitions (organization_id, entity_id, module_name);
create index idx_notification_rules_org_entity on public.notification_rules (organization_id, entity_id, event_key);

create trigger trg_departments_updated_at before update on public.departments for each row execute function public.set_updated_at();
create trigger trg_custom_fields_updated_at before update on public.custom_fields for each row execute function public.set_updated_at();
create trigger trg_workflow_definitions_updated_at before update on public.workflow_definitions for each row execute function public.set_updated_at();
create trigger trg_notification_rules_updated_at before update on public.notification_rules for each row execute function public.set_updated_at();
