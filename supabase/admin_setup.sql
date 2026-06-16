-- Admin setup: run once in Supabase SQL Editor

-- 1. Add is_admin column
alter table profiles add column if not exists is_admin boolean default false;

-- 2. Security-definer helper avoids RLS recursion when checking admin status
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and is_admin = true
  );
$$;

-- 3. Admin can read everything
create policy "profiles: admin reads all" on profiles
  for select using (is_admin());

create policy "self_reviews: admin reads all" on self_reviews
  for select using (is_admin());

create policy "peer_reviews: admin reads all" on peer_reviews
  for select using (is_admin());

create policy "review_requests: admin reads all" on review_requests
  for select using (is_admin());

-- 4. Admin can delete everything (reset + delete user)
create policy "profiles: admin deletes" on profiles
  for delete using (is_admin());

create policy "self_reviews: admin deletes" on self_reviews
  for delete using (is_admin());

create policy "peer_reviews: admin deletes" on peer_reviews
  for delete using (is_admin());

create policy "review_requests: admin deletes" on review_requests
  for delete using (is_admin());

-- 5. Make yourself admin
update profiles set is_admin = true where email = 'noahskang@gmail.com';
