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
  const [createError, setCreateError] = useState('')

  const hasActiveSession = Boolean(session?.sessionId)

  const handleLogin = (event) => {
    event.preventDefault()
    setLoginError('')

    const success = loginModerator(username, password)
    if (!success) {
      setLoginError('Credenciales invalidas. Usa usuario y contrasena de moderador.')
      return
    }

    setUsername('')
    setPassword('')
  }

  const handleParticipantJoin = (event) => {
    event.preventDefault()
    const sessionId = participantSessionId.trim()

    if (!sessionId) {
      setParticipantError('Ingresa el ID de la sesion para continuar.')
      return
    }

    setParticipantError('')
    navigate(`/participante?sid=${encodeURIComponent(sessionId)}`)
  }

  const handleLogout = () => {
    logoutModerator()
    setCreateError('')
    setLoginError('')
  }

  const handleCreate = async (event) => {
    event.preventDefault()
    if (!title.trim() || !createSession) return

    setCreating(true)
    setCreateError('')

    const result = await createSession(title.trim())

    setCreating(false)
    if (result.ok) {
      navigate('/moderador')
      return
    }

    setCreateError(result.message || 'No se pudo crear la sesion. Intenta de nuevo.')
  }

  const goToActiveSession = () => {
    if (!hasActiveSession) {
      setCreateError('Primero crea una sesion para habilitar la moderacion.')
      return
    }

    setCreateError('')
    navigate('/moderador')
  }

  const handleDeleteActiveSession = async () => {
    if (!session?.sessionId) return

    const confirmed = window.confirm(
      'Se borrara la sesion activa. Esta accion no se puede deshacer. Continuar?',
    )
    if (!confirmed) return

    setDeleting(true)
    setCreateError('')

    const result = await deleteSession()

    setDeleting(false)
    if (!result.ok) {
      setCreateError(result.message || 'No se pudo borrar la sesion activa.')
      return
    }

    setTitle('')
  }

  if (!isModeratorAuthenticated) {
    return (
      <main className="min-h-screen bg-[#f8fbfe] text-[#3f2abe] font-sans p-4 md:p-8">
        <section className="mx-auto max-w-md">
          <article className="rounded-[2rem] bg-white p-6 md:p-8 shadow-md">
            <p className="text-sm font-bold text-[#0a79e8]">Q&A en tiempo real</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight">Ingreso moderador</h1>
            <p className="mt-3 text-sm font-medium text-[#716274]">
              Solo el moderador puede crear, ingresar o borrar la sesion activa.
            </p>

            <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-3">
              <input
                type="text"
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Usuario"
                className="h-12 w-full rounded-full bg-[#f8fbfe] px-5 font-medium text-[#3f2abe] placeholder:text-[#716274] outline-none"
              />
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Contrasena"
                className="h-12 w-full rounded-full bg-[#f8fbfe] px-5 font-medium text-[#3f2abe] placeholder:text-[#716274] outline-none"
              />
              <button
                type="submit"
                className="h-12 rounded-full bg-[#0a79e8] px-6 text-sm font-bold text-white shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
              >
                Ingresar como moderador
              </button>
            </form>

            {loginError && (
              <p className="mt-3 text-sm font-bold text-[#8b0368] break-words">{loginError}</p>
            )}

            <div className="mt-6 border-t border-[#e6f2fa] pt-6">
              <h2 className="text-xl font-bold">Ingreso usuario</h2>
              <p className="mt-2 text-sm font-medium text-[#716274]">
                Si eres participante, escribe el ID de la sesion para unirte.
              </p>

              <form onSubmit={handleParticipantJoin} className="mt-4 flex flex-col gap-3">
                <input
                  type="text"
                  required
                  value={participantSessionId}
                  onChange={(event) => setParticipantSessionId(event.target.value)}
                  placeholder="ID de sesion"
                  className="h-12 w-full rounded-full bg-[#f8fbfe] px-5 font-medium text-[#3f2abe] placeholder:text-[#716274] outline-none"
                />
                <button
                  type="submit"
                  className="h-12 rounded-full bg-[#39d3b4] px-6 text-sm font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                >
                  Unirse como usuario
                </button>
              </form>

              {participantError && (
                <p className="mt-3 text-sm font-bold text-[#8b0368] break-words">
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
    <main className="min-h-screen bg-[#f8fbfe] text-[#3f2abe] font-sans p-4 md:p-8">
      <section className="mx-auto max-w-4xl flex flex-col gap-5">
        <article className="rounded-[2rem] bg-white p-6 md:p-8 shadow-md">
          <p className="text-sm font-bold text-[#0a79e8]">Q&A en tiempo real</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold leading-tight">
            Centro de control para moderacion
          </h1>
          <p className="mt-3 text-base font-medium text-[#716274] break-words">
            Esta vista es solo para moderador. Participantes entran unicamente por QR o con el ID de sesion activa.
          </p>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleLogout}
                className="h-10 inline-flex items-center justify-center rounded-full bg-white px-4 text-xs font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
              >
                Cerrar sesion moderador
              </button>
            </div>

          <form onSubmit={handleCreate} className="mt-6 flex flex-col md:flex-row gap-3">
            <input
              type="text"
              required
              maxLength={60}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Titulo de la sesion"
              className="h-12 w-full rounded-full bg-[#f8fbfe] px-5 font-medium text-[#3f2abe] placeholder:text-[#716274] outline-none"
                disabled={hasActiveSession || creating}
            />
            <button
              type="submit"
                disabled={creating || hasActiveSession}
              className="h-12 rounded-full bg-[#0a79e8] px-6 text-sm font-bold text-white shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 disabled:opacity-60"
            >
              {creating ? 'Creando...' : 'Crear sesion'}
            </button>
          </form>

            {hasActiveSession && (
              <p className="mt-3 text-xs font-bold text-[#716274]">
                Ya existe una sesion activa. Borra la sesion actual para crear una nueva.
              </p>
            )}

          {createError && (
            <p className="mt-3 text-sm font-bold text-[#8b0368] break-words">{createError}</p>
          )}

          {session && (
            <div className="mt-5 rounded-3xl bg-[#e6f2fa] p-5 shadow-sm">
              <div className="flex items-center gap-2 text-[#0a79e8]">
                <BadgeCheck size={18} />
                <p className="text-sm font-bold">Sesion activa</p>
              </div>
              <p className="mt-2 text-lg font-bold break-words text-[#3f2abe]">
                {session.title || 'Sin titulo'}
              </p>
              <p className="mt-1 text-sm font-medium break-words text-[#716274]">
                ID: {session.sessionId}
              </p>
              <p className="mt-1 text-sm font-medium break-words text-[#716274]">
                Moderador actual: {session.moderatorId || 'sin asignar'}
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={goToActiveSession}
                  className="h-11 inline-flex items-center justify-center rounded-full bg-[#0a79e8] px-5 text-sm font-bold text-white shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                >
                  Ingresar a sesion activa
                </button>

                <button
                  type="button"
                  onClick={handleDeleteActiveSession}
                  disabled={deleting}
                  className="ml-2 mt-2 sm:mt-0 h-11 inline-flex items-center justify-center gap-2 rounded-full bg-[#8b0368] px-5 text-sm font-bold text-white shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 disabled:opacity-60"
                >
                  <Trash2 size={15} />
                  {deleting ? 'Borrando...' : 'Borrar sesion activa'}
                </button>
              </div>
            </div>
          )}
        </article>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <article className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="inline-flex rounded-2xl bg-[#e6f2fa] p-3 text-[#0a79e8]">
              <PlusCircle size={20} />
            </div>
            <h2 className="mt-3 text-xl font-bold">Crear sesion</h2>
            <p className="mt-2 text-sm font-medium text-[#716274]">
              Inicia una nueva sesion para habilitar preguntas, moderacion y presentacion.
            </p>
            <p className="mt-5 text-xs font-bold text-[#716274]">
              Usa el formulario superior para crearla.
            </p>
          </article>

          <article className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="inline-flex rounded-2xl bg-[#e6f2fa] p-3 text-[#3f2abe]">
              <LogIn size={20} />
            </div>
            <h2 className="mt-3 text-xl font-bold">Ingresar a sesion activa</h2>
            <p className="mt-2 text-sm font-medium text-[#716274]">
              Retoma la sesion que ya esta creada para administrar preguntas en vivo.
            </p>
            <button
              type="button"
              onClick={goToActiveSession}
              className="mt-5 h-11 inline-flex items-center justify-center rounded-full bg-[#0a79e8] px-6 text-sm font-bold text-white shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
            >
              Entrar ahora
            </button>
          </article>
        </div>
      </section>
    </main>
  )
}
