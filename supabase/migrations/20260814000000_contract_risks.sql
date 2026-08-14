create table public.contract_risks (
    id uuid primary key default gen_random_uuid(),
    contract_id uuid references public.contracts(id) on delete cascade not null unique,

    risk_score integer not null
        check (risk_score >= 0 and risk_score <= 100),

    risk_level text not null
        check (risk_level in ('Low', 'Medium', 'High')),

    high_risks jsonb not null default '[]'::jsonb,
    medium_risks jsonb not null default '[]'::jsonb,
    missing_clauses jsonb not null default '[]'::jsonb,
    recommendations jsonb not null default '[]'::jsonb,

    model_name text,

    created_at timestamp with time zone
        default timezone('utc'::text, now()) not null,

    updated_at timestamp with time zone
        default timezone('utc'::text, now()) not null
);

create index idx_contract_risks_contract_id
    on public.contract_risks(contract_id);

create index idx_contract_risks_risk_level
    on public.contract_risks(risk_level);

alter table public.contract_risks enable row level security;

create policy "Users can view risks in their organizations"
on public.contract_risks for select
to authenticated
using (
    exists (
        select 1
        from public.contracts c
        join public.organization_members om
            on om.organization_id = c.organization_id
        where c.id = contract_risks.contract_id
        and om.user_id = (select auth.uid())
    )
);

create policy "Users can insert risks in their organizations"
on public.contract_risks for insert
to authenticated
with check (
    exists (
        select 1
        from public.contracts c
        join public.organization_members om
            on om.organization_id = c.organization_id
        where c.id = contract_risks.contract_id
        and om.user_id = (select auth.uid())
    )
);

create policy "Users can update risks in their organizations"
on public.contract_risks for update
to authenticated
using (
    exists (
        select 1
        from public.contracts c
        join public.organization_members om
            on om.organization_id = c.organization_id
        where c.id = contract_risks.contract_id
        and om.user_id = (select auth.uid())
    )
)
with check (
    exists (
        select 1
        from public.contracts c
        join public.organization_members om
            on om.organization_id = c.organization_id
        where c.id = contract_risks.contract_id
        and om.user_id = (select auth.uid())
    )
);
