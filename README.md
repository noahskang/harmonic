# Harmonic

Church HR app — peer feedback and self-reviews.

## Features (Phase 1)

- Create account and set a leader email
- Request peer reviews from colleagues by email
- Write self-reviews ("What did I do well?", "What are my growth areas?")
- Write peer feedback ("I'm thankful for...", "My constructive feedback is...")
- View all attributed feedback you've received
- Leader view: see mentees' self-reviews and peer feedback

## Setup

### 1. Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run the contents of `supabase/schema.sql`
3. Go to **Settings → API** and copy:
   - **Project URL** → paste into `.env.local` as `VITE_SUPABASE_URL`
   - **anon/public key** → paste into `.env.local` as `VITE_SUPABASE_ANON_KEY`

### 2. Local dev

```bash
npm install
npm run dev
```

### 3. GitHub + Netlify deploy

```bash
# Install GitHub CLI (if not installed)
brew install gh
gh auth login

# Create repo and push
gh repo create harmonic --public --source=. --remote=origin --push

# Then on Netlify:
# 1. Connect GitHub repo
# 2. Build command: npm run build
# 3. Publish directory: dist
# 4. Add env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

## Project structure

```
src/
  lib/
    supabase.ts      Supabase client + type definitions
    auth.tsx         AuthContext and useAuth hook
  components/
    Layout.tsx       Nav + page wrapper
    ProtectedRoute   Redirect to /login if unauthenticated
  pages/
    Login / Signup
    Dashboard        Activity overview
    Profile          Name + leader email settings
    SelfReview       Write and view past self-reviews
    RequestReview    Send peer review requests by email
    PendingReviews   Reviews I need to write for others
    WriteReview      Peer feedback form
    MyFeedback       See feedback received from peers
    LeaderView       See mentees' full reports
supabase/
  schema.sql         Tables + RLS policies (run once in Supabase SQL editor)
netlify.toml         SPA redirect config
```
