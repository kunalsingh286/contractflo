-- 1. Create audit_logs table
create table public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete cascade not null,
    user_id uuid not null,
    action text not null,
    resource_type text not null,
    resource_id uuid,
    metadata jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for fast querying by organization and time
create index idx_audit_logs_org_created on public.audit_logs(organization_id, created_at desc);

-- 2. Enable RLS
alter table public.audit_logs enable row level security;

-- 3. RLS Policies
-- Users can only view audit logs for their organization
create policy "Users can view audit logs in their organizations"
on public.audit_logs for select
to authenticated
using (
    organization_id in (
        select organization_id from public.organization_members
        where user_id = (select auth.uid())
    )
);

-- Users can insert audit logs for their organization
create policy "Users can insert audit logs in their organizations"
on public.audit_logs for insert
to authenticated
with check (
    organization_id in (
        select organization_id from public.organization_members
        where user_id = (select auth.uid())
    )
);

-- Audit logs are append-only. No updates or deletes allowed.
