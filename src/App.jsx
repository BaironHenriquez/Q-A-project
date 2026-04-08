import { Analytics } from '@vercel/analytics/react'
import { Loader2 } from 'lucide-react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { useAuth } from './hooks/useAuth'
import { useSession } from './hooks/useSession'
import Home from './pages/Home'
import Moderator from './pages/Moderator'
import Participant from './pages/Participant'
import Presentation from './pages/Presentation'

function ProtectedRoute({ session, loading, user, requireModerator = false, children }) {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e6f2fa]">
        <Loader2 className="animate-spin text-[#0a79e8]" size={48} />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/" replace />
  }

  if (requireModerator && session.moderatorId !== user?.uid) {
    return <Navigate to="/" replace />
  }

  return children
}

export default function App() {
  const { user, loading: authLoading } = useAuth()
  const {
    session,
    loading: sessionLoading,
    createSession,
    toggleSessionStatus,
  } = useSession()

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#3f2abe]">
        <Loader2 className="animate-spin text-white" size={48} />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Home user={user} session={session} createSession={createSession} />}
        />
        <Route
          path="/moderador"
          element={
            <ProtectedRoute
              session={session}
              loading={sessionLoading}
              user={user}
              requireModerator
            >
              <Moderator
                user={user}
                session={session}
                toggleSessionStatus={toggleSessionStatus}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/presentacion"
          element={
            <ProtectedRoute
              session={session}
              loading={sessionLoading}
              user={user}
              requireModerator
            >
              <Presentation session={session} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/participante"
          element={
            <ProtectedRoute session={session} loading={sessionLoading} user={user}>
              <Participant user={user} session={session} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  )
}
