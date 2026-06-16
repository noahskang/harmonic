-- Migration: change leader_email (single text) → leader_emails (text array)
-- Run this in the Supabase SQL Editor

-- 1. Add the new array column
alter table profiles add column if not exists leader_emails text[] default '{}';

-- 2. Copy existing single value into the array (skip nulls)
update profiles set leader_emails = array[leader_email] where leader_email is not null;

-- 3. Drop the old column
alter table profiles drop column if exists leader_email;

-- 4. Drop old leader-related RLS policies that referenced leader_email
drop policy if exists "profiles: leader reads mentees" on profiles;
drop policy if exists "peer_reviews: leader reads" on peer_reviews;
drop policy if exists "self_reviews: leader reads" on self_reviews;

-- 5. Recreate policies using the array
create policy "profiles: leader reads mentees" on profiles
  for select using (auth.email() = any(leader_emails));

create policy "peer_reviews: leader reads" on peer_reviews
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = peer_reviews.reviewee_id
      and auth.email() = any(profiles.leader_emails)
    )
  );

create policy "self_reviews: leader reads" on self_reviews
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = self_reviews.user_id
      and auth.email() = any(profiles.leader_emails)
    )
  );
