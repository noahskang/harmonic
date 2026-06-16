import { useState, type FormEvent } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

export default function RequestReview() {
  const { user, profile } = useAuth()
  const [emails, setEmails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<{ email: string; ok: boolean }[]>([])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setResults([])

    const emailList = emails
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean)
      .filter(s => s.includes('@'))

    if (emailList.length === 0) { setSubmitting(false); return }

    const outcomes: { email: string; ok: boolean }[] = []

    for (const email of emailList) {
      if (email.toLowerCase() === profile?.email.toLowerCase()) {
        outcomes.push({ email, ok: false })
        continue
      }
      const { error } = await supabase.from('review_requests').insert({
        requester_id: user!.id,
        requester_name: profile!.name,
        reviewer_email: email,
        status: 'pending',
      })
      outcomes.push({ email, ok: !error })
    }

    setResults(outcomes)
    setSubmitting(false)
    if (outcomes.every(o => o.ok)) setEmails('')
  }

  return (
    <Layout>
      <div className="max-w-lg">
        <h1 className="text-2xl font-semibold text-stone-700 mb-1">Request Peer Review</h1>
        <p className="text-stone-400 text-sm mb-8">
          Enter email addresses of people you'd like feedback from.
        </p>

        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-2">
                Peer email addresses
              </label>
              <textarea
                required
                value={emails}
                onChange={e => setEmails(e.target.value)}
                rows={5}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent resize-none font-mono transition"
                placeholder={"peer1@church.com\npeer2@church.com"}
              />
              <p className="text-xs text-stone-400 mt-1.5">One per line, or comma-separated.</p>
            </div>

            {results.length > 0 && (
              <div className="space-y-1.5">
                {results.map(r => (
                  <div key={r.email} className="flex items-center gap-2 text-sm">
                    <span className={r.ok ? 'text-green-600' : 'text-red-400'}>{r.ok ? '✓' : '✗'}</span>
                    <span className="text-stone-600">{r.email}</span>
                    {!r.ok && <span className="text-stone-400 text-xs">(can't request your own review)</span>}
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-stone-700 text-white rounded-xl text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Sending...' : 'Send review requests'}
            </button>
          </form>
        </div>

        <div className="mt-5 bg-amber-50 rounded-2xl border border-amber-100 p-4 text-sm text-amber-800 leading-relaxed">
          Peers will see your request on their dashboard when they log in.
        </div>
      </div>
    </Layout>
  )
}
