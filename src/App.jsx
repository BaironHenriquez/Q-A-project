import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Moon, Sun } from 'lucide-react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { useAuth } from './hooks/useAuth'
import { useSession } from './hooks/useSession'
import Home from './pages/Home'
import Moderator from './pages/Moderator'
import Participant from './pages/Participant'
import Presentation from './pages/Presentation'

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light'

  const savedTheme = localStorage.getItem('qna_theme')
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

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
  const [theme, setTheme] = useState(getInitialTheme)
  const {
    session,
    loading: sessionLoading,
    createSession,
    toggleSessionStatus,
  } = useSession()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('qna_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((previous) => (previous === 'light' ? 'dark' : 'light'))
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#3f2abe]">
        <Loader2 className="animate-spin text-white" size={48} />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <button
        type="button"
        onClick={toggleTheme}
        className="theme-toggle fixed right-4 top-4 z-50 inline-flex h-11 items-center gap-2 rounded-full border border-[#64a2cc] bg-white px-4 text-xs font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
        aria-label="Cambiar tema"
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      </button>
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
    </BrowserRouter>
  )
}
