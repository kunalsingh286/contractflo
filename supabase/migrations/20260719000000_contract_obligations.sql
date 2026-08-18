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
