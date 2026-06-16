import { useState, type FormEvent, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { supabase, type SelfReview as SelfReviewType } from '../lib/supabase'
import Layout from '../components/Layout'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function SelfReview() {
  const { user } = useAuth()
  const [didWell, setDidWell] = useState('')
  const [growthAreas, setGrowthAreas] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [history, setHistory] = useState<SelfReviewType[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  async function loadHistory() {
    const { data } = await supabase
      .from('self_reviews')
      .select('*')
      .eq('user_id', user!.id)
      .order('submitted_at', { ascending: false })
    setHistory(data ?? [])
    setLoadingHistory(false)
  }

  useEffect(() => { if (user) loadHistory() }, [user])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await supabase.from('self_reviews').insert({
      user_id: user!.id,
      did_well: didWell,
      growth_areas: growthAreas,
    })
    setSubmitting(false)
    if (!error) {
      setDidWell('')
      setGrowthAreas('')
      setSuccess(true)
      loadHistory()
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold text-stone-700 mb-1">Self Review</h1>
        <p className="text-stone-400 text-sm mb-8">Take a moment to reflect on your growth.</p>

        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-2">
                What did I do well?
              </label>
              <textarea
                required
                value={didWell}
                onChange={e => setDidWell(e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent resize-none transition leading-relaxed"
                placeholder="Share something you're proud of or did effectively..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-2">
                What are my growth areas?
              </label>
              <textarea
                required
                value={growthAreas}
                onChange={e => setGrowthAreas(e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent resize-none transition leading-relaxed"
                placeholder="Where do you want to grow next..."
              />
            </div>
            {success && <p className="text-sm text-green-600">Self review submitted!</p>}
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-stone-700 text-white rounded-xl text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit self review'}
            </button>
          </form>
        </div>

        {!loadingHistory && history.length > 0 && (
          <div>
            <h2 className="text-base font-medium text-stone-600 mb-4">Past self reviews</h2>
            <div className="space-y-4">
              {history.map(review => (
                <div key={review.id} className="bg-white rounded-2xl border border-stone-200 p-5">
                  <p className="text-xs text-stone-400 mb-4">{formatDate(review.submitted_at)}</p>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1.5">What I did well</p>
                      <p className="text-sm text-stone-600 whitespace-pre-wrap leading-relaxed">{review.did_well}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1.5">Growth areas</p>
                      <p className="text-sm text-stone-600 whitespace-pre-wrap leading-relaxed">{review.growth_areas}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
