-- MonetizeOS initial schema
-- Tables: users, websites, audits, recommendations, integrations, events
-- All tables use Row Level Security so a user can only ever see their own data.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- users: mirrors auth.users, holds plan/billing info
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  plan text not null default 'free' check (plan in ('free', 'pro', 'scale')),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_subscription_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- Auto-create a public.users row whenever someone signs up via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- websites
-- ---------------------------------------------------------------------------
create table if not exists public.websites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  url text not null,
  domain text not null,
  name text,
  description text,
  category text,
  site_key text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists websites_user_id_idx on public.websites(user_id);
create unique index if not exists websites_site_key_idx on public.websites(site_key);

alter table public.websites enable row level security;

create policy "websites_select_own" on public.websites
  for select using (auth.uid() = user_id);

create policy "websites_insert_own" on public.websites
  for insert with check (auth.uid() = user_id);

create policy "websites_update_own" on public.websites
  for update using (auth.uid() = user_id);

create policy "websites_delete_own" on public.websites
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- audits
-- ---------------------------------------------------------------------------
create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references public.websites(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'crawling', 'analyzing', 'completed', 'failed')),
  score integer check (score >= 0 and score <= 100),
  analysis jsonb not null default '{}'::jsonb,
  monetization_recommendation jsonb not null default '{}'::jsonb,
  estimated_low numeric,
  estimated_mid numeric,
  estimated_high numeric,
  estimated_currency text not null default 'EUR',
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists audits_website_id_idx on public.audits(website_id);

alter table public.audits enable row level security;

create policy "audits_select_own" on public.audits
  for select using (
    exists (select 1 from public.websites w where w.id = website_id and w.user_id = auth.uid())
  );

create policy "audits_insert_own" on public.audits
  for insert with check (
    exists (select 1 from public.websites w where w.id = website_id and w.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- recommendations
-- ---------------------------------------------------------------------------
create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits(id) on delete cascade,
  type text not null,
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  estimated_impact text check (estimated_impact in ('high', 'medium', 'low')),
  implementation_status text not null default 'not_started' check (implementation_status in ('not_started', 'in_progress', 'implemented', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists recommendations_audit_id_idx on public.recommendations(audit_id);

alter table public.recommendations enable row level security;

create policy "recommendations_select_own" on public.recommendations
  for select using (
    exists (
      select 1 from public.audits a
      join public.websites w on w.id = a.website_id
      where a.id = audit_id and w.user_id = auth.uid()
    )
  );

create policy "recommendations_update_own" on public.recommendations
  for update using (
    exists (
      select 1 from public.audits a
      join public.websites w on w.id = a.website_id
      where a.id = audit_id and w.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- integrations
-- ---------------------------------------------------------------------------
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references public.websites(id) on delete cascade,
  type text not null check (type in ('tracking_sdk', 'ads', 'affiliate')),
  status text not null default 'inactive' check (status in ('inactive', 'active', 'error')),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists integrations_website_id_idx on public.integrations(website_id);

alter table public.integrations enable row level security;

create policy "integrations_select_own" on public.integrations
  for select using (
    exists (select 1 from public.websites w where w.id = website_id and w.user_id = auth.uid())
  );

create policy "integrations_insert_own" on public.integrations
  for insert with check (
    exists (select 1 from public.websites w where w.id = website_id and w.user_id = auth.uid())
  );

create policy "integrations_update_own" on public.integrations
  for update using (
    exists (select 1 from public.websites w where w.id = website_id and w.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- events (tracking SDK writes only via service role from /api/events)
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references public.websites(id) on delete cascade,
  type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists events_website_id_idx on public.events(website_id);
create index if not exists events_created_at_idx on public.events(created_at);

alter table public.events enable row level security;

-- No public/anon policies: events are written exclusively by the server
-- (service role, which bypasses RLS) via the validated /api/events endpoint.
create policy "events_select_own" on public.events
  for select using (
    exists (select 1 from public.websites w where w.id = website_id and w.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- updated_at helper trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.users;
create trigger set_updated_at before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.websites;
create trigger set_updated_at before update on public.websites
  for each row execute function public.set_updated_at();
