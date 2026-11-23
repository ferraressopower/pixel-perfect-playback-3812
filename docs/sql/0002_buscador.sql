-- PANTERON — Etapa 2: Buscador de empresas. Migração ADITIVA (nada é apagado).
-- Rodar no SQL Editor do seu Supabase externo, depois do 0001.

-- 1. Novos campos em leads
alter table public.leads
  add column if not exists country text default 'Brasil',
  add column if not exists state text,
  add column if not exists neighborhood text,
  add column if not exists address text,
  add column if not exists description text,
  add column if not exists source text,
  add column if not exists source_url text,
  add column if not exists website_status text not null default 'unverified',
  add column if not exists raw_data jsonb,
  add column if not exists normalized_name text,
  add column if not exists normalized_phone text,
  add column if not exists normalized_domain text,
  add column if not exists saved_to_crm boolean not null default false,
  add column if not exists created_by uuid references auth.users(id) on delete set null default auth.uid();

alter table public.leads drop constraint if exists leads_website_status_check;
alter table public.leads add constraint leads_website_status_check
  check (website_status in ('has_site','confirmed_none','not_informed','unverified'));

-- 2. Novos status comerciais (converte os antigos)
alter table public.leads drop constraint if exists leads_status_check;
update public.leads set status = case status
  when 'discovered' then 'novo' when 'lead' then 'nao_contatado'
  when 'client' then 'cliente' when 'lost' then 'sem_interesse' else status end;
alter table public.leads alter column status set default 'novo';
alter table public.leads add constraint leads_status_check
  check (status in ('novo','nao_contatado','contatado','negociacao','cliente','sem_interesse'));

-- 3. Índices para detectar duplicidades (não bloqueiam nada)
create index if not exists leads_ws_norm_name on public.leads (workspace_id, normalized_name);
create index if not exists leads_ws_norm_phone on public.leads (workspace_id, normalized_phone);
create index if not exists leads_ws_norm_domain on public.leads (workspace_id, normalized_domain);
create index if not exists leads_ws_created on public.leads (workspace_id, created_at desc);

-- 4. Histórico de alterações
create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  kind text not null,
  changes jsonb not null default '{}',
  created_at timestamptz not null default now()
);
grant select on public.lead_events to authenticated;
grant all on public.lead_events to service_role;
alter table public.lead_events enable row level security;
create policy "members read lead events" on public.lead_events for select to authenticated
  using (public.is_workspace_member(workspace_id));

create or replace function public.log_lead_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare diff jsonb := '{}'; k text;
begin
  new.updated_at := now();
  if tg_op = 'INSERT' then
    insert into public.lead_events (workspace_id, lead_id, user_id, kind)
      values (new.workspace_id, new.id, auth.uid(), 'created');
    return new;
  end if;
  if new.workspace_id <> old.workspace_id then raise exception 'workspace_id não pode mudar'; end if;
  for k in select jsonb_object_keys(to_jsonb(new)) loop
    if k not in ('updated_at','raw_data') and (to_jsonb(new)->k) is distinct from (to_jsonb(old)->k) then
      diff := diff || jsonb_build_object(k, jsonb_build_object('de', to_jsonb(old)->k, 'para', to_jsonb(new)->k));
    end if;
  end loop;
  if diff <> '{}' then
    insert into public.lead_events (workspace_id, lead_id, user_id, kind, changes)
      values (new.workspace_id, new.id, auth.uid(), 'updated', diff);
  end if;
  return new;
end $$;
drop trigger if exists leads_log_update on public.leads;
create trigger leads_log_update before update on public.leads for each row execute function public.log_lead_change();
drop trigger if exists leads_log_insert on public.leads;
create trigger leads_log_insert after insert on public.leads for each row execute function public.log_lead_change();

-- 5. Pesquisas: fonte, status e autor; cada um exclui só as próprias
alter table public.searches
  add column if not exists source text not null default 'workspace',
  add column if not exists status text not null default 'completed';
alter table public.searches alter column created_by set default auth.uid();
drop policy if exists "members all" on public.searches;
create policy "members read searches" on public.searches for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "members insert searches" on public.searches for insert to authenticated
  with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());
create policy "own delete searches" on public.searches for delete to authenticated
  using (public.is_workspace_member(workspace_id) and created_by = auth.uid());

-- 6. Registro de importações CSV
create table if not exists public.csv_imports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  file_name text not null,
  total_rows integer not null default 0, imported integer not null default 0,
  duplicates integer not null default 0, invalid integer not null default 0, ignored integer not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert on public.csv_imports to authenticated;
grant all on public.csv_imports to service_role;
alter table public.csv_imports enable row level security;
create policy "members read imports" on public.csv_imports for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "members insert imports" on public.csv_imports for insert to authenticated with check (public.is_workspace_member(workspace_id));
