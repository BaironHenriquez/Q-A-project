import { Suspense, lazy, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Moon, Sun } from 'lucide-react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { useAuth } from './hooks/useAuth'
import { useModeratorAuth } from './hooks/useModeratorAuth'
import { useSession } from './hooks/useSession'

const Home = lazy(() => import('./pages/Home'))
const Moderator = lazy(() => import('./pages/Moderator'))
const Participant = lazy(() => import('./pages/Participant'))
const Presentation = lazy(() => import('./pages/Presentation'))

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light'

  const savedTheme = localStorage.getItem('qna_theme')
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function ProtectedRoute({
  session,
  loading,
  requireModerator = false,
  isModeratorAuthenticated = false,
  children,
}) {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e6f2fa]">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-[#64a2cc] bg-[#e6f2fa] px-5 py-4 shadow-sm">
          <Loader2 className="animate-spin text-[#0a79e8]" size={28} />
          <p className="text-sm font-semibold text-[#3f2abe]">Cargando vista...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/" replace />
  }

  if (requireModerator && !isModeratorAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}

function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e6f2fa]">
      <div className="inline-flex items-center gap-3 rounded-2xl border border-[#64a2cc] bg-[#e6f2fa] px-5 py-4 shadow-sm">
        <Loader2 className="animate-spin text-[#0a79e8]" size={28} />
        <p className="text-sm font-semibold text-[#3f2abe]">Preparando módulo...</p>
      </div>
    </div>
  )
}

export default function App() {
  const { user, loading: authLoading } = useAuth()
  const {
    isModeratorAuthenticated,
    loginModerator,
    logoutModerator,
  } = useModeratorAuth()
  const [theme, setTheme] = useState(getInitialTheme)
  const {
    session,
    loading: sessionLoading,
    createSession,
    deleteSession,
    toggleSessionStatus,
  } = useSession()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('qna_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((previous) => (previous === 'light' ? 'dark' : 'light'))
  }
  const themeToggleText = theme === 'dark' ? 'Modo claro' : 'Modo oscuro'
  const themeToggleAriaLabel =
    theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#3f2abe]">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-[#64a2cc] bg-[#3f2abe] px-5 py-4 shadow-sm">
          <Loader2 className="animate-spin text-[#e6f2fa]" size={28} />
          <p className="text-sm font-semibold text-[#e6f2fa]">Conectando sesión...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <button
        type="button"
        onClick={toggleTheme}
        className="theme-toggle fixed right-3 z-50 inline-flex h-11 items-center gap-2 rounded-full border border-[#64a2cc] bg-[#3f2abe] px-3 text-xs font-extrabold tracking-tight text-[#e6f2fa] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 sm:right-4 sm:h-12 sm:px-5"
        style={{ top: 'calc(0.75rem + env(safe-area-inset-top))' }}
        aria-label={themeToggleAriaLabel}
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        <span className="hidden sm:inline">{themeToggleText}</span>
        <span className="sm:hidden" aria-hidden="true">
          {theme === 'dark' ? 'Claro' : 'Oscuro'}
        </span>
      </button>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route
            path="/"
            element={
              <Home
                session={session}
                createSession={createSession}
                deleteSession={deleteSession}
                isModeratorAuthenticated={isModeratorAuthenticated}
                loginModerator={loginModerator}
                logoutModerator={logoutModerator}
              />
            }
          />
          <Route
            path="/moderador"
            element={
              <ProtectedRoute
                session={session}
                loading={sessionLoading}
                requireModerator
                isModeratorAuthenticated={isModeratorAuthenticated}
              >
                <Moderator
                  session={session}
                  toggleSessionStatus={toggleSessionStatus}
                  deleteSession={deleteSession}
                  logoutModerator={logoutModerator}
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
                requireModerator
                isModeratorAuthenticated={isModeratorAuthenticated}
              >
                <Presentation session={session} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/participante"
            element={
              <ProtectedRoute session={session} loading={sessionLoading}>
                <Participant user={user} session={session} />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
