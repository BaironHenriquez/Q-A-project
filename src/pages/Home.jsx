import { useState } from 'react'
import { BadgeCheck, LogIn, PlusCircle, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Home({
  session,
  createSession,
  deleteSession,
  isModeratorAuthenticated,
  loginModerator,
  logoutModerator,
}) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [participantSessionId, setParticipantSessionId] = useState('')
  const [participantError, setParticipantError] = useState('')

  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [createError, setCreateError] = useState('')

  const hasActiveSession = Boolean(session?.sessionId)

  const handleLogin = (event) => {
    event.preventDefault()
    setLoginError('')

    const success = loginModerator(username, password)
    if (!success) {
      setLoginError('Credenciales inválidas. Usa usuario y contraseña de moderador.')
      return
    }

    setUsername('')
    setPassword('')
  }

  const handleParticipantJoin = (event) => {
    event.preventDefault()
    const sessionId = participantSessionId.trim()

    if (!sessionId) {
      setParticipantError('Ingresa el ID de la sesión para continuar.')
      return
    }

    setParticipantError('')
    navigate(`/participante?sid=${encodeURIComponent(sessionId)}`)
  }

  const handleLogout = () => {
    logoutModerator()
    setCreateError('')
    setLoginError('')
    setConfirmDeleteOpen(false)
  }

  const handleCreate = async (event) => {
    event.preventDefault()
    if (!title.trim() || !createSession) return

    setConfirmDeleteOpen(false)
    setCreating(true)
    setCreateError('')

    const result = await createSession(title.trim())

    setCreating(false)
    if (result.ok) {
      navigate('/moderador')
      return
    }

    setCreateError(result.message || 'No se pudo crear la sesión. Intenta de nuevo.')
  }

  const goToActiveSession = () => {
    if (!hasActiveSession) {
      setCreateError('Primero crea una sesión para habilitar la moderación.')
      return
    }

    setConfirmDeleteOpen(false)
    setCreateError('')
    navigate('/moderador')
  }

  const requestDeleteActiveSession = () => {
    if (!session?.sessionId || deleting) return

    setCreateError('')
    setConfirmDeleteOpen(true)
  }

  const cancelDeleteActiveSession = () => {
    if (deleting) return
    setConfirmDeleteOpen(false)
  }

  const handleDeleteActiveSession = async () => {
    if (!session?.sessionId || deleting) return

    setDeleting(true)
    setCreateError('')

    const result = await deleteSession()

    setDeleting(false)
    if (!result.ok) {
      setCreateError(result.message || 'No se pudo borrar la sesión activa.')
      return
    }

    setTitle('')
    setConfirmDeleteOpen(false)
  }

  if (!isModeratorAuthenticated) {
    return (
      <main className="min-h-screen bg-[#64a2cc] text-[#3f2abe] font-sans p-4 md:p-8">
        <section className="mx-auto w-full max-w-lg">
          <article className="rounded-[2rem] border border-[#64a2cc] bg-[#e6f2fa] p-7 md:p-9 shadow-md">
            <p className="text-sm font-extrabold text-[#8b0368]">Q&A en tiempo real</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight leading-tight">Ingreso moderador</h1>
            <p className="mt-3 text-sm font-semibold text-[#3f2abe]">
              Solo el moderador puede crear, ingresar o borrar la sesión activa.
            </p>

            <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="moderator-username" className="text-xs font-bold text-[#3f2abe]">
                  Usuario de moderador
                </label>
                <input
                  id="moderator-username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Usuario"
                  aria-invalid={Boolean(loginError)}
                  className="h-12 w-full rounded-full bg-[#e6f2fa] px-5 font-medium text-[#3f2abe] placeholder:text-[#3f2abe] outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="moderator-password" className="text-xs font-bold text-[#3f2abe]">
                  Contraseña de moderador
                </label>
                <input
                  id="moderator-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Contraseña"
                  aria-invalid={Boolean(loginError)}
                  className="h-12 w-full rounded-full bg-[#e6f2fa] px-5 font-medium text-[#3f2abe] placeholder:text-[#3f2abe] outline-none"
                />
              </div>
              <button
                type="submit"
                className="h-12 rounded-full bg-[#3f2abe] px-6 text-sm font-bold text-[#e6f2fa] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
              >
                Ingresar como moderador
              </button>
            </form>

            {loginError && (
              <p role="alert" className="mt-3 rounded-2xl border border-[#8b0368] bg-[#e6f2fa] px-4 py-3 text-sm font-bold text-[#8b0368] break-words">
                {loginError}
              </p>
            )}

            <div className="mt-6 border-t border-[#e6f2fa] pt-6">
              <h2 className="text-xl font-extrabold tracking-tight">Ingreso usuario</h2>
              <p className="mt-2 text-sm font-semibold text-[#3f2abe]">
                Si eres participante, escribe el ID de la sesión para unirte.
              </p>

              <form onSubmit={handleParticipantJoin} className="mt-4 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="participant-session-id-home" className="text-xs font-bold text-[#3f2abe]">
                    ID de sesión
                  </label>
                  <input
                    id="participant-session-id-home"
                    type="text"
                    required
                    value={participantSessionId}
                    onChange={(event) => setParticipantSessionId(event.target.value)}
                    placeholder="ID de sesión"
                    aria-invalid={Boolean(participantError)}
                    className="h-12 w-full rounded-full bg-[#e6f2fa] px-5 font-medium text-[#3f2abe] placeholder:text-[#3f2abe] outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="h-12 rounded-full bg-[#39d3b5] px-6 text-sm font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                >
                  Unirse como usuario
                </button>
              </form>

              {participantError && (
                <p role="alert" className="mt-3 rounded-2xl border border-[#8b0368] bg-[#e6f2fa] px-4 py-3 text-sm font-bold text-[#8b0368] break-words">
                  {participantError}
                </p>
              )}
            </div>
          </article>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#64a2cc] text-[#3f2abe] font-sans p-4 md:p-8">
      <section className="mx-auto w-full max-w-[1100px] flex flex-col gap-6 lg:gap-7">
        <article className="rounded-[2rem] border border-[#64a2cc] bg-[#e6f2fa] p-7 md:p-9 shadow-md">
          <p className="text-sm font-extrabold text-[#8b0368]">Q&A en tiempo real</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            Centro de control para moderación
          </h1>
          <p className="mt-3 text-base font-semibold text-[#3f2abe] break-words leading-relaxed">
            Esta vista es solo para moderador. Participantes entran únicamente por QR o con el ID de sesión activa.
          </p>

          <div className="mt-4">
            <button
              type="button"
              onClick={handleLogout}
              className="h-11 inline-flex items-center justify-center rounded-full border border-[#64a2cc] bg-[#e6f2fa] px-4 text-sm font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
            >
              Cerrar sesión de moderador
            </button>
          </div>

          <form onSubmit={handleCreate} className="mt-6 flex flex-col gap-4 md:flex-row md:items-end">
            <div className="w-full flex flex-col gap-1">
              <label htmlFor="session-title" className="text-xs font-extrabold uppercase tracking-wide text-[#3f2abe]">
                Título de la sesión
              </label>
              <input
                id="session-title"
                type="text"
                required
                maxLength={60}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Título de la sesión"
                aria-invalid={Boolean(createError)}
                className="h-12 w-full rounded-full bg-[#e6f2fa] px-5 font-medium text-[#3f2abe] placeholder:text-[#3f2abe] outline-none"
                disabled={hasActiveSession || creating}
              />
            </div>
            <button
              type="submit"
              disabled={creating || hasActiveSession}
              className="h-12 rounded-full bg-[#3f2abe] px-6 text-sm font-bold text-[#e6f2fa] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 disabled:opacity-60 md:self-end"
            >
              {creating ? 'Creando...' : 'Crear sesión'}
            </button>
          </form>

          {hasActiveSession && (
            <p className="mt-3 text-xs font-semibold text-[#3f2abe]">
              Ya existe una sesión activa. Borra la sesión actual para crear una nueva.
            </p>
          )}

          {createError && (
            <p role="alert" className="mt-3 rounded-2xl border border-[#8b0368] bg-[#e6f2fa] px-4 py-3 text-sm font-bold text-[#8b0368] break-words">
              {createError}
            </p>
          )}

          {session && (
            <div className="mt-5 rounded-3xl bg-[#e6f2fa] p-6 shadow-sm">
              <div className="flex items-center gap-2 text-[#8b0368]">
                <BadgeCheck size={18} />
                <p className="text-sm font-bold">Sesión activa</p>
              </div>
              <p className="mt-2 text-xl font-extrabold break-words text-[#3f2abe]">
                {session.title || 'Sin título'}
              </p>
              <p className="mt-1 text-sm font-semibold break-words text-[#3f2abe]">
                ID: {session.sessionId}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#3f2abe]">Acceso de moderador verificado.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={goToActiveSession}
                  className="h-11 inline-flex items-center justify-center rounded-full bg-[#3f2abe] px-5 text-sm font-bold text-[#e6f2fa] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                >
                  Ingresar a sesión activa
                </button>

                <button
                  type="button"
                  onClick={requestDeleteActiveSession}
                  disabled={deleting}
                  className="h-11 inline-flex items-center justify-center gap-2 rounded-full bg-[#8b0368] px-5 text-sm font-bold text-[#e6f2fa] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 disabled:opacity-60"
                >
                  <Trash2 size={15} />
                  Borrar sesión activa
                </button>
              </div>

              {confirmDeleteOpen && (
                <div className="mt-4 rounded-2xl border border-[#8b0368] bg-[#e6f2fa] p-4">
                  <p className="text-sm font-bold text-[#8b0368]">Confirmar borrado de sesión activa</p>
                  <p className="mt-1 text-xs font-semibold text-[#3f2abe]">
                    Esta acción elimina preguntas y respuestas de la sesión y no se puede deshacer.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={cancelDeleteActiveSession}
                      disabled={deleting}
                      className="h-11 rounded-full border border-[#64a2cc] bg-[#e6f2fa] px-4 text-sm font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 disabled:opacity-60"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteActiveSession}
                      disabled={deleting}
                      className="h-11 rounded-full bg-[#8b0368] px-4 text-sm font-bold text-[#e6f2fa] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 disabled:opacity-60"
                    >
                      {deleting ? 'Borrando...' : 'Sí, borrar definitivamente'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </article>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <article className="rounded-[2rem] border border-[#64a2cc] bg-[#e6f2fa] p-7 shadow-sm">
            <div className="inline-flex rounded-2xl bg-[#e6f2fa] p-3 text-[#8b0368]">
              <PlusCircle size={20} />
            </div>
            <h2 className="mt-3 text-xl font-extrabold tracking-tight">Crear sesión</h2>
            <p className="mt-2 text-sm font-semibold text-[#3f2abe]">
              Inicia una nueva sesión para habilitar preguntas, moderación y presentación.
            </p>
            <p className="mt-5 text-xs font-semibold text-[#3f2abe]">
              Usa el formulario superior para crearla.
            </p>
          </article>

          <article className="rounded-[2rem] border border-[#64a2cc] bg-[#e6f2fa] p-7 shadow-sm">
            <div className="inline-flex rounded-2xl bg-[#e6f2fa] p-3 text-[#3f2abe]">
              <LogIn size={20} />
            </div>
            <h2 className="mt-3 text-xl font-extrabold tracking-tight">Ingresar a sesión activa</h2>
            <p className="mt-2 text-sm font-semibold text-[#3f2abe]">
              Retoma la sesión que ya está creada para administrar preguntas en vivo.
            </p>
            <button
              type="button"
              onClick={goToActiveSession}
              className="mt-5 h-11 inline-flex items-center justify-center rounded-full bg-[#3f2abe] px-6 text-sm font-bold text-[#e6f2fa] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
            >
              Entrar ahora
            </button>
          </article>
        </div>
      </section>
    </main>
  )
}
