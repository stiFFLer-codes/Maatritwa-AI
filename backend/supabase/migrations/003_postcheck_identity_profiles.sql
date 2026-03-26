-- Post-check for identity/profile migration.
-- Run after 002_migrate_identity_profiles.sql.

select now() as checked_at;

-- Core user health checks.
select count(*) as users_missing_email
from public.users
where email is null or btrim(email) = '';

select count(*) as users_name_still_email_like
from public.users
where name ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$';

-- Required role-profile presence checks.
select
  (select count(*) from public.users where role = 'asha') as asha_users,
  (select count(*) from public.asha_profiles) as asha_profiles,
  (select count(*) from public.users where role = 'mother') as mother_users,
  (select count(*) from public.mother_profiles) as mother_profiles,
  (select count(*) from public.users where role = 'doctor') as doctor_users,
  (select count(*) from public.doctor_profiles) as doctor_profiles;

-- Broken user/profile links (should be 0 in each query).
select count(*) as asha_profile_orphans
from public.asha_profiles ap
left join public.users u on u.id = ap.user_id
where u.id is null;

select count(*) as mother_profile_orphans
from public.mother_profiles mp
left join public.users u on u.id = mp.user_id
where u.id is null;

select count(*) as doctor_profile_orphans
from public.doctor_profiles dp
left join public.users u on u.id = dp.user_id
where u.id is null;

-- Constraint compliance checks.
select count(*) as vitals_out_of_range
from public.vitals
where blood_pressure_sys not between 70 and 240
   or blood_pressure_dia not between 40 and 140
   or hemoglobin not between 3 and 25
   or weight_kg not between 25 and 250;

select count(*) as referrals_bad_resolution_state
from public.referrals
where (status = 'resolved' and resolved_at is null)
   or (status <> 'resolved' and resolved_at is not null);

select count(*) as patients_missing_village
from public.patients
where village is null;
