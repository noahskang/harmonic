-- ============================================================
-- Harmonic Church HR App — Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Profiles: one per auth user
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null unique,
  leader_email text,
  created_at timestamptz default now()
);

-- Peer review requests
create table if not exists review_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references profiles(id) on delete cascade not null,
  requester_name text not null,
  reviewer_email text not null,
  reviewer_id uuid references profiles(id) on delete set null,
  status text default 'pending' check (status in ('pending', 'completed')),
  created_at timestamptz default now()
);

-- Peer reviews (completed by reviewer)
create table if not exists peer_reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references review_requests(id) on delete cascade not null,
  reviewer_id uuid references profiles(id) on delete cascade not null,
  reviewee_id uuid references profiles(id) on delete cascade not null,
  thankful_for text not null,
  constructive_feedback text not null,
  submitted_at timestamptz default now()
);

-- Self reviews
create table if not exists self_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  did_well text not null,
  growth_areas text not null,
  submitted_at timestamptz default now()
);

-- ============================================================
-- Enable Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table review_requests enable row level security;
alter table peer_reviews enable row level security;
alter table self_reviews enable row level security;

-- ============================================================
-- RLS Policies: profiles
-- ============================================================

-- Users can read and update their own profile
create policy "profiles: own row" on profiles
  for all using (auth.uid() = id);

-- Leaders can read profiles of their mentees
create policy "profiles: leader reads mentees" on profiles
  for select using (leader_email = auth.email());

-- ============================================================
-- RLS Policies: review_requests
-- ============================================================

-- Requester can see and manage their own requests
create policy "review_requests: requester" on review_requests
  for all using (requester_id = auth.uid());

-- Reviewer can see requests assigned to their email
create policy "review_requests: reviewer reads" on review_requests
  for select using (reviewer_email = auth.email());

-- Reviewer can update (to link reviewer_id and mark complete)
create policy "review_requests: reviewer updates" on review_requests
  for update using (reviewer_email = auth.email());

-- ============================================================
-- RLS Policies: peer_reviews
-- ============================================================

-- Reviewer can insert their own review
create policy "peer_reviews: reviewer inserts" on peer_reviews
  for insert with check (reviewer_id = auth.uid());

-- Reviewer can read their own submissions
create policy "peer_reviews: reviewer reads own" on peer_reviews
  for select using (reviewer_id = auth.uid());

-- Reviewee can read feedback about them
create policy "peer_reviews: reviewee reads" on peer_reviews
  for select using (reviewee_id = auth.uid());

-- Leaders can read peer reviews for their mentees
create policy "peer_reviews: leader reads" on peer_reviews
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = peer_reviews.reviewee_id
      and profiles.leader_email = auth.email()
    )
  );

-- ============================================================
-- RLS Policies: self_reviews
-- ============================================================

-- Users manage their own self reviews
create policy "self_reviews: own" on self_reviews
  for all using (user_id = auth.uid());

-- Leaders can read their mentees' self reviews
create policy "self_reviews: leader reads" on self_reviews
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = self_reviews.user_id
      and profiles.leader_email = auth.email()
    )
  );
