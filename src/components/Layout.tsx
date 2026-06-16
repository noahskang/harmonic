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
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'bg-indigo-100 text-indigo-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="text-lg font-semibold text-indigo-700 tracking-tight">
            Harmonic
          </Link>
          <div className="flex items-center gap-1">
            <NavLink to="/dashboard">Home</NavLink>
            <NavLink to="/self-review">Self Review</NavLink>
            <NavLink to="/request-review">Request Review</NavLink>
            <NavLink to="/pending-reviews">Pending</NavLink>
            <NavLink to="/my-feedback">My Feedback</NavLink>
            <NavLink to="/leader-view">Leader View</NavLink>
            <NavLink to="/profile">Profile</NavLink>
            <button
              onClick={handleSignOut}
              className="ml-2 px-3 py-2 rounded-md text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
        {profile && (
          <div className="max-w-4xl mx-auto px-4 pb-2 text-xs text-gray-400">
            Signed in as {profile.name}
          </div>
        )}
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
