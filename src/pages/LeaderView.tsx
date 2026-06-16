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
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
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
      supabase.from('self_reviews').select('*').eq('user_id', mentee.id).order('submitted_at', { ascending: false }),
      supabase.from('peer_reviews').select('*').eq('reviewee_id', mentee.id).order('submitted_at', { ascending: false }),
    ])

    const peerReviews = peerRes.data ?? []
    const reviewerIds = [...new Set(peerReviews.map(r => r.reviewer_id))]
    let profileMap: Record<string, string> = {}

    if (reviewerIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', reviewerIds)
      profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.name]))
    }

    setSelected({
      profile: mentee,
      selfReviews: selfRes.data ?? [],
      peerReviews: peerReviews.map(r => ({ ...r, reviewer_name: profileMap[r.reviewer_id] ?? 'Someone' })),
    })
    setReportLoading(false)
  }

  if (loading) return <Layout><p className="text-stone-400 text-sm">Loading...</p></Layout>

  return (
    <Layout>
      <h1 className="text-2xl font-semibold text-stone-700 mb-1">Leader View</h1>
      <p className="text-stone-400 text-sm mb-8">Members who have designated you as their leader.</p>

      {mentees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <p className="text-stone-400 text-sm mb-1">No mentees yet.</p>
          <p className="text-stone-300 text-xs">
            Members can add your email ({profile?.email}) as a leader in their Profile settings.
          </p>
        </div>
      ) : (
        <div className="flex gap-6">
          <div className="w-44 shrink-0">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">Members</p>
            <div className="space-y-0.5">
              {mentees.map(m => (
                <button
                  key={m.id}
                  onClick={() => loadReport(m)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                    selected?.profile.id === m.id
                      ? 'bg-amber-100 text-amber-800 font-medium'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1">
            {!selected && !reportLoading && (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                <p className="text-stone-400 text-sm">Select a member to view their report.</p>
              </div>
            )}
            {reportLoading && <p className="text-stone-400 text-sm">Loading report...</p>}
            {selected && !reportLoading && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-stone-700">{selected.profile.name}</h2>

                <section>
                  <h3 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">
                    Self Reviews ({selected.selfReviews.length})
                  </h3>
                  {selected.selfReviews.length === 0 ? (
                    <p className="text-sm text-stone-400">No self reviews yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {selected.selfReviews.map(r => (
                        <div key={r.id} className="bg-white rounded-2xl border border-stone-200 p-4">
                          <p className="text-xs text-stone-400 mb-3">{formatDate(r.submitted_at)}</p>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-medium text-stone-400 mb-1">What I did well</p>
                              <p className="text-sm text-stone-600 whitespace-pre-wrap leading-relaxed">{r.did_well}</p>
                            </div>
                            <div className="border-t border-stone-100 pt-3">
                              <p className="text-xs font-medium text-stone-400 mb-1">Growth areas</p>
                              <p className="text-sm text-stone-600 whitespace-pre-wrap leading-relaxed">{r.growth_areas}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">
                    Peer Feedback ({selected.peerReviews.length})
                  </h3>
                  {selected.peerReviews.length === 0 ? (
                    <p className="text-sm text-stone-400">No peer feedback yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {selected.peerReviews.map(r => (
                        <div key={r.id} className="bg-white rounded-2xl border border-stone-200 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-stone-700">From: {r.reviewer_name}</p>
                            <p className="text-xs text-stone-400">{formatDate(r.submitted_at)}</p>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-medium text-amber-700 mb-1">Thankful for</p>
                              <p className="text-sm text-stone-600 whitespace-pre-wrap leading-relaxed">{r.thankful_for}</p>
                            </div>
                            <div className="border-t border-stone-100 pt-3">
                              <p className="text-xs font-medium text-stone-400 mb-1">Constructive feedback</p>
                              <p className="text-sm text-stone-600 whitespace-pre-wrap leading-relaxed">{r.constructive_feedback}</p>
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
