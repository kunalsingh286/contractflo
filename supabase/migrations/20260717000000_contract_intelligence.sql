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
