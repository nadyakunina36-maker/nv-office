create table if not exists public.nv_workspace_state (
  id text primary key,
  owner_id uuid references auth.users(id) on delete restrict,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.nv_workspace_state enable row level security;
revoke all on table public.nv_workspace_state from anon, authenticated;
grant select, insert, update on table public.nv_workspace_state to authenticated;

create policy "workspace owner can read or claim"
on public.nv_workspace_state for select to authenticated
using (owner_id is null or owner_id = (select auth.uid()));

create policy "workspace owner can insert"
on public.nv_workspace_state for insert to authenticated
with check (owner_id = (select auth.uid()));

create policy "workspace owner can claim or update"
on public.nv_workspace_state for update to authenticated
using (owner_id is null or owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create index if not exists nv_workspace_state_owner_idx
on public.nv_workspace_state(owner_id);

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
revoke all on table public.nv_clients, public.nv_signatures, public.nv_tasks,
  public.nv_client_team, public.nv_client_accesses, public.nv_client_checklist
  from anon, authenticated;
