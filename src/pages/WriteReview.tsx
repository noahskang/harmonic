import { useState, type FormEvent, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase, type ReviewRequest } from '../lib/supabase'
import Layout from '../components/Layout'

export default function WriteReview() {
  const { requestId } = useParams<{ requestId: string }>()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [request, setRequest] = useState<ReviewRequest | null>(null)
  const [thankfulFor, setThankfulFor] = useState('')
  const [constructiveFeedback, setConstructiveFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    async function load() {
      const { data } = await supabase
        .from('review_requests')
        .select('*')
        .eq('id', requestId)
        .eq('reviewer_email', profile!.email)
        .single()

      if (!data) {
        navigate('/pending-reviews')
        return
      }
      setRequest(data)
      setLoading(false)
    }
    load()
  }, [requestId, profile])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    // Get reviewee's profile id from requester_id on the request
    const { error: reviewError } = await supabase.from('peer_reviews').insert({
      request_id: requestId,
      reviewer_id: user!.id,
      reviewee_id: request!.requester_id,
      thankful_for: thankfulFor,
      constructive_feedback: constructiveFeedback,
    })

    if (reviewError) {
      setError(reviewError.message)
      setSubmitting(false)
      return
    }

    await supabase
      .from('review_requests')
      .update({ status: 'completed' })
      .eq('id', requestId)

    navigate('/pending-reviews')
  }

  if (loading || !request) return <Layout><p className="text-gray-400">Loading...</p></Layout>

  return (
    <Layout>
      <div className="max-w-2xl">
        <div className="mb-8">
          <p className="text-sm text-gray-400 mb-1">Writing feedback for</p>
          <h1 className="text-2xl font-semibold text-gray-900">{request.requester_name}</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                I'm thankful for {request.requester_name} for...
              </label>
              <textarea
                required
                value={thankfulFor}
                onChange={e => setThankfulFor(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Share something genuine you appreciate about this person..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                My constructive feedback for {request.requester_name} is...
              </label>
              <textarea
                required
                value={constructiveFeedback}
                onChange={e => setConstructiveFeedback(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Offer honest, kind, and specific feedback for growth..."
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit feedback'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/pending-reviews')}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
