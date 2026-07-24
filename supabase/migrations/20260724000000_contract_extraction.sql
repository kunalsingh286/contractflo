create table public.contract_extractions (
    id uuid primary key default gen_random_uuid(),
    contract_id uuid references public.contracts(id) on delete cascade not null unique,
    contract_type text,
    parties jsonb,
    payment_terms jsonb,
    key_dates jsonb,
    clauses jsonb,
    summary text,
    raw_extraction jsonb,
    model_name text,
    processing_time_ms integer,
    token_usage jsonb,
    extraction_status text not null default 'pending' check (extraction_status in ('pending', 'processing', 'completed', 'failed')),
    extraction_error text,
    extracted_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.contract_extractions enable row level security;

create policy "Users can view extractions in their organizations"
on public.contract_extractions for select
to authenticated
using (
    exists (
        select 1 from public.contracts c
        join public.organization_members om on om.organization_id = c.organization_id
        where c.id = contract_extractions.contract_id
        and om.user_id = (select auth.uid())
    )
);

create policy "Users can insert extractions in their organizations"
on public.contract_extractions for insert
to authenticated
with check (
    exists (
        select 1 from public.contracts c
        join public.organization_members om on om.organization_id = c.organization_id
        where c.id = contract_extractions.contract_id
        and om.user_id = (select auth.uid())
    )
);

create policy "Users can update extractions in their organizations"
on public.contract_extractions for update
to authenticated
using (
    exists (
        select 1 from public.contracts c
        join public.organization_members om on om.organization_id = c.organization_id
        where c.id = contract_extractions.contract_id
        and om.user_id = (select auth.uid())
    )
);