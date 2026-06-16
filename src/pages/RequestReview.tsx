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

    if (emailList.length === 0) {
      setSubmitting(false)
      return
    }

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
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Request Peer Review</h1>
        <p className="text-gray-500 text-sm mb-8">
          Enter the email addresses of people you'd like feedback from. They'll see the request when they log in.
        </p>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Peer email addresses
              </label>
              <textarea
                required
                value={emails}
                onChange={e => setEmails(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono"
                placeholder={"peer1@church.com\npeer2@church.com"}
              />
              <p className="text-xs text-gray-400 mt-1">
                One email per line, or comma-separated.
              </p>
            </div>
            {results.length > 0 && (
              <div className="space-y-1">
                {results.map(r => (
                  <div key={r.email} className="flex items-center gap-2 text-sm">
                    <span className={r.ok ? 'text-green-600' : 'text-red-500'}>
                      {r.ok ? '✓' : '✗'}
                    </span>
                    <span className="text-gray-700">{r.email}</span>
                    {!r.ok && (
                      <span className="text-gray-400 text-xs">
                        (can't request your own review)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Sending requests...' : 'Send review requests'}
            </button>
          </form>
        </div>

        <div className="mt-6 bg-indigo-50 rounded-xl border border-indigo-100 p-4 text-sm text-indigo-700">
          <strong>How it works:</strong> Each person you invite will see a pending review request on their
          dashboard when they log in. They'll fill out feedback for you there.
        </div>
      </div>
    </Layout>
  )
}
