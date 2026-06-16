import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase, type ReviewRequest } from '../lib/supabase'
import Layout from '../components/Layout'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function PendingReviews() {
  const { user, profile } = useAuth()
  const [requests, setRequests] = useState<ReviewRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    async function load() {
      // Lazy-link: update reviewer_id for any requests matching my email that haven't been linked yet
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

  if (loading) return <Layout><p className="text-gray-400">Loading...</p></Layout>

  return (
    <Layout>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Pending Reviews</h1>
      <p className="text-gray-500 text-sm mb-8">
        These people have asked for your feedback. Take a few minutes to encourage them.
      </p>

      {requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-400 text-sm">You're all caught up — no pending reviews.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{req.requester_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">Requested {formatDate(req.created_at)}</p>
              </div>
              <Link
                to={`/pending-reviews/${req.id}`}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
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
