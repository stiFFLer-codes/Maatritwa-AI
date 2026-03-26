-- Migration: identity cleanup + role profile tables + constraints and policies.
-- Run after 001_precheck_identity_profiles.sql has been reviewed.

begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.users add column if not exists email text;
alter table public.users add column if not exists created_at timestamptz not null default now();
alter table public.users add column if not exists updated_at timestamptz not null default now();
alter table public.users drop column if exists language;

update public.users u
set email = au.email
from auth.users au
where au.id = u.id
  and (u.email is null or btrim(u.email) = '');

update public.users
set name = null
where name ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'users_name_not_email'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_name_not_email
      check (name is null or name !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$');
  end if;
end;
$$;

create unique index if not exists idx_users_email_unique
  on public.users (lower(email))
  where email is not null;

create index if not exists idx_users_updated_at
  on public.users(updated_at desc);

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create table if not exists public.asha_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  area_name text,
  worker_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_asha_profiles_worker_code
  on public.asha_profiles(worker_code)
  where worker_code is not null;

drop trigger if exists asha_profiles_set_updated_at on public.asha_profiles;
create trigger asha_profiles_set_updated_at
before update on public.asha_profiles
for each row execute function public.set_updated_at();

create table if not exists public.mother_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists mother_profiles_set_updated_at on public.mother_profiles;
create trigger mother_profiles_set_updated_at
before update on public.mother_profiles
for each row execute function public.set_updated_at();

create table if not exists public.doctor_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  specialization text,
  facility_name text,
  registration_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_doctor_profiles_registration_number
  on public.doctor_profiles(registration_number)
  where registration_number is not null;

drop trigger if exists doctor_profiles_set_updated_at on public.doctor_profiles;
create trigger doctor_profiles_set_updated_at
before update on public.doctor_profiles
for each row execute function public.set_updated_at();

insert into public.asha_profiles (user_id)
select u.id
from public.users u
where u.role = 'asha'
  and not exists (
    select 1 from public.asha_profiles ap where ap.user_id = u.id
  );

insert into public.mother_profiles (user_id)
select u.id
from public.users u
where u.role = 'mother'
  and not exists (
    select 1 from public.mother_profiles mp where mp.user_id = u.id
  );

insert into public.doctor_profiles (user_id)
select u.id
from public.users u
where u.role = 'doctor'
  and not exists (
    select 1 from public.doctor_profiles dp where dp.user_id = u.id
  );

update public.patients set village = 'Unknown' where village is null;
alter table public.patients alter column village set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'vitals_bp_sys_range'
      and conrelid = 'public.vitals'::regclass
  ) then
    alter table public.vitals
      add constraint vitals_bp_sys_range
      check (blood_pressure_sys >= 70 and blood_pressure_sys <= 240);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'vitals_bp_dia_range'
      and conrelid = 'public.vitals'::regclass
  ) then
    alter table public.vitals
      add constraint vitals_bp_dia_range
      check (blood_pressure_dia >= 40 and blood_pressure_dia <= 140);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'vitals_hemoglobin_range'
      and conrelid = 'public.vitals'::regclass
  ) then
    alter table public.vitals
      add constraint vitals_hemoglobin_range
      check (hemoglobin >= 3 and hemoglobin <= 25);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'vitals_weight_range'
      and conrelid = 'public.vitals'::regclass
  ) then
    alter table public.vitals
      add constraint vitals_weight_range
      check (weight_kg >= 25 and weight_kg <= 250);
  end if;
end;
$$;

update public.referrals
set resolved_at = now()
where status = 'resolved' and resolved_at is null;

update public.referrals
set resolved_at = null
where status <> 'resolved' and resolved_at is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'referrals_resolved_state_consistency'
      and conrelid = 'public.referrals'::regclass
  ) then
    alter table public.referrals
      add constraint referrals_resolved_state_consistency
      check (
        (status = 'resolved' and resolved_at is not null)
        or (status <> 'resolved' and resolved_at is null)
      );
  end if;
end;
$$;

create index if not exists idx_referrals_status_referred_at
  on public.referrals(status, referred_at desc);

alter table public.asha_profiles enable row level security;
alter table public.mother_profiles enable row level security;
alter table public.doctor_profiles enable row level security;

drop policy if exists asha_profiles_select_own on public.asha_profiles;
create policy asha_profiles_select_own on public.asha_profiles
  for select using (user_id = auth.uid());

drop policy if exists asha_profiles_insert_own on public.asha_profiles;
create policy asha_profiles_insert_own on public.asha_profiles
  for insert with check (user_id = auth.uid());

drop policy if exists asha_profiles_update_own on public.asha_profiles;
create policy asha_profiles_update_own on public.asha_profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists mother_profiles_select_own on public.mother_profiles;
create policy mother_profiles_select_own on public.mother_profiles
  for select using (user_id = auth.uid());

drop policy if exists mother_profiles_insert_own on public.mother_profiles;
create policy mother_profiles_insert_own on public.mother_profiles
  for insert with check (user_id = auth.uid());

drop policy if exists mother_profiles_update_own on public.mother_profiles;
create policy mother_profiles_update_own on public.mother_profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists doctor_profiles_select_own on public.doctor_profiles;
create policy doctor_profiles_select_own on public.doctor_profiles
  for select using (user_id = auth.uid());

drop policy if exists doctor_profiles_insert_own on public.doctor_profiles;
create policy doctor_profiles_insert_own on public.doctor_profiles
  for insert with check (user_id = auth.uid());

drop policy if exists doctor_profiles_update_own on public.doctor_profiles;
create policy doctor_profiles_update_own on public.doctor_profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  derived_role text;
begin
  derived_role := coalesce(new.raw_user_meta_data->>'role', new.raw_app_meta_data->>'role');

  if derived_role not in ('asha', 'mother', 'doctor') then
    derived_role := 'mother';
  end if;

  insert into public.users (id, role, name, email, phone)
  values (
    new.id,
    derived_role,
    nullif(new.raw_user_meta_data->>'name', ''),
    new.email,
    nullif(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do update set
    role = excluded.role,
    email = coalesce(public.users.email, excluded.email),
    name = coalesce(public.users.name, excluded.name),
    phone = coalesce(public.users.phone, excluded.phone);

  if derived_role = 'asha' then
    insert into public.asha_profiles (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  elsif derived_role = 'mother' then
    insert into public.mother_profiles (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  elsif derived_role = 'doctor' then
    insert into public.doctor_profiles (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_auth_user_created();

commit;
