import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import SelfReview from './pages/SelfReview'
import RequestReview from './pages/RequestReview'
import PendingReviews from './pages/PendingReviews'
import WriteReview from './pages/WriteReview'
import MyFeedback from './pages/MyFeedback'
import LeaderView from './pages/LeaderView'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/self-review" element={<ProtectedRoute><SelfReview /></ProtectedRoute>} />
          <Route path="/request-review" element={<ProtectedRoute><RequestReview /></ProtectedRoute>} />
          <Route path="/pending-reviews" element={<ProtectedRoute><PendingReviews /></ProtectedRoute>} />
          <Route path="/pending-reviews/:requestId" element={<ProtectedRoute><WriteReview /></ProtectedRoute>} />
          <Route path="/my-feedback" element={<ProtectedRoute><MyFeedback /></ProtectedRoute>} />
          <Route path="/leader-view" element={<ProtectedRoute><LeaderView /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
