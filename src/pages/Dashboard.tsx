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

  if (loading) return <Layout><p className="text-gray-400">Loading...</p></Layout>

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome, {profile?.name} 👋
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Here's your review activity at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Pending reviews to write"
          value={pendingForMe}
          to="/pending-reviews"
          highlight={pendingForMe > 0}
        />
        <StatCard
          label="Peer feedback received"
          value={feedbackReceived}
          to="/my-feedback"
        />
        <StatCard
          label="Self reviews submitted"
          value={hasSelfReview ? '✓' : '0'}
          to="/self-review"
          highlight={!hasSelfReview}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
  label,
  value,
  to,
  highlight = false,
}: {
  label: string
  value: number | string
  to: string
  highlight?: boolean
}) {
  return (
    <Link
      to={to}
      className={`block bg-white rounded-xl border p-5 hover:shadow-md transition-shadow ${
        highlight ? 'border-indigo-300' : 'border-gray-200'
      }`}
    >
      <div className={`text-3xl font-bold mb-1 ${highlight ? 'text-indigo-600' : 'text-gray-800'}`}>
        {value}
      </div>
      <div className="text-sm text-gray-500">{label}</div>
    </Link>
  )
}

function ActionCard({
  title,
  description,
  to,
  cta,
  highlight = false,
}: {
  title: string
  description: string
  to: string
  cta: string
  highlight?: boolean
}) {
  return (
    <Link
      to={to}
      className={`block bg-white rounded-xl border p-6 hover:shadow-md transition-shadow ${
        highlight ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'
      }`}
    >
      <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      <span className="text-sm font-medium text-indigo-600">{cta} →</span>
    </Link>
  )
}
