import { useState } from 'react'
import { BadgeCheck, QrCode, UsersRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Home({ user, session, createSession }) {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const hasActiveSession = Boolean(session?.sessionId)
  const isSessionModerator = Boolean(
    hasActiveSession && user?.uid && session?.moderatorId === user.uid,
  )

  const handleCreate = async (event) => {
    event.preventDefault()
    if (!title.trim() || !createSession) return

    setCreating(true)
    setCreateError('')

    const success = await createSession(title.trim(), user?.uid || 'unknown')

    setCreating(false)
    if (success) {
      navigate('/moderador')
      return
    }

    setCreateError('No se pudo crear la sesion. Intenta de nuevo.')
  }

  const goToParticipant = () => {
    if (!hasActiveSession) {
      setCreateError('Primero crea una sesion para habilitar la vista de participante.')
      return
    }

    setCreateError('')
    navigate('/participante')
  }

  const goToModerator = () => {
    if (!hasActiveSession) {
      setCreateError('Primero crea una sesion para habilitar la moderacion.')
      return
    }

    if (!isSessionModerator) {
      setCreateError('Esta sesion activa pertenece a otro moderador.')
      return
    }

    setCreateError('')
    navigate('/moderador')
  }

  const goToPresentation = () => {
    if (!hasActiveSession) {
      setCreateError('Primero crea una sesion para habilitar la presentacion.')
      return
    }

    if (!isSessionModerator) {
      setCreateError('Solo el moderador creador puede abrir la presentacion.')
      return
    }

    setCreateError('')
    navigate('/presentacion')
  }

  return (
    <main className="min-h-screen bg-[#f8fbfe] text-[#3f2abe] font-sans p-4 md:p-8">
      <section className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-[1.25fr_0.95fr] gap-5 items-start">
        <article className="rounded-[2rem] bg-white p-6 md:p-8 shadow-md">
          <p className="text-sm font-bold text-[#0a79e8]">Q&A en tiempo real</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold leading-tight">
            Crea una sesion y habilita la sala en segundos
          </h1>
          <p className="mt-3 text-base font-medium text-[#716274] max-w-3xl break-words">
            Flujo listo para moderador, presentacion y participante con acceso por QR.
          </p>

          <form onSubmit={handleCreate} className="mt-6 flex flex-col md:flex-row gap-3">
            <input
              type="text"
              required
              maxLength={60}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Titulo de la sesion"
              className="h-12 w-full rounded-full bg-[#f8fbfe] px-5 font-medium text-[#3f2abe] placeholder:text-[#716274] outline-none"
            />
            <button
              type="submit"
              disabled={creating}
              className="h-12 rounded-full bg-[#0a79e8] px-6 text-sm font-bold text-white shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 disabled:opacity-60"
            >
              {creating ? 'Creando...' : 'Crear sesion'}
            </button>
          </form>

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
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={goToModerator}
                  className="h-11 inline-flex items-center justify-center rounded-full bg-[#0a79e8] px-5 text-sm font-bold text-white shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                >
                  Abrir moderador
                </button>
                <button
                  type="button"
                  onClick={goToPresentation}
                  className="h-11 inline-flex items-center justify-center rounded-full bg-white px-5 text-sm font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                >
                  Abrir presentacion
                </button>
                <button
                  type="button"
                  onClick={goToParticipant}
                  className="h-11 inline-flex items-center justify-center rounded-full bg-[#39d3b4] px-5 text-sm font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                >
                  Abrir participante
                </button>
              </div>
            </div>
          )}
        </article>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <article className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="inline-flex rounded-2xl bg-[#e6f2fa] p-3 text-[#0a79e8]">
              <UsersRound size={20} />
            </div>
            <h2 className="mt-3 text-xl font-bold">Panel moderador</h2>
            <p className="mt-2 text-sm font-medium text-[#716274]">
              Prioriza preguntas, aprueba o rechaza y controla el ritmo de la sala.
            </p>
            <button
              type="button"
              onClick={goToModerator}
              className="mt-5 h-11 inline-flex items-center justify-center rounded-full bg-[#0a79e8] px-6 text-sm font-bold text-white shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
            >
              Ir a moderador
            </button>
          </article>

          <article className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="inline-flex rounded-2xl bg-[#e6f2fa] p-3 text-[#3f2abe]">
              <QrCode size={20} />
            </div>
            <h2 className="mt-3 text-xl font-bold">Acceso audiencia</h2>
            <p className="mt-2 text-sm font-medium text-[#716274]">
              Entra por QR o enlace directo para votar y enviar preguntas en vivo.
            </p>
            <button
              type="button"
              onClick={goToParticipant}
              className="mt-5 h-11 inline-flex items-center justify-center rounded-full bg-[#39d3b4] px-6 text-sm font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
            >
              Ir a participante
            </button>
          </article>
        </div>
      </section>
    </main>
  )
}
