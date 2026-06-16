import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { supabase, type PeerReview } from '../lib/supabase'
import Layout from '../components/Layout'

type ReviewWithReviewer = PeerReview & { reviewer_name: string }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function MyFeedback() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<ReviewWithReviewer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data: peerReviews } = await supabase
        .from('peer_reviews')
        .select('*')
        .eq('reviewee_id', user!.id)
        .order('submitted_at', { ascending: false })

      if (!peerReviews || peerReviews.length === 0) { setLoading(false); return }

      const reviewerIds = [...new Set(peerReviews.map(r => r.reviewer_id))]
      const { data: profiles } = await supabase
        .from('profiles').select('id, name').in('id', reviewerIds)

      const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.name]))
      setReviews(peerReviews.map(r => ({ ...r, reviewer_name: profileMap[r.reviewer_id] ?? 'Someone' })))
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) return <Layout><p className="text-stone-400 text-sm">Loading...</p></Layout>

  return (
    <Layout>
      <h1 className="text-2xl font-semibold text-stone-700 mb-1">My Feedback</h1>
      <p className="text-stone-400 text-sm mb-8">Peer feedback others have shared about you.</p>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <p className="text-stone-400 text-sm">No feedback yet.</p>
          <p className="text-stone-300 text-xs mt-1">Request reviews from peers to start receiving feedback.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="bg-white rounded-2xl border border-stone-200 p-5">
              <div className="flex items-center justify-between mb-5">
                <p className="font-medium text-stone-700">{review.reviewer_name}</p>
                <p className="text-xs text-stone-400">{formatDate(review.submitted_at)}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-1.5">
                    Thankful for
                  </p>
                  <p className="text-sm text-stone-600 whitespace-pre-wrap leading-relaxed">{review.thankful_for}</p>
                </div>
                <div className="border-t border-stone-100 pt-4">
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1.5">
                    Constructive feedback
                  </p>
                  <p className="text-sm text-stone-600 whitespace-pre-wrap leading-relaxed">{review.constructive_feedback}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
