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
