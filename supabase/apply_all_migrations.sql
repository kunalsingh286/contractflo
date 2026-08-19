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
-- 1. Create tables
create table public.contract_documents (
    id uuid primary key default gen_random_uuid(),
    contract_id uuid references public.contracts(id) on delete cascade not null,
    version_id uuid references public.contract_versions(id) on delete set null,
    extracted_text text,
    extraction_status text not null check (extraction_status in ('pending', 'processing', 'completed', 'failed', 'requires_ocr')),
    extraction_error text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.contract_intelligence (
    id uuid primary key default gen_random_uuid(),
    contract_id uuid references public.contracts(id) on delete cascade not null,
    contract_document_id uuid references public.contract_documents(id) on delete cascade not null,
    contract_type text,
    parties jsonb,
    effective_date date,
    expiration_date date,
    renewal_date date,
    payment_terms text,
    confidence jsonb,
    raw_response jsonb,
    model_name text,
    analyzed_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(contract_id) -- Assuming one intelligence record per contract for V1
);

-- 2. Enable RLS
alter table public.contract_documents enable row level security;
alter table public.contract_intelligence enable row level security;

-- 3. Setup Policies for contract_documents
create policy "Users can view contract documents in their organizations"
on public.contract_documents for select
to authenticated
using (
    exists (
        select 1 from public.contracts c
        join public.organization_members om on om.organization_id = c.organization_id
        where c.id = contract_documents.contract_id
        and om.user_id = (select auth.uid())
    )
);

create policy "Users can insert contract documents in their organizations"
on public.contract_documents for insert
to authenticated
with check (
    exists (
        select 1 from public.contracts c
        join public.organization_members om on om.organization_id = c.organization_id
        where c.id = contract_documents.contract_id
        and om.user_id = (select auth.uid())
    )
);

create policy "Users can update contract documents in their organizations"
on public.contract_documents for update
to authenticated
using (
    exists (
        select 1 from public.contracts c
        join public.organization_members om on om.organization_id = c.organization_id
        where c.id = contract_documents.contract_id
        and om.user_id = (select auth.uid())
    )
);

create policy "Users can delete contract documents in their organizations"
on public.contract_documents for delete
to authenticated
using (
    exists (
        select 1 from public.contracts c
        join public.organization_members om on om.organization_id = c.organization_id
        where c.id = contract_documents.contract_id
        and om.user_id = (select auth.uid())
    )
);

-- Policies for contract_intelligence
create policy "Users can view contract intelligence in their organizations"
on public.contract_intelligence for select
to authenticated
using (
    exists (
        select 1 from public.contracts c
        join public.organization_members om on om.organization_id = c.organization_id
        where c.id = contract_intelligence.contract_id
        and om.user_id = (select auth.uid())
    )
);

create policy "Users can insert contract intelligence in their organizations"
on public.contract_intelligence for insert
to authenticated
with check (
    exists (
        select 1 from public.contracts c
        join public.organization_members om on om.organization_id = c.organization_id
        where c.id = contract_intelligence.contract_id
        and om.user_id = (select auth.uid())
    )
);

create policy "Users can update contract intelligence in their organizations"
on public.contract_intelligence for update
to authenticated
using (
    exists (
        select 1 from public.contracts c
        join public.organization_members om on om.organization_id = c.organization_id
        where c.id = contract_intelligence.contract_id
        and om.user_id = (select auth.uid())
    )
);

create policy "Users can delete contract intelligence in their organizations"
on public.contract_intelligence for delete
to authenticated
using (
    exists (
        select 1 from public.contracts c
        join public.organization_members om on om.organization_id = c.organization_id
        where c.id = contract_intelligence.contract_id
        and om.user_id = (select auth.uid())
    )
);
-- 1. Create table
create table public.contract_risks (
    id uuid primary key default gen_random_uuid(),
    contract_id uuid references public.contracts(id) on delete cascade not null,
    contract_document_id uuid references public.contract_documents(id) on delete cascade,
    contract_intelligence_id uuid references public.contract_intelligence(id) on delete set null,
    risk_score integer,
    risk_level text check (risk_level in ('Low', 'Medium', 'High', 'Critical')),
    findings jsonb,
    missing_clauses jsonb,
    recommendations jsonb,
    model_name text,
    analysis_version text,
    analyzed_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(contract_id) -- Only one active risk assessment per contract for V1
);

-- 2. Enable RLS
alter table public.contract_risks enable row level security;

-- 3. Setup Policies for contract_risks
create policy "Users can view contract risks in their organizations"
on public.contract_risks for select
to authenticated
using (
    exists (
        select 1 from public.contracts c
        join public.organization_members om on om.organization_id = c.organization_id
        where c.id = contract_risks.contract_id
        and om.user_id = (select auth.uid())
    )
);

create policy "Users can insert contract risks in their organizations"
on public.contract_risks for insert
to authenticated
with check (
    exists (
        select 1 from public.contracts c
        join public.organization_members om on om.organization_id = c.organization_id
        where c.id = contract_risks.contract_id
        and om.user_id = (select auth.uid())
    )
);

create policy "Users can update contract risks in their organizations"
on public.contract_risks for update
to authenticated
using (
    exists (
        select 1 from public.contracts c
        join public.organization_members om on om.organization_id = c.organization_id
        where c.id = contract_risks.contract_id
        and om.user_id = (select auth.uid())
    )
);

create policy "Users can delete contract risks in their organizations"
on public.contract_risks for delete
to authenticated
using (
    exists (
        select 1 from public.contracts c
        join public.organization_members om on om.organization_id = c.organization_id
        where c.id = contract_risks.contract_id
        and om.user_id = (select auth.uid())
    )
);
-- 1. Create table
create table public.obligations (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete cascade not null,
    contract_id uuid references public.contracts(id) on delete cascade not null,
    contract_document_id uuid references public.contract_documents(id) on delete cascade,
    contract_intelligence_id uuid references public.contract_intelligence(id) on delete set null,
    
    type text not null check (type in ('deliverable', 'payment', 'notice', 'reporting', 'renewal')),
    title text not null,
    description text not null,
    
    responsible_party text,
    counterparty text,
    
    due_date date,
    due_date_type text not null check (due_date_type in ('exact', 'relative', 'recurring', 'event_based', 'not_specified')),
    due_date_expression text,
    
    recurrence text,
    notice_period_days integer,
    
    status text not null default 'open' check (status in ('open', 'completed', 'overdue', 'cancelled')),
    
    source_clause text,
    evidence text not null,
    
    confidence numeric,
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add tracking columns to contract_documents
alter table public.contract_documents add column obligation_extraction_status text default 'none';
alter table public.contract_documents add column obligation_extraction_error text;

-- Index for faster filtering in the Obligation Center
create index idx_obligations_org_id on public.obligations(organization_id);
create index idx_obligations_contract_id on public.obligations(contract_id);
create index idx_obligations_status on public.obligations(status);
create index idx_obligations_due_date on public.obligations(due_date);

-- 2. Enable RLS
alter table public.obligations enable row level security;

-- 3. Setup Policies for obligations
create policy "Users can view obligations in their organizations"
on public.obligations for select
to authenticated
using (
    organization_id in (
        select organization_id from public.organization_members
        where user_id = (select auth.uid())
    )
);

create policy "Users can insert obligations in their organizations"
on public.obligations for insert
to authenticated
with check (
    organization_id in (
        select organization_id from public.organization_members
        where user_id = (select auth.uid())
    )
);

create policy "Users can update obligations in their organizations"
on public.obligations for update
to authenticated
using (
    organization_id in (
        select organization_id from public.organization_members
        where user_id = (select auth.uid())
    )
);

create policy "Users can delete obligations in their organizations"
on public.obligations for delete
to authenticated
using (
    organization_id in (
        select organization_id from public.organization_members
        where user_id = (select auth.uid())
    )
);
-- 1. Create tables
create table public.contract_chat_sessions (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete cascade not null,
    contract_id uuid references public.contracts(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.contract_chat_messages (
    id uuid primary key default gen_random_uuid(),
    session_id uuid references public.contract_chat_sessions(id) on delete cascade not null,
    role text not null check (role in ('user', 'assistant')),
    content text not null,
    citations jsonb,
    retrieval_metadata jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for faster filtering
create index idx_contract_chat_sessions_org on public.contract_chat_sessions(organization_id);
create index idx_contract_chat_sessions_contract on public.contract_chat_sessions(contract_id);
create index idx_contract_chat_messages_session on public.contract_chat_messages(session_id);
create index idx_contract_chat_messages_created on public.contract_chat_messages(created_at);

-- 2. Enable RLS
alter table public.contract_chat_sessions enable row level security;
alter table public.contract_chat_messages enable row level security;

-- 3. Setup Policies for contract_chat_sessions
create policy "Users can view chat sessions in their organizations"
on public.contract_chat_sessions for select
to authenticated
using (
    organization_id in (
        select organization_id from public.organization_members
        where user_id = (select auth.uid())
    )
);

create policy "Users can insert chat sessions in their organizations"
on public.contract_chat_sessions for insert
to authenticated
with check (
    organization_id in (
        select organization_id from public.organization_members
        where user_id = (select auth.uid())
    )
);

create policy "Users can delete chat sessions in their organizations"
on public.contract_chat_sessions for delete
to authenticated
using (
    organization_id in (
        select organization_id from public.organization_members
        where user_id = (select auth.uid())
    )
);

-- 4. Setup Policies for contract_chat_messages
-- We can simplify message policies by joining the session table
create policy "Users can view chat messages in their organizations"
on public.contract_chat_messages for select
to authenticated
using (
    session_id in (
        select id from public.contract_chat_sessions
        where organization_id in (
            select organization_id from public.organization_members
            where user_id = (select auth.uid())
        )
    )
);

create policy "Users can insert chat messages in their organizations"
on public.contract_chat_messages for insert
to authenticated
with check (
    session_id in (
        select id from public.contract_chat_sessions
        where organization_id in (
            select organization_id from public.organization_members
            where user_id = (select auth.uid())
        )
    )
);
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
