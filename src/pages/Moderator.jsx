import { useMemo, useState } from 'react'
import {
  Check,
  ClipboardList,
  Clock3,
  EyeOff,
  MessageSquare,
  PenSquare,
  Pin,
  UserRound,
  X,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuestions } from '../hooks/useQuestions'

export default function Moderator({
  user,
  session,
  toggleSessionStatus,
  deleteSession,
  logoutModerator,
}) {
  const navigate = useNavigate()
  const {
    sortedQuestions,
    pendingQuestions,
    approvedQuestions,
    loadingQuestions,
    questionsError,
    setQuestionStatus,
    updateQuestionFields,
    editQuestionContent,
    moderateAnswer,
  } = useQuestions(session?.sessionId)

  const [editingQuestionId, setEditingQuestionId] = useState('')
  const [editingText, setEditingText] = useState('')
  const [editError, setEditError] = useState('')
  const [sessionActionError, setSessionActionError] = useState('')
  const [deletingSession, setDeletingSession] = useState(false)

  const pendingAnswersQueue = useMemo(
    () =>
      sortedQuestions.flatMap((question) =>
        (question.answers || [])
          .filter((answer) => answer.status === 'pending')
          .map((answer) => ({
            questionId: question.id,
            questionContent: question.content,
            ...answer,
          })),
      ),
    [sortedQuestions],
  )

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Sin hora'
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const startEdit = (question) => {
    setEditError('')
    setEditingQuestionId(question.id)
    setEditingText(question.content || '')
  }

  const cancelEdit = () => {
    setEditError('')
    setEditingQuestionId('')
    setEditingText('')
  }

  const saveEdit = async (questionId) => {
    try {
      await editQuestionContent({ questionId, content: editingText })
      cancelEdit()
    } catch (error) {
      setEditError(error.message || 'No se pudo actualizar la pregunta.')
    }
  }

  const handleDeleteSession = async () => {
    const confirmed = window.confirm(
      'Se borrara la sesion activa. Esta accion no se puede deshacer. Continuar?',
    )
    if (!confirmed) return

    setDeletingSession(true)
    setSessionActionError('')

    const result = await deleteSession()

    setDeletingSession(false)
    if (!result.ok) {
      setSessionActionError(result.message || 'No se pudo borrar la sesion activa.')
      return
    }

    navigate('/')
  }

  const handleLogout = () => {
    logoutModerator()
    navigate('/')
  }

  return (
    <main className="min-h-screen bg-[#f8fbfe] text-[#3f2abe] font-sans p-4 md:p-8">
      <section className="mx-auto max-w-6xl flex flex-col gap-5">
        <article className="rounded-[2rem] bg-white p-6 md:p-8 shadow-md">
          <h1 className="text-3xl font-bold">Panel moderador</h1>
          <p className="mt-2 text-sm font-medium text-[#716274] break-words">
            Usuario activo: {user?.uid || 'anonimo'}
          </p>

          <div className="mt-5 rounded-3xl bg-[#e6f2fa] p-5">
            <p className="text-lg font-bold break-words">{session?.title || 'Sesion sin titulo'}</p>
            <p className="mt-1 text-sm font-medium text-[#716274] break-words">
              ID: {session?.sessionId || 'sin id'}
            </p>
            <p className="mt-2 text-sm font-bold text-[#3f2abe]">
              Estado: {session?.isAcceptingQuestions ? 'Aceptando preguntas' : 'Pausada'}
            </p>

            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={toggleSessionStatus}
                className={`h-12 rounded-full px-6 text-sm font-bold shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 ${
                  session?.isAcceptingQuestions
                    ? 'bg-[#39d3b4] text-[#3f2abe]'
                    : 'bg-[#8b0368] text-white'
                }`}
              >
                {session?.isAcceptingQuestions ? 'Pausar recepcion' : 'Reanudar recepcion'}
              </button>
              <Link
                to="/presentacion"
                className="h-12 inline-flex items-center justify-center rounded-full bg-[#0a79e8] px-6 text-sm font-bold text-white shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
              >
                Abrir presentacion
              </Link>
              <Link
                to="/"
                className="h-12 inline-flex items-center justify-center rounded-full bg-white px-6 text-sm font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
              >
                Volver al inicio
              </Link>
              <button
                type="button"
                onClick={handleDeleteSession}
                disabled={deletingSession}
                className="h-12 inline-flex items-center justify-center rounded-full bg-[#8b0368] px-6 text-sm font-bold text-white shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 disabled:opacity-60"
              >
                {deletingSession ? 'Borrando sesion...' : 'Borrar sesion activa'}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="h-12 inline-flex items-center justify-center rounded-full bg-white px-6 text-sm font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
              >
                Cerrar sesion moderador
              </button>
            </div>
            {sessionActionError && (
              <p className="mt-3 text-sm font-bold text-[#8b0368] break-words">{sessionActionError}</p>
            )}
          </div>
        </article>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <article className="rounded-[2rem] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ClipboardList size={18} className="text-[#0a79e8]" />
              <h2 className="text-xl font-bold">Preguntas pendientes ({pendingQuestions.length})</h2>
            </div>

            {loadingQuestions && (
              <p className="mt-4 text-sm font-medium text-[#716274]">Cargando bandeja...</p>
            )}

            {!loadingQuestions && !pendingQuestions.length && !questionsError && (
              <div className="mt-8 rounded-3xl bg-[#e6f2fa] p-8 text-center">
                <MessageSquare size={34} className="mx-auto text-[#716274]" />
                <p className="mt-3 text-base font-bold text-[#3f2abe]">Tu bandeja esta limpia</p>
                <p className="mt-1 text-sm font-medium text-[#716274]">La audiencia esta pensando...</p>
              </div>
            )}

            {questionsError && (
              <p className="mt-4 text-sm font-bold text-[#8b0368] break-words">{questionsError}</p>
            )}

            <div className="mt-4 flex flex-col gap-3">
              {pendingQuestions.map((question) => {
                const isEditing = editingQuestionId === question.id

                return (
                  <article key={question.id} className="rounded-3xl bg-[#f8fbfe] p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#716274]">
                      <span className="inline-flex items-center gap-1">
                        <UserRound size={14} />
                        {question.author || 'Anonimo'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 size={14} />
                        {formatTime(question.createdAt)}
                      </span>
                      <span className="rounded-full bg-[#e08ad4] px-3 py-1 text-[#3f2abe] font-bold">
                        Pendiente
                      </span>
                    </div>

                    {!isEditing && (
                      <p className="mt-3 text-sm font-medium text-[#3f2abe] break-words">
                        {question.content}
                      </p>
                    )}

                    {isEditing && (
                      <div className="mt-3">
                        <input
                          type="text"
                          maxLength={100}
                          value={editingText}
                          onChange={(event) => setEditingText(event.target.value)}
                          className="h-11 w-full rounded-full bg-white px-4 text-sm font-medium text-[#3f2abe] outline-none"
                        />
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => saveEdit(question.id)}
                            className="h-10 rounded-full bg-[#0a79e8] px-4 text-xs font-bold text-white shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="h-10 rounded-full bg-white px-4 text-xs font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                          >
                            Cancelar
                          </button>
                        </div>
                        {editError && (
                          <p className="mt-2 text-xs font-bold text-[#8b0368] break-words">{editError}</p>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex flex-col gap-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setQuestionStatus(question.id, 'approved')}
                          className="h-11 inline-flex items-center gap-2 rounded-full bg-[#39d3b4] px-5 text-sm font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                        >
                          <Check size={16} />
                          Aprobar
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuestionStatus(question.id, 'rejected')}
                          className="h-11 inline-flex items-center gap-2 rounded-full bg-[#8b0368] px-5 text-sm font-bold text-white shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                        >
                          <X size={16} />
                          Rechazar
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(question)}
                          className="h-10 inline-flex items-center gap-2 rounded-full bg-white px-4 text-xs font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                        >
                          <PenSquare size={14} />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuestionFields(question.id, { isPinned: !question.isPinned })
                          }
                          className="h-10 inline-flex items-center gap-2 rounded-full bg-white px-4 text-xs font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                        >
                          <Pin size={14} />
                          {question.isPinned ? 'Desfijar' : 'Fijar'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuestionFields(question.id, { isHidden: !question.isHidden })
                          }
                          className="h-10 inline-flex items-center gap-2 rounded-full bg-white px-4 text-xs font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                        >
                          <EyeOff size={14} />
                          {question.isHidden ? 'Mostrar' : 'Ocultar'}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </article>

          <article className="rounded-[2rem] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">Respuestas pendientes ({pendingAnswersQueue.length})</h2>

            {!pendingAnswersQueue.length && (
              <div className="mt-4 rounded-3xl bg-[#e6f2fa] p-6 text-center">
                <MessageSquare size={30} className="mx-auto text-[#716274]" />
                <p className="mt-2 text-sm font-medium text-[#716274]">No hay respuestas en revision.</p>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3">
              {pendingAnswersQueue.map((answer) => (
                <article key={answer.id} className="rounded-3xl bg-[#f8fbfe] p-4 shadow-sm">
                  <p className="text-xs font-medium text-[#716274] break-words">
                    Pregunta: {answer.questionContent}
                  </p>
                  <p className="mt-2 text-xs font-bold text-[#716274] break-words">
                    {answer.author || 'Anonimo'}
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#3f2abe] break-words">{answer.content}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        moderateAnswer({
                          questionId: answer.questionId,
                          answerId: answer.id,
                          nextStatus: 'approved',
                        })
                      }
                      className="h-10 rounded-full bg-[#39d3b4] px-4 text-xs font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                    >
                      Aprobar respuesta
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        moderateAnswer({
                          questionId: answer.questionId,
                          answerId: answer.id,
                          nextStatus: 'rejected',
                        })
                      }
                      className="h-10 rounded-full bg-[#8b0368] px-4 text-xs font-bold text-white shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                    >
                      Rechazar respuesta
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <h3 className="mt-6 text-lg font-bold">Preguntas aprobadas ({approvedQuestions.length})</h3>
            <div className="mt-3 flex flex-col gap-2">
              {!approvedQuestions.length && (
                <div className="rounded-3xl bg-[#e6f2fa] p-5 text-center">
                  <p className="text-sm font-medium text-[#716274]">Aun no hay preguntas aprobadas.</p>
                </div>
              )}
              {approvedQuestions.slice(0, 8).map((question) => (
                <article key={question.id} className="rounded-3xl bg-[#f8fbfe] p-4 shadow-sm">
                  <p className="text-sm font-bold text-[#3f2abe] break-words">{question.content}</p>
                  <p className="mt-1 text-xs font-medium text-[#716274] break-words">
                    {question.author || 'Anonimo'}
                  </p>
                </article>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}
