import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { supabase, type Profile, type PeerReview, type SelfReview } from '../lib/supabase'
import Layout from '../components/Layout'

type MenteeReport = {
  profile: Profile
  selfReviews: SelfReview[]
  peerReviews: (PeerReview & { reviewer_name: string })[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function LeaderView() {
  const { profile } = useAuth()
  const [mentees, setMentees] = useState<Profile[]>([])
  const [selected, setSelected] = useState<MenteeReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [reportLoading, setReportLoading] = useState(false)

  useEffect(() => {
    if (!profile) return
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .contains('leader_emails', [profile!.email])
        .order('name')
      setMentees(data ?? [])
      setLoading(false)
    }
    load()
  }, [profile])

  async function loadReport(mentee: Profile) {
    setReportLoading(true)
    setSelected(null)

    const [selfRes, peerRes] = await Promise.all([
      supabase
        .from('self_reviews')
        .select('*')
        .eq('user_id', mentee.id)
        .order('submitted_at', { ascending: false }),
      supabase
        .from('peer_reviews')
        .select('*')
        .eq('reviewee_id', mentee.id)
        .order('submitted_at', { ascending: false }),
    ])

    const peerReviews = peerRes.data ?? []
    const reviewerIds = [...new Set(peerReviews.map(r => r.reviewer_id))]
    let profileMap: Record<string, string> = {}

    if (reviewerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', reviewerIds)
      profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.name]))
    }

    setSelected({
      profile: mentee,
      selfReviews: selfRes.data ?? [],
      peerReviews: peerReviews.map(r => ({
        ...r,
        reviewer_name: profileMap[r.reviewer_id] ?? 'Someone',
      })),
    })
    setReportLoading(false)
  }

  if (loading) return <Layout><p className="text-gray-400">Loading...</p></Layout>

  return (
    <Layout>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Leader View</h1>
      <p className="text-gray-500 text-sm mb-8">
        Members who have designated you as their leader.
      </p>

      {mentees.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-400 text-sm mb-1">No mentees yet.</p>
          <p className="text-gray-300 text-xs">
            Members can add your email ({profile?.email}) as a leader in their Profile settings.
          </p>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Mentee list */}
          <div className="w-48 shrink-0">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Members</p>
            <div className="space-y-1">
              {mentees.map(m => (
                <button
                  key={m.id}
                  onClick={() => loadReport(m)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selected?.profile.id === m.id
                      ? 'bg-indigo-100 text-indigo-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Report panel */}
          <div className="flex-1">
            {!selected && !reportLoading && (
              <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                <p className="text-gray-400 text-sm">Select a member to view their report.</p>
              </div>
            )}
            {reportLoading && <p className="text-gray-400 text-sm">Loading report...</p>}
            {selected && !reportLoading && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">{selected.profile.name}</h2>

                {/* Self reviews */}
                <section>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                    Self Reviews ({selected.selfReviews.length})
                  </h3>
                  {selected.selfReviews.length === 0 ? (
                    <p className="text-sm text-gray-400">No self reviews yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {selected.selfReviews.map(r => (
                        <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
                          <p className="text-xs text-gray-400 mb-3">{formatDate(r.submitted_at)}</p>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-0.5">What I did well</p>
                              <p className="text-sm text-gray-800 whitespace-pre-wrap">{r.did_well}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-0.5">Growth areas</p>
                              <p className="text-sm text-gray-800 whitespace-pre-wrap">{r.growth_areas}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Peer reviews */}
                <section>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                    Peer Feedback ({selected.peerReviews.length})
                  </h3>
                  {selected.peerReviews.length === 0 ? (
                    <p className="text-sm text-gray-400">No peer feedback yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {selected.peerReviews.map(r => (
                        <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-gray-900">From: {r.reviewer_name}</p>
                            <p className="text-xs text-gray-400">{formatDate(r.submitted_at)}</p>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-medium text-indigo-600 mb-0.5">Thankful for</p>
                              <p className="text-sm text-gray-800 whitespace-pre-wrap">{r.thankful_for}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-amber-600 mb-0.5">Constructive feedback</p>
                              <p className="text-sm text-gray-800 whitespace-pre-wrap">{r.constructive_feedback}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}
