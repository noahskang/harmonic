import { type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

function NavLink({ to, children }: { to: string; children: ReactNode }) {
  const location = useLocation()
  const active = location.pathname === to
  return (
    <Link
      to={to}
      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
        active
          ? 'bg-amber-100 text-amber-800 font-medium'
          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
      }`}
    >
      {children}
    </Link>
  )
}

export default function Layout({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#faf8f5' }}>
      <nav className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="text-lg font-semibold text-stone-700 tracking-tight">
            Harmonic
          </Link>
          <div className="flex items-center gap-0.5">
            <NavLink to="/dashboard">Home</NavLink>
            <NavLink to="/self-review">Self Review</NavLink>
            <NavLink to="/request-review">Request Review</NavLink>
            <NavLink to="/pending-reviews">Pending</NavLink>
            <NavLink to="/my-feedback">My Feedback</NavLink>
            <NavLink to="/leader-view">Leader View</NavLink>
            <NavLink to="/profile">Profile</NavLink>
            {profile?.email === 'noahskang@gmail.com' && <NavLink to="/admin">Admin</NavLink>}
            <button
              onClick={handleSignOut}
              className="ml-2 px-3 py-1.5 rounded-lg text-sm text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
        {profile && (
          <div className="max-w-4xl mx-auto px-5 pb-2 text-xs text-stone-400">
            {profile.name}
          </div>
        )}
      </nav>
      <main className="max-w-4xl mx-auto px-5 py-10">{children}</main>
    </div>
  )
}
