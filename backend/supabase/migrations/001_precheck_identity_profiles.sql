-- Pre-check for identity/profile schema migration.
-- Run this first and review the result sets before applying migration 002.

select now() as checked_at;

-- Rows with a users record but missing auth record (should be 0).
select count(*) as users_missing_auth_user
from public.users u
left join auth.users au on au.id = u.id
where au.id is null;

-- Rows that will require email backfill from auth.users.
select count(*) as users_missing_email
from public.users u
left join auth.users au on au.id = u.id
where (
      (to_jsonb(u) ? 'email')
      and ((to_jsonb(u)->>'email') is null or btrim(to_jsonb(u)->>'email') = '')
   )
   or (
      not (to_jsonb(u) ? 'email')
      and (au.email is null or btrim(au.email) = '')
   );

-- Rows where name currently looks like an email (will be nulled by migration).
select count(*) as users_name_looks_like_email
from public.users
where name ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$';

-- Duplicate email values in auth.users (case-insensitive) can block unique index creation.
select lower(email) as normalized_email, count(*) as duplicate_count
from auth.users
where email is not null and btrim(email) <> ''
group by lower(email)
having count(*) > 1
order by duplicate_count desc, normalized_email;

-- Candidate values that violate upcoming vitals range constraints.
select count(*) as vitals_out_of_new_range
from public.vitals
where blood_pressure_sys not between 70 and 240
   or blood_pressure_dia not between 40 and 140
   or hemoglobin not between 3 and 25
   or weight_kg not between 25 and 250;

-- Referral rows that violate resolved state consistency rule.
select count(*) as referrals_inconsistent_resolution_state
from public.referrals
where (status = 'resolved' and resolved_at is null)
   or (status <> 'resolved' and resolved_at is not null);

-- Patients with missing village value (will be set to 'Unknown').
select count(*) as patients_missing_village
from public.patients
where village is null;
