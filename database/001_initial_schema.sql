-- NV Office: начальная схема Supabase
-- Запускать только после проверки в SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('director','senior_accountant','accountant','payroll_accountant')),
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  short_name text not null,
  full_name text,
  inn text,
  tax_system text,
  activity_type text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.client_access (
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  access_role text not null default 'accountant',
  primary key (client_id,user_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  description text,
  priority text not null default 'normal' check (priority in ('critical','high','normal','deferred')),
  status text not null default 'new' check (status in ('new','in_progress','waiting','review','done','cancelled')),
  due_at timestamptz,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.rules (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  rule_type text not null,
  title text not null,
  base_date date,
  recurrence text,
  shift_policy text,
  reminder_days integer[] default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.client_access enable row level security;
alter table public.tasks enable row level security;
alter table public.rules enable row level security;

-- Политики будут добавлены отдельной миграцией после создания первого руководителя.
