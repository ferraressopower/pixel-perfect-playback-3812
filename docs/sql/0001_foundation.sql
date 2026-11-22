-- PANTERON — Fundação multi-tenant. Rodar no SQL Editor do seu Supabase externo.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, avatar_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create type public.workspace_role as enum ('owner','admin','member');
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- Security definer evita recursão de RLS
create or replace function public.is_workspace_member(_ws uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workspace_members where workspace_id = _ws and user_id = auth.uid());
$$;
create or replace function public.is_workspace_admin(_ws uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workspace_members where workspace_id = _ws and user_id = auth.uid() and role in ('owner','admin'));
$$;

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  plan text not null default 'free', status text not null default 'active',
  current_period_end timestamptz, created_at timestamptz not null default now()
);
create table public.lead_sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null, created_at timestamptz not null default now()
);
create table public.searches (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  query text not null, location text, filters jsonb not null default '{}',
  results_count integer not null default 0, created_at timestamptz not null default now()
);
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_id uuid references public.lead_sources(id) on delete set null,
  search_id uuid references public.searches(id) on delete set null,
  company_name text not null, segment text, city text, phone text, email text,
  website_url text, has_website boolean,
  status text not null default 'discovered' check (status in ('discovered','lead','client','lost')),
  monthly_value_cents integer not null default 0, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on public.leads (workspace_id, status);
create table public.lead_contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  name text not null, role text, phone text, email text,
  created_at timestamptz not null default now()
);
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  name text not null, status text not null default 'draft', due_date date,
  created_at timestamptz not null default now()
);
-- workspace_id nulo = modelo público da plataforma (somente leitura)
create table public.website_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null, segment text, content jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create table public.websites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  template_id uuid references public.website_templates(id) on delete set null,
  name text not null, domain text, status text not null default 'draft',
  created_at timestamptz not null default now()
);
create table public.website_pages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  slug text not null, title text, content jsonb not null default '{}',
  position integer not null default 0, created_at timestamptz not null default now(),
  unique (website_id, slug)
);
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null, status text not null default 'draft',
  created_at timestamptz not null default now()
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  channel text not null default 'email', direction text not null default 'outbound',
  body text not null, created_at timestamptz not null default now()
);
create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  kind text not null, prompt text, output jsonb,
  created_at timestamptz not null default now()
);
create table public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null, quantity integer not null default 1,
  created_at timestamptz not null default now()
);

-- Permissões da Data API (sem acesso anônimo)
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant execute on function public.is_workspace_member(uuid), public.is_workspace_admin(uuid) to authenticated;

-- RLS
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

alter table public.workspaces enable row level security;
create policy "members read workspace" on public.workspaces for select to authenticated using (public.is_workspace_member(id));
create policy "admins update workspace" on public.workspaces for update to authenticated using (public.is_workspace_admin(id));
create policy "owner deletes workspace" on public.workspaces for delete to authenticated using (owner_id = auth.uid());

alter table public.workspace_members enable row level security;
create policy "members read members" on public.workspace_members for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "admins manage members" on public.workspace_members for all to authenticated
  using (public.is_workspace_admin(workspace_id)) with check (public.is_workspace_admin(workspace_id));

-- Assinaturas: membros só leem; escrita apenas pelo backend (service_role)
alter table public.subscriptions enable row level security;
create policy "members read subscription" on public.subscriptions for select to authenticated using (public.is_workspace_member(workspace_id));

do $$ declare t text; begin
  foreach t in array array['lead_sources','searches','leads','lead_contacts','projects','websites',
    'website_pages','campaigns','messages','ai_generations'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "members all" on public.%I for all to authenticated
      using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id))', t);
  end loop;
end $$;

alter table public.usage_logs enable row level security;
create policy "members read usage" on public.usage_logs for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "members insert usage" on public.usage_logs for insert to authenticated with check (public.is_workspace_member(workspace_id));

alter table public.website_templates enable row level security;
create policy "read public or own templates" on public.website_templates for select to authenticated
  using (workspace_id is null or public.is_workspace_member(workspace_id));
create policy "manage own templates" on public.website_templates for all to authenticated
  using (workspace_id is not null and public.is_workspace_member(workspace_id))
  with check (workspace_id is not null and public.is_workspace_member(workspace_id));

-- Cadastro: cria perfil + workspace + membro owner + assinatura free
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare ws_id uuid;
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  insert into public.workspaces (name, owner_id)
    values (coalesce(nullif(new.raw_user_meta_data->>'workspace_name',''), 'Meu workspace'), new.id)
    returning id into ws_id;
  insert into public.workspace_members (workspace_id, user_id, role) values (ws_id, new.id, 'owner');
  insert into public.subscriptions (workspace_id) values (ws_id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
