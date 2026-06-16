import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  name: string
  email: string
  leader_emails: string[]
  created_at: string
}

export type ReviewRequest = {
  id: string
  requester_id: string
  requester_name: string
  reviewer_email: string
  reviewer_id: string | null
  status: 'pending' | 'completed'
  created_at: string
}

export type PeerReview = {
  id: string
  request_id: string
  reviewer_id: string
  reviewee_id: string
  thankful_for: string
  constructive_feedback: string
  submitted_at: string
}

export type SelfReview = {
  id: string
  user_id: string
  did_well: string
  growth_areas: string
  submitted_at: string
}
