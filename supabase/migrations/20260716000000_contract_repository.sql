-- 1. Create tables
create table public.contracts (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete cascade not null,
    uploaded_by uuid references auth.users(id) on delete set null,
    title text not null,
    contract_type text not null,
    status text not null check (status in ('Draft', 'Review', 'Approved', 'Executed', 'Expired')),
    storage_path text not null,
    file_name text not null,
    file_size bigint not null,
    mime_type text not null,
    effective_date date,
    expiration_date date,
    renewal_date date,
    counterparty text,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.contract_versions (
    id uuid primary key default gen_random_uuid(),
    contract_id uuid references public.contracts(id) on delete cascade not null,
    version_number integer not null,
    storage_path text not null,
    uploaded_by uuid references auth.users(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.contract_tags (
    id uuid primary key default gen_random_uuid(),
    contract_id uuid references public.contracts(id) on delete cascade not null,
    tag_name text not null,
    unique(contract_id, tag_name)
);

-- 2. Enable RLS
alter table public.contracts enable row level security;
alter table public.contract_versions enable row level security;
alter table public.contract_tags enable row level security;

-- 3. Setup Policies for contracts
create policy "Users can view contracts in their organizations"
on public.contracts for select
to authenticated
using (
    exists (
        select 1 from public.organization_members
        where organization_members.organization_id = contracts.organization_id
        and organization_members.user_id = (select auth.uid())
    )
);

create policy "Users can insert contracts in their organizations"
on public.contracts for insert
to authenticated
with check (
    exists (
        select 1 from public.organization_members
        where organization_members.organization_id = contracts.organization_id
        and organization_members.user_id = (select auth.uid())
    )
);

create policy "Users can update contracts in their organizations"
on public.contracts for update
to authenticated
using (
    exists (
        select 1 from public.organization_members
        where organization_members.organization_id = contracts.organization_id
        and organization_members.user_id = (select auth.uid())
    )
);

create policy "Users can delete contracts in their organizations"
on public.contracts for delete
to authenticated
using (
    exists (
        select 1 from public.organization_members
        where organization_members.organization_id = contracts.organization_id
        and organization_members.user_id = (select auth.uid())
    )
);

-- Policies for contract_versions
create policy "Users can view contract versions in their organizations"
on public.contract_versions for select
to authenticated
using (
    exists (
        select 1 from public.contracts c
        join public.organization_members om on om.organization_id = c.organization_id
        where c.id = contract_versions.contract_id
        and om.user_id = (select auth.uid())
    )
);

create policy "Users can insert contract versions in their organizations"
on public.contract_versions for insert
to authenticated
with check (
    exists (
        select 1 from public.contracts c
        join public.organization_members om on om.organization_id = c.organization_id
        where c.id = contract_versions.contract_id
        and om.user_id = (select auth.uid())
    )
);

create policy "Users can delete contract versions in their organizations"
on public.contract_versions for delete
to authenticated
using (
    exists (
        select 1 from public.contracts c
        join public.organization_members om on om.organization_id = c.organization_id
        where c.id = contract_versions.contract_id
        and om.user_id = (select auth.uid())
    )
);

-- Policies for contract_tags
create policy "Users can view contract tags in their organizations"
on public.contract_tags for select
to authenticated
using (
    exists (
        select 1 from public.contracts c
        join public.organization_members om on om.organization_id = c.organization_id
        where c.id = contract_tags.contract_id
        and om.user_id = (select auth.uid())
    )
);

create policy "Users can insert contract tags in their organizations"
on public.contract_tags for insert
to authenticated
with check (
    exists (
        select 1 from public.contracts c
        join public.organization_members om on om.organization_id = c.organization_id
        where c.id = contract_tags.contract_id
        and om.user_id = (select auth.uid())
    )
);

create policy "Users can delete contract tags in their organizations"
on public.contract_tags for delete
to authenticated
using (
    exists (
        select 1 from public.contracts c
        join public.organization_members om on om.organization_id = c.organization_id
        where c.id = contract_tags.contract_id
        and om.user_id = (select auth.uid())
    )
);

-- 4. Setup Storage
insert into storage.buckets (id, name, public) 
values ('contracts', 'contracts', false);

-- Storage RLS
create policy "Users can upload contracts to their organization folder"
on storage.objects for insert
to authenticated
with check (
    bucket_id = 'contracts' and
    exists (
        select 1 from public.organization_members
        where organization_id::text = (string_to_array(name, '/'))[1]
        and user_id = (select auth.uid())
    )
);

create policy "Users can view contracts in their organization folder"
on storage.objects for select
to authenticated
using (
    bucket_id = 'contracts' and
    exists (
        select 1 from public.organization_members
        where organization_id::text = (string_to_array(name, '/'))[1]
        and user_id = (select auth.uid())
    )
);

create policy "Users can delete contracts in their organization folder"
on storage.objects for delete
to authenticated
using (
    bucket_id = 'contracts' and
    exists (
        select 1 from public.organization_members
        where organization_id::text = (string_to_array(name, '/'))[1]
        and user_id = (select auth.uid())
    )
);
