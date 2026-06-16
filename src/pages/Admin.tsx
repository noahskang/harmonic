import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase, type Profile, type SelfReview, type PeerReview } from '../lib/supabase'
import Layout from '../components/Layout'

type MemberRow = {
  profile: Profile
  selfReviews: SelfReview[]
  peerReviews: (PeerReview & { reviewer_name: string })[]
  expanded: boolean
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Admin() {
  const { profile: myProfile } = useAuth()
  const navigate = useNavigate()
  const [members, setMembers] = useState<MemberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ userId: string; action: 'delete_user' | 'reset_user'; name: string } | null>(null)

  useEffect(() => {
    if (!myProfile) return
    if (!myProfile.is_admin) { navigate('/dashboard'); return }
    loadAll()
  }, [myProfile])

  async function loadAll() {
    setLoading(true)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('name')

    if (!profiles) { setLoading(false); return }

    const ids = profiles.map(p => p.id)

    const [selfRes, peerRes, profilesForNames] = await Promise.all([
      supabase.from('self_reviews').select('*').in('user_id', ids).order('submitted_at', { ascending: false }),
      supabase.from('peer_reviews').select('*').in('reviewee_id', ids).order('submitted_at', { ascending: false }),
      supabase.from('profiles').select('id, name').in('id', ids),
    ])

    const profileMap = Object.fromEntries((profilesForNames.data ?? []).map(p => [p.id, p.name]))

    setMembers(profiles.map(profile => ({
      profile,
      selfReviews: (selfRes.data ?? []).filter(r => r.user_id === profile.id),
      peerReviews: (peerRes.data ?? [])
        .filter(r => r.reviewee_id === profile.id)
        .map(r => ({ ...r, reviewer_name: profileMap[r.reviewer_id] ?? 'Someone' })),
      expanded: false,
    })))

    setLoading(false)
  }

  function toggleExpand(userId: string) {
    setMembers(prev => prev.map(m => m.profile.id === userId ? { ...m, expanded: !m.expanded } : m))
  }

  async function runAction(userId: string, action: 'delete_user' | 'reset_user') {
    setConfirm(null)
    setActionLoading(userId + action)

    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-actions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ action, user_id: userId }),
      }
    )

    setActionLoading(null)

    if (!res.ok) {
      const err = await res.json()
      alert(`Error: ${err.error ?? 'Something went wrong'}`)
      return
    }

    if (action === 'delete_user') {
      setMembers(prev => prev.filter(m => m.profile.id !== userId))
    } else {
      setMembers(prev => prev.map(m =>
        m.profile.id === userId
          ? { ...m, selfReviews: [], peerReviews: [] }
          : m
      ))
    }
  }

  if (loading) return <Layout><p className="text-stone-400 text-sm">Loading...</p></Layout>

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-700">Admin</h1>
          <p className="text-stone-400 text-sm mt-1">{members.length} members</p>
        </div>
        <button
          onClick={loadAll}
          className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {members.map(({ profile, selfReviews, peerReviews, expanded }) => {
          const isMe = profile.id === myProfile?.id
          const busy = actionLoading?.startsWith(profile.id)

          return (
            <div key={profile.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              {/* Member header row */}
              <div className="flex items-center justify-between px-5 py-4">
                <button
                  onClick={() => toggleExpand(profile.id)}
                  className="flex items-center gap-3 text-left flex-1 min-w-0"
                >
                  <span className="text-stone-400 text-xs w-3 shrink-0">{expanded ? '▾' : '▸'}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-stone-700 flex items-center gap-2">
                      {profile.name}
                      {profile.is_admin && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">admin</span>
                      )}
                    </p>
                    <p className="text-xs text-stone-400 truncate">{profile.email}</p>
                  </div>
                  <div className="flex gap-4 ml-4 shrink-0">
                    <span className="text-xs text-stone-400">{selfReviews.length} self</span>
                    <span className="text-xs text-stone-400">{peerReviews.length} peer</span>
                  </div>
                </button>

                {!isMe && (
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <button
                      disabled={!!busy}
                      onClick={() => setConfirm({ userId: profile.id, action: 'reset_user', name: profile.name })}
                      className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-500 hover:bg-stone-50 disabled:opacity-40 transition-colors"
                    >
                      Reset
                    </button>
                    <button
                      disabled={!!busy}
                      onClick={() => setConfirm({ userId: profile.id, action: 'delete_user', name: profile.name })}
                      className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Expanded review content */}
              {expanded && (
                <div className="border-t border-stone-100 px-5 py-4 space-y-5 bg-stone-50">
                  {/* Self reviews */}
                  <div>
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">
                      Self Reviews ({selfReviews.length})
                    </p>
                    {selfReviews.length === 0 ? (
                      <p className="text-sm text-stone-400">None yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {selfReviews.map(r => (
                          <div key={r.id} className="bg-white rounded-xl border border-stone-200 p-4">
                            <p className="text-xs text-stone-400 mb-2">{formatDate(r.submitted_at)}</p>
                            <p className="text-xs font-medium text-stone-400 mb-1">What I did well</p>
                            <p className="text-sm text-stone-600 mb-3 leading-relaxed">{r.did_well}</p>
                            <p className="text-xs font-medium text-stone-400 mb-1">Growth areas</p>
                            <p className="text-sm text-stone-600 leading-relaxed">{r.growth_areas}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Peer reviews */}
                  <div>
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">
                      Peer Feedback ({peerReviews.length})
                    </p>
                    {peerReviews.length === 0 ? (
                      <p className="text-sm text-stone-400">None yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {peerReviews.map(r => (
                          <div key={r.id} className="bg-white rounded-xl border border-stone-200 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium text-stone-600">From: {r.reviewer_name}</p>
                              <p className="text-xs text-stone-400">{formatDate(r.submitted_at)}</p>
                            </div>
                            <p className="text-xs font-medium text-amber-700 mb-1">Thankful for</p>
                            <p className="text-sm text-stone-600 mb-3 leading-relaxed">{r.thankful_for}</p>
                            <p className="text-xs font-medium text-stone-400 mb-1">Constructive feedback</p>
                            <p className="text-sm text-stone-600 leading-relaxed">{r.constructive_feedback}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Confirmation modal */}
      {confirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 max-w-sm w-full shadow-lg">
            <h3 className="font-semibold text-stone-700 mb-2">
              {confirm.action === 'delete_user' ? 'Delete account?' : 'Reset account?'}
            </h3>
            <p className="text-sm text-stone-500 mb-5 leading-relaxed">
              {confirm.action === 'delete_user'
                ? `This will permanently delete ${confirm.name}'s account and all their data. This cannot be undone.`
                : `This will delete all of ${confirm.name}'s reviews and review requests, but keep their account.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => runAction(confirm.userId, confirm.action)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors ${
                  confirm.action === 'delete_user'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-stone-700 hover:bg-stone-800'
                }`}
              >
                {confirm.action === 'delete_user' ? 'Delete permanently' : 'Reset reviews'}
              </button>
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-2.5 rounded-xl text-sm border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
