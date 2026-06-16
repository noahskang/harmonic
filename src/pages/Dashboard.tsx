import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [pendingForMe, setPendingForMe] = useState(0)
  const [feedbackReceived, setFeedbackReceived] = useState(0)
  const [hasSelfReview, setHasSelfReview] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !profile) return

    async function load() {
      const [pendingRes, feedbackRes, selfRes] = await Promise.all([
        supabase
          .from('review_requests')
          .select('id', { count: 'exact', head: true })
          .eq('reviewer_email', profile!.email)
          .eq('status', 'pending'),
        supabase
          .from('peer_reviews')
          .select('id', { count: 'exact', head: true })
          .eq('reviewee_id', user!.id),
        supabase
          .from('self_reviews')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id),
      ])
      setPendingForMe(pendingRes.count ?? 0)
      setFeedbackReceived(feedbackRes.count ?? 0)
      setHasSelfReview((selfRes.count ?? 0) > 0)
      setLoading(false)
    }

    load()
  }, [user, profile])

  if (loading) return <Layout><p className="text-stone-400 text-sm">Loading...</p></Layout>

  return (
    <Layout>
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-stone-700">
          Welcome back, {profile?.name}
        </h1>
        <p className="text-stone-400 mt-1 text-sm">Here's your review activity.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <StatCard
          label="Reviews to write"
          value={pendingForMe}
          to="/pending-reviews"
          highlight={pendingForMe > 0}
        />
        <StatCard
          label="Feedback received"
          value={feedbackReceived}
          to="/my-feedback"
        />
        <StatCard
          label="Self reviews"
          value={hasSelfReview ? '✓' : '0'}
          to="/self-review"
          highlight={!hasSelfReview}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ActionCard
          title="Write a self review"
          description="Reflect on what you've done well and where you can grow."
          to="/self-review"
          cta="Start self review"
        />
        <ActionCard
          title="Request peer feedback"
          description="Invite teammates to share feedback about working with you."
          to="/request-review"
          cta="Request reviews"
        />
        {pendingForMe > 0 && (
          <ActionCard
            title={`${pendingForMe} review${pendingForMe !== 1 ? 's' : ''} waiting for you`}
            description="Someone asked for your feedback. Take a few minutes to encourage them."
            to="/pending-reviews"
            cta="Write feedback"
            highlight
          />
        )}
      </div>
    </Layout>
  )
}

function StatCard({
  label, value, to, highlight = false,
}: {
  label: string; value: number | string; to: string; highlight?: boolean
}) {
  return (
    <Link
      to={to}
      className={`block bg-white rounded-2xl border p-5 hover:shadow-sm transition-shadow ${
        highlight ? 'border-amber-200' : 'border-stone-200'
      }`}
    >
      <div className={`text-3xl font-semibold mb-1 ${highlight ? 'text-amber-700' : 'text-stone-700'}`}>
        {value}
      </div>
      <div className="text-sm text-stone-400">{label}</div>
    </Link>
  )
}

function ActionCard({
  title, description, to, cta, highlight = false,
}: {
  title: string; description: string; to: string; cta: string; highlight?: boolean
}) {
  return (
    <Link
      to={to}
      className={`block rounded-2xl border p-6 hover:shadow-sm transition-shadow ${
        highlight ? 'bg-amber-50 border-amber-200' : 'bg-white border-stone-200'
      }`}
    >
      <h3 className="font-medium text-stone-700 mb-1">{title}</h3>
      <p className="text-sm text-stone-400 mb-4 leading-relaxed">{description}</p>
      <span className="text-sm font-medium text-amber-700">{cta} →</span>
    </Link>
  )
}
