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
      const { error: profileError } = await supabase.from('profiles').insert(pendingProfile)
      setLoading(false)
      if (profileError) { setError(profileError.message); return }
      navigate('/dashboard')
    } else {
      localStorage.setItem('pending_profile', JSON.stringify(pendingProfile))
      setLoading(false)
      setCheckEmail(true)
    }
  }

  if (checkEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#faf8f5' }}>
        <div className="w-full max-w-sm text-center">
          <h1 className="text-3xl font-semibold text-stone-700 tracking-tight mb-8">Harmonic</h1>
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="text-base font-medium text-stone-700 mb-2">Check your email</h2>
            <p className="text-sm text-stone-400 leading-relaxed">
              We sent a confirmation link to <strong className="text-stone-600">{email}</strong>.
              Click it to activate your account, then come back to sign in.
            </p>
            <Link to="/login" className="mt-6 inline-block text-sm text-amber-700 hover:underline">
              Go to sign in →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#faf8f5' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-stone-700 tracking-tight">Harmonic</h1>
          <p className="text-stone-400 text-sm mt-1.5">Church growth & feedback</p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
          <h2 className="text-base font-medium text-stone-700 mb-6">Create account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-stone-600 mb-1.5">Full name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm text-stone-600 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-stone-600 mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition"
                placeholder="Min. 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm text-stone-600 mb-1.5">
                Leader's email <span className="text-stone-400">(optional)</span>
              </label>
              <input
                type="email"
                value={leaderEmail}
                onChange={e => setLeaderEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition"
                placeholder="leader@church.com"
              />
              <p className="text-xs text-stone-400 mt-1.5">You can add or change this later in your profile</p>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-stone-700 text-white rounded-xl text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors mt-1"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="text-sm text-stone-400 text-center mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-amber-700 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
