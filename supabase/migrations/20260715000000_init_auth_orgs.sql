-- 1. Create tables
create table public.organizations (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.organization_members (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    role text not null check (role in ('admin', 'manager', 'member')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(organization_id, user_id)
);

-- 2. Enable RLS
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

-- 3. Setup Policies for organizations
create policy "Users can view organizations they belong to"
on public.organizations for select
to authenticated
using (
    exists (
        select 1 from public.organization_members
        where organization_members.organization_id = organizations.id
        and organization_members.user_id = (select auth.uid())
    )
);

create policy "Admins can update their organizations"
on public.organizations for update
to authenticated
using (
    exists (
        select 1 from public.organization_members
        where organization_members.organization_id = organizations.id
        and organization_members.user_id = (select auth.uid())
        and organization_members.role = 'admin'
    )
)
with check (
    exists (
        select 1 from public.organization_members
        where organization_members.organization_id = organizations.id
        and organization_members.user_id = (select auth.uid())
        and organization_members.role = 'admin'
    )
);

-- 4. Setup Policies for organization_members
create policy "Users can view members of their organizations"
on public.organization_members for select
to authenticated
using (
    exists (
        select 1 from public.organization_members as om
        where om.organization_id = organization_members.organization_id
        and om.user_id = (select auth.uid())
    )
);

create policy "Admins can update members of their organizations"
on public.organization_members for update
to authenticated
using (
    exists (
        select 1 from public.organization_members as om
        where om.organization_id = organization_members.organization_id
        and om.user_id = (select auth.uid())
        and om.role = 'admin'
    )
)
with check (
    exists (
        select 1 from public.organization_members as om
        where om.organization_id = organization_members.organization_id
        and om.user_id = (select auth.uid())
        and om.role = 'admin'
    )
);

-- 5. Stored Procedure for secure Organization creation
-- This function runs with elevated privileges (security definer) to atomically create an org and assign the user as admin.
create or replace function public.create_organization(org_name text, org_slug text)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  new_org_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Not authenticated';
  end if;

  -- Create the organization
  insert into public.organizations (name, slug)
  values (org_name, org_slug)
  returning id into new_org_id;

  -- Create the admin member link
  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, (select auth.uid()), 'admin');

  return new_org_id;
end;
$$;
