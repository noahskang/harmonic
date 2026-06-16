import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase, type ReviewRequest } from '../lib/supabase'
import Layout from '../components/Layout'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function PendingReviews() {
  const { user, profile } = useAuth()
  const [requests, setRequests] = useState<ReviewRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    async function load() {
      await supabase
        .from('review_requests')
        .update({ reviewer_id: user!.id })
        .eq('reviewer_email', profile!.email)
        .is('reviewer_id', null)

      const { data } = await supabase
        .from('review_requests')
        .select('*')
        .eq('reviewer_email', profile!.email)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      setRequests(data ?? [])
      setLoading(false)
    }
    load()
  }, [user, profile])

  if (loading) return <Layout><p className="text-stone-400 text-sm">Loading...</p></Layout>

  return (
    <Layout>
      <h1 className="text-2xl font-semibold text-stone-700 mb-1">Pending Reviews</h1>
      <p className="text-stone-400 text-sm mb-8">
        People who've asked for your feedback.
      </p>

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <p className="text-stone-400 text-sm">You're all caught up — no pending reviews.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-2xl border border-stone-200 p-5 flex items-center justify-between">
              <div>
                <p className="font-medium text-stone-700">{req.requester_name}</p>
                <p className="text-xs text-stone-400 mt-0.5">Requested {formatDate(req.created_at)}</p>
              </div>
              <Link
                to={`/pending-reviews/${req.id}`}
                className="px-4 py-2 bg-stone-700 text-white rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors"
              >
                Write feedback
              </Link>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
