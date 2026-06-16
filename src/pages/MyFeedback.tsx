import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { supabase, type PeerReview } from '../lib/supabase'
import Layout from '../components/Layout'

type ReviewWithReviewer = PeerReview & { reviewer_name: string }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function MyFeedback() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<ReviewWithReviewer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      // Load peer reviews where I'm the reviewee
      const { data: peerReviews } = await supabase
        .from('peer_reviews')
        .select('*')
        .eq('reviewee_id', user!.id)
        .order('submitted_at', { ascending: false })

      if (!peerReviews || peerReviews.length === 0) {
        setLoading(false)
        return
      }

      // Load reviewer names
      const reviewerIds = [...new Set(peerReviews.map(r => r.reviewer_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', reviewerIds)

      const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.name]))

      setReviews(
        peerReviews.map(r => ({
          ...r,
          reviewer_name: profileMap[r.reviewer_id] ?? 'Someone',
        }))
      )
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) return <Layout><p className="text-gray-400">Loading...</p></Layout>

  return (
    <Layout>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">My Feedback</h1>
      <p className="text-gray-500 text-sm mb-8">
        Peer feedback others have shared about you.
      </p>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-400 text-sm mb-1">No feedback yet.</p>
          <p className="text-gray-300 text-xs">Request reviews from peers to start receiving feedback.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="font-medium text-gray-900">{review.reviewer_name}</p>
                <p className="text-xs text-gray-400">{formatDate(review.submitted_at)}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-1">
                    Thankful for
                  </p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{review.thankful_for}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-1">
                    Constructive feedback
                  </p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{review.constructive_feedback}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
