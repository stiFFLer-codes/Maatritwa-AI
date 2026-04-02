-- Run this in Supabase SQL Editor
-- It creates all tables used by the FastAPI backend.

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

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('asha', 'mother', 'doctor')),
  name text,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create index if not exists idx_users_updated_at on public.users(updated_at desc);

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

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  asha_id uuid not null references public.users(id) on delete restrict,
  mother_id uuid references public.users(id) on delete set null,
  name text not null,
  age integer not null check (age >= 10 and age <= 60),
  weeks_pregnant integer not null check (weeks_pregnant >= 1 and weeks_pregnant <= 45),
  village text,
  created_at timestamptz not null default now()
);

update public.patients set village = 'Unknown' where village is null;
alter table public.patients alter column village set not null;

create table if not exists public.vitals (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  blood_pressure_sys integer not null,
  blood_pressure_dia integer not null,
  hemoglobin numeric(4,1) not null,
  weight_kg numeric(5,2) not null,
  symptoms text,
  recorded_at timestamptz not null default now()
);

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

create table if not exists public.risk_assessments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  vitals_id uuid references public.vitals(id) on delete set null,
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  risk_score numeric(5,4) not null check (risk_score >= 0 and risk_score <= 1),
  flags text[] not null default '{}',
  model_version text not null,
  assessed_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  asha_id uuid not null references public.users(id) on delete restrict,
  doctor_id uuid not null references public.users(id) on delete restrict,
  assessment_id uuid references public.risk_assessments(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'resolved')),
  notes text,
  referred_at timestamptz not null default now(),
  resolved_at timestamptz
);

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

-- Lab panel entered by the doctor after a referral arrives. Queried by
-- backend/app/routers/doctor.py and read by migrations/004_create_views.sql.
-- Column list matches ClinicalLabsInfo / PatientLabsUpsertRequest in that router.
create table if not exists public.clinical_labs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  sgot numeric(8,2),
  sgpt numeric(8,2),
  platelet_count numeric(8,2),
  serum_creatinine numeric(6,2),
  proteinuria text,
  edema text,
  epigastric_pain boolean,
  seizures boolean,
  recorded_at timestamptz not null default now()
);

create index if not exists idx_users_role on public.users(role);

create index if not exists idx_clinical_labs_patient_id_recorded_at
  on public.clinical_labs(patient_id, recorded_at desc);

create index if not exists idx_patients_asha_id on public.patients(asha_id);
create index if not exists idx_patients_mother_id on public.patients(mother_id);

create index if not exists idx_vitals_patient_id_recorded_at on public.vitals(patient_id, recorded_at desc);

create index if not exists idx_risk_assessments_patient_id_assessed_at on public.risk_assessments(patient_id, assessed_at desc);

create index if not exists idx_referrals_doctor_id_referred_at on public.referrals(doctor_id, referred_at desc);
create index if not exists idx_referrals_patient_id on public.referrals(patient_id);
create index if not exists idx_referrals_status_referred_at on public.referrals(status, referred_at desc);

-- Optional RLS setup.
-- If you keep all DB access through FastAPI service role, RLS can remain disabled.
-- If you plan to query directly from client apps, enable RLS and add policies.

alter table public.users enable row level security;
alter table public.patients enable row level security;
alter table public.vitals enable row level security;
alter table public.risk_assessments enable row level security;
alter table public.referrals enable row level security;
alter table public.clinical_labs enable row level security;
alter table public.asha_profiles enable row level security;
alter table public.mother_profiles enable row level security;
alter table public.doctor_profiles enable row level security;

-- Users can read/update their own profile row.
drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
  for select using (id = auth.uid());

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists users_insert_own on public.users;
create policy users_insert_own on public.users
  for insert with check (id = auth.uid());

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

-- Auto-create profile row for every new Auth signup.
-- This avoids relying on frontend onboarding timing.
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

-- ASHA can access own patients.
drop policy if exists patients_asha_select on public.patients;
create policy patients_asha_select on public.patients
  for select using (asha_id = auth.uid());

drop policy if exists patients_asha_insert on public.patients;
create policy patients_asha_insert on public.patients
  for insert with check (asha_id = auth.uid());

-- Mother can view her own patient profile.
drop policy if exists patients_mother_select on public.patients;
create policy patients_mother_select on public.patients
  for select using (mother_id = auth.uid());

-- ASHA and mother can read vitals via patient linkage.
drop policy if exists vitals_read_by_patient_owner on public.vitals;
create policy vitals_read_by_patient_owner on public.vitals
  for select using (
    exists (
      select 1 from public.patients p
      where p.id = vitals.patient_id
        and (p.asha_id = auth.uid() or p.mother_id = auth.uid())
    )
  );

-- ASHA can insert vitals for own patients.
drop policy if exists vitals_insert_by_asha on public.vitals;
create policy vitals_insert_by_asha on public.vitals
  for insert with check (
    exists (
      select 1 from public.patients p
      where p.id = vitals.patient_id
        and p.asha_id = auth.uid()
    )
  );

-- Risk assessments readable by ASHA, mother, and assigned doctor via referral.
drop policy if exists risk_assessments_select_role_scoped on public.risk_assessments;
create policy risk_assessments_select_role_scoped on public.risk_assessments
  for select using (
    exists (
      select 1 from public.patients p
      where p.id = risk_assessments.patient_id
        and (p.asha_id = auth.uid() or p.mother_id = auth.uid())
    )
    or exists (
      select 1 from public.referrals r
      where r.assessment_id = risk_assessments.id
        and r.doctor_id = auth.uid()
    )
  );

-- Referrals readable by ASHA (creator) and doctor (assignee).
drop policy if exists referrals_select_by_role on public.referrals;
create policy referrals_select_by_role on public.referrals
  for select using (asha_id = auth.uid() or doctor_id = auth.uid());

-- Doctor can update own referral status/notes.
drop policy if exists referrals_doctor_update on public.referrals;
create policy referrals_doctor_update on public.referrals
  for update using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
