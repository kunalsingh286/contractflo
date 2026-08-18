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
