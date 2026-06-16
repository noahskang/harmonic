import { useState, type FormEvent, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const [name, setName] = useState('')
  const [leaderEmails, setLeaderEmails] = useState<string[]>([])
  const [newLeaderEmail, setNewLeaderEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (profile) {
      setName(profile.name)
      setLeaderEmails(profile.leader_emails ?? [])
    }
  }, [profile])

  function addLeader() {
    const trimmed = newLeaderEmail.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@')) return
    if (leaderEmails.includes(trimmed)) return
    setLeaderEmails(prev => [...prev, trimmed])
    setNewLeaderEmail('')
  }

  function removeLeader(email: string) {
    setLeaderEmails(prev => prev.filter(e => e !== email))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('profiles')
      .update({ name, leader_emails: leaderEmails })
      .eq('id', user!.id)

    setSaving(false)
    if (error) setMessage(error.message)
    else {
      await refreshProfile()
      setMessage('Profile saved.')
    }
  }

  return (
    <Layout>
      <div className="max-w-lg">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-500 text-sm mb-8">
          Update your name and choose who can view your reviews.
        </p>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                disabled
                value={profile?.email ?? ''}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leaders who can view my reviews
              </label>

              {leaderEmails.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {leaderEmails.map(email => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-sm text-indigo-700"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => removeLeader(email)}
                        className="text-indigo-400 hover:text-indigo-700 leading-none"
                        aria-label={`Remove ${email}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="email"
                  value={newLeaderEmail}
                  onChange={e => setNewLeaderEmail(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLeader() } }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="leader@church.com"
                />
                <button
                  type="button"
                  onClick={addLeader}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Add
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                Each person listed can view your self reviews and peer feedback.
              </p>
            </div>

            {message && (
              <p className={`text-sm ${message === 'Profile saved.' ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
