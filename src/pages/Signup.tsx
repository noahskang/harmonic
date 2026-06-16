import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [leaderEmail, setLeaderEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Sign up failed')
      setLoading(false)
      return
    }

    const leaderEmails = leaderEmail.trim() ? [leaderEmail.trim().toLowerCase()] : []
    const pendingProfile = { id: data.user.id, name, email, leader_emails: leaderEmails }

    if (data.session) {
      // Email confirmation is off — create profile immediately
      const { error: profileError } = await supabase.from('profiles').insert(pendingProfile)
      setLoading(false)
      if (profileError) { setError(profileError.message); return }
      navigate('/dashboard')
    } else {
      // Email confirmation is on — save profile data for after confirmation
      localStorage.setItem('pending_profile', JSON.stringify(pendingProfile))
      setLoading(false)
      setCheckEmail(true)
    }
  }

  if (checkEmail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-3xl font-semibold text-indigo-700 tracking-tight mb-4">Harmonic</h1>
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Check your email</h2>
            <p className="text-sm text-gray-500">
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back to sign in.
            </p>
            <Link to="/login" className="mt-6 inline-block text-sm text-indigo-600 hover:underline">
              Go to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-indigo-700 tracking-tight">Harmonic</h1>
          <p className="text-gray-500 text-sm mt-1">Church growth & feedback</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Create account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Min. 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leader's email <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="email"
                value={leaderEmail}
                onChange={e => setLeaderEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="leader@church.com"
              />
              <p className="text-xs text-gray-400 mt-1">Your leader will be able to view your reviews</p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="text-sm text-gray-500 text-center mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
