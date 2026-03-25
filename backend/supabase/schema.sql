-- Run this in Supabase SQL Editor
-- It creates all tables used by the FastAPI backend.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('asha', 'mother', 'doctor')),
  name text,
  phone text,
  language text default 'hi'
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

create index if not exists idx_users_role on public.users(role);

create index if not exists idx_patients_asha_id on public.patients(asha_id);
create index if not exists idx_patients_mother_id on public.patients(mother_id);

create index if not exists idx_vitals_patient_id_recorded_at on public.vitals(patient_id, recorded_at desc);

create index if not exists idx_risk_assessments_patient_id_assessed_at on public.risk_assessments(patient_id, assessed_at desc);

create index if not exists idx_referrals_doctor_id_referred_at on public.referrals(doctor_id, referred_at desc);
create index if not exists idx_referrals_patient_id on public.referrals(patient_id);

-- Optional RLS setup.
-- If you keep all DB access through FastAPI service role, RLS can remain disabled.
-- If you plan to query directly from client apps, enable RLS and add policies.

alter table public.users enable row level security;
alter table public.patients enable row level security;
alter table public.vitals enable row level security;
alter table public.risk_assessments enable row level security;
alter table public.referrals enable row level security;

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

  insert into public.users (id, role, name, language)
  values (
    new.id,
    derived_role,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    coalesce(new.raw_user_meta_data->>'language', 'en')
  )
  on conflict (id) do update set
    role = excluded.role,
    name = coalesce(public.users.name, excluded.name),
    language = coalesce(public.users.language, excluded.language);

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
