create table public.obligations (
    id uuid primary key default gen_random_uuid(),
    contract_id uuid references public.contracts(id) on delete cascade not null unique,
    deliverables jsonb,
    payment_obligations jsonb,
    notice_periods jsonb,
    reporting_requirements jsonb,
    renewal_obligations jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.obligations enable row level security;

create policy "Users can view obligations in their organizations"
on public.obligations for select
to authenticated
using (
    exists (
        select 1 from public.contracts c
        join public.organization_members om on om.organization_id = c.organization_id
        where c.id = obligations.contract_id
        and om.user_id = (select auth.uid())
    )
);

create policy "Users can insert obligations in their organizations"
on public.obligations for insert
to authenticated
with check (
    exists (
        select 1 from public.contracts c
        join public.organization_members om on om.organization_id = c.organization_id
        where c.id = obligations.contract_id
        and om.user_id = (select auth.uid())
    )
);

create policy "Users can update obligations in their organizations"
on public.obligations for update
to authenticated
using (
    exists (
        select 1 from public.contracts c
        join public.organization_members om on om.organization_id = c.organization_id
        where c.id = obligations.contract_id
        and om.user_id = (select auth.uid())
    )
)
with check (
    exists (
        select 1 from public.contracts c
        join public.organization_members om on om.organization_id = c.organization_id
        where c.id = obligations.contract_id
        and om.user_id = (select auth.uid())
    )
);