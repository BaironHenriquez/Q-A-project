import { useMemo, useState } from 'react'
import {
  Check,
  ClipboardList,
  Clock3,
  EyeOff,
  MessageSquare,
  PenSquare,
  Pin,
  SendHorizontal,
  UserRound,
  X,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuestions } from '../hooks/useQuestions'

export default function Moderator({
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
    addAnswer,
    moderateAnswer,
  } = useQuestions(session?.sessionId)

  const [editingQuestionId, setEditingQuestionId] = useState('')
  const [editingText, setEditingText] = useState('')
  const [editError, setEditError] = useState('')
  const [sessionActionError, setSessionActionError] = useState('')
  const [deletingSession, setDeletingSession] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [answerDrafts, setAnswerDrafts] = useState({})
  const [answeringQuestionId, setAnsweringQuestionId] = useState('')
  const [answerError, setAnswerError] = useState('')

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

  const presentationQuestions = useMemo(
    () => sortedQuestions.filter((question) => question.status === 'approved'),
    [sortedQuestions],
  )
  const visiblePresentationQuestions = useMemo(
    () => presentationQuestions.filter((question) => !question.isHidden),
    [presentationQuestions],
  )
  const hiddenPresentationQuestions = useMemo(
    () => presentationQuestions.filter((question) => question.isHidden),
    [presentationQuestions],
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
    if (deletingSession) return

    setDeletingSession(true)
    setSessionActionError('')

    const result = await deleteSession()

    setDeletingSession(false)
    if (!result.ok) {
      setSessionActionError(result.message || 'No se pudo borrar la sesión activa.')
      return
    }

    setConfirmDeleteOpen(false)
    navigate('/')
  }

  const requestDeleteSession = () => {
    if (deletingSession) return

    setSessionActionError('')
    setConfirmDeleteOpen(true)
  }

  const cancelDeleteSession = () => {
    if (deletingSession) return
    setConfirmDeleteOpen(false)
  }

  const handleLogout = () => {
    setConfirmDeleteOpen(false)
    logoutModerator()
    navigate('/')
  }

  const presentationUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/presentacion` : '/presentacion'

  const handleAnswerDraftChange = (questionId, value) => {
    setAnswerDrafts((previous) => ({
      ...previous,
      [questionId]: value,
    }))
  }

  const handleSubmitModeratorAnswer = async (event, questionId) => {
    event.preventDefault()

    const text = (answerDrafts[questionId] || '').trim()
    if (!text) return
    if (answeringQuestionId === questionId) return

    setAnsweringQuestionId(questionId)
    setAnswerError('')

    try {
      await addAnswer({
        questionId,
        author: 'Moderador',
        userId: 'mod',
        content: text,
        isModerator: true,
      })

      setAnswerDrafts((previous) => ({
        ...previous,
        [questionId]: '',
      }))
    } catch (error) {
      setAnswerError(error.message || 'No se pudo publicar la respuesta del moderador.')
    } finally {
      setAnsweringQuestionId('')
    }
  }

  return (
    <main className="min-h-screen bg-[#64a2cc] text-[#3f2abe] font-sans p-3 md:p-4 lg:p-6">
      <section className="mx-auto w-full flex flex-col gap-6 lg:gap-7">
        <article className="surface-base rounded-[2rem] p-6 shadow-md md:p-9">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="type-page-title">Panel moderador</h1>
              <p className="type-page-subtitle mt-2 text-[#3f2abe]">Moderador autenticado.</p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-wide ${
                session?.isAcceptingQuestions
                  ? 'bg-[#39d3b5] text-[#3f2abe]'
                  : 'bg-[#8b0368] text-[#e6f2fa]'
              }`}
            >
              {session?.isAcceptingQuestions ? 'Recepción activa' : 'Recepción pausada'}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-start gap-5">
            <div className="surface-raised w-full min-w-[300px] flex-[2_1_640px] rounded-3xl p-5 md:p-6">
              <p className="type-card-title break-words">{session?.title || 'Sesión sin título'}</p>
              <p className="type-meta mt-1 text-[#3f2abe] break-words">
                ID: {session?.sessionId || 'sin id'}
              </p>
              <p className="type-meta mt-2 text-[#3f2abe]">
                Estado: {session?.isAcceptingQuestions ? 'Aceptando preguntas' : 'Pausada'}
              </p>

              <div className="surface-base mt-5 rounded-2xl p-4">
                <p className="px-1 text-xs font-extrabold uppercase tracking-wide text-[#3f2abe]">Acciones del moderador</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={toggleSessionStatus}
                    className={`h-12 rounded-full px-6 text-sm font-bold shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 ${
                      session?.isAcceptingQuestions
                        ? 'bg-[#39d3b5] text-[#3f2abe]'
                        : 'bg-[#8b0368] text-[#e6f2fa]'
                    }`}
                  >
                    {session?.isAcceptingQuestions ? 'Pausar recepción' : 'Reanudar recepción'}
                  </button>
                  <a
                    href={presentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-12 inline-flex items-center justify-center rounded-full bg-[#3f2abe] px-6 text-sm font-bold text-[#e6f2fa] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                  >
                    Abrir presentación
                  </a>
                  <Link
                    to="/"
                    className="h-12 inline-flex items-center justify-center rounded-full border border-[#64a2cc] bg-[#e6f2fa] px-6 text-sm font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                  >
                    Volver al inicio
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="h-12 inline-flex items-center justify-center rounded-full border border-[#64a2cc] bg-[#e6f2fa] px-6 text-sm font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                  >
                    Cerrar sesión de moderador
                  </button>
                  <button
                    type="button"
                    onClick={requestDeleteSession}
                    disabled={deletingSession}
                    className="h-12 inline-flex items-center justify-center rounded-full bg-[#8b0368] px-6 text-sm font-bold text-[#e6f2fa] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 disabled:opacity-60"
                  >
                    Borrar sesión activa
                  </button>
                </div>
                <p className="mt-2 px-1 text-xs font-semibold leading-relaxed text-[#3f2abe]">
                  El borrado de sesión es irreversible.
                </p>
              </div>

              {confirmDeleteOpen && (
                <div className="surface-base mt-4 rounded-2xl p-4">
                  <p className="text-sm font-bold text-[#8b0368]">Confirmar borrado de sesión activa</p>
                  <p className="mt-1 text-sm font-semibold text-[#3f2abe]">
                    Esta acción elimina preguntas y respuestas de la sesión y no se puede deshacer.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={cancelDeleteSession}
                      disabled={deletingSession}
                      className="h-11 rounded-full border border-[#64a2cc] bg-[#e6f2fa] px-4 text-sm font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 disabled:opacity-60"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteSession}
                      disabled={deletingSession}
                      className="h-11 rounded-full bg-[#8b0368] px-4 text-sm font-bold text-[#e6f2fa] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 disabled:opacity-60"
                    >
                      {deletingSession ? 'Borrando sesión...' : 'Sí, borrar definitivamente'}
                    </button>
                  </div>
                </div>
              )}

              {sessionActionError && (
                <p role="alert" className="alert-critical mt-3 break-words text-sm">
                  {sessionActionError}
                </p>
              )}
            </div>

            <aside className="surface-base w-full min-w-[300px] flex-[1_1_320px] rounded-3xl p-5 shadow-sm md:p-6">
              <p className="text-xs font-extrabold uppercase tracking-wide text-[#3f2abe]">Resumen en vivo</p>
              <h2 className="type-section-title mt-2 break-words text-[#3f2abe]">
                {session?.title || 'Sesión sin título'}
              </h2>
              <p className="type-meta mt-1 text-[#3f2abe] break-words">ID: {session?.sessionId || 'sin id'}</p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="surface-raised rounded-2xl p-4">
                  <p className="text-xs font-bold text-[#3f2abe]">Pendientes</p>
                  <p className="mt-1 text-2xl font-extrabold text-[#3f2abe]">{pendingQuestions.length}</p>
                </div>
                <div className="surface-raised rounded-2xl p-4">
                  <p className="text-xs font-bold text-[#3f2abe]">Respuestas en revisión</p>
                  <p className="mt-1 text-2xl font-extrabold text-[#3f2abe]">{pendingAnswersQueue.length}</p>
                </div>
                <div className="surface-raised rounded-2xl p-4">
                  <p className="text-xs font-bold text-[#3f2abe]">Aprobadas</p>
                  <p className="mt-1 text-2xl font-extrabold text-[#3f2abe]">{approvedQuestions.length}</p>
                </div>
                <div className="surface-raised rounded-2xl p-4">
                  <p className="text-xs font-bold text-[#3f2abe]">Estado</p>
                  <p className="mt-1 text-sm font-extrabold text-[#3f2abe]">
                    {session?.isAcceptingQuestions ? 'Recibiendo' : 'Pausada'}
                  </p>
                </div>
              </div>

            </aside>
          </div>
        </article>

        <section className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
          <article className="surface-base rounded-[2rem] p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <ClipboardList size={18} className="text-[#8b0368]" />
              <h2 className="type-section-title">Preguntas pendientes ({pendingQuestions.length})</h2>
            </div>

            {loadingQuestions && (
              <p className="mt-4 text-sm font-medium text-[#3f2abe]">Cargando bandeja...</p>
            )}

            {!loadingQuestions && !pendingQuestions.length && !questionsError && (
              <div className="surface-raised mt-8 rounded-3xl p-8 text-center">
                <MessageSquare size={34} className="mx-auto text-[#3f2abe]" />
                <p className="mt-3 text-base font-bold text-[#3f2abe]">Tu bandeja está limpia</p>
                <p className="mt-1 text-sm font-medium text-[#3f2abe]">La audiencia está pensando...</p>
              </div>
            )}

            {questionsError && (
              <p role="alert" className="mt-4 text-sm font-bold text-[#8b0368] break-words">
                {questionsError}
              </p>
            )}

            <div className="mt-4 flex flex-col gap-3">
              {pendingQuestions.map((question) => {
                const isEditing = editingQuestionId === question.id

                return (
                  <article key={question.id} className="surface-base rounded-3xl p-5 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#3f2abe]">
                      <span className="inline-flex items-center gap-1">
                        <UserRound size={14} />
                        {question.author || 'Anónimo'}
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
                      <p className="mt-3 text-sm md:text-base font-semibold text-[#3f2abe] break-words">
                        {question.content}
                      </p>
                    )}

                    {isEditing && (
                      <div className="mt-3">
                        <label htmlFor={`edit-question-${question.id}`} className="sr-only">
                          Editar pregunta
                        </label>
                        <input
                          id={`edit-question-${question.id}`}
                          type="text"
                          maxLength={100}
                          value={editingText}
                          onChange={(event) => setEditingText(event.target.value)}
                          className="h-11 w-full rounded-full bg-[#e6f2fa] px-4 text-sm font-medium text-[#3f2abe] outline-none"
                        />
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => saveEdit(question.id)}
                            className="h-11 rounded-full bg-[#3f2abe] px-4 text-sm font-bold text-[#e6f2fa] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="h-11 rounded-full bg-[#e6f2fa] px-4 text-sm font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                          >
                            Cancelar
                          </button>
                        </div>
                        {editError && (
                          <p role="alert" className="mt-2 text-xs font-bold text-[#8b0368] break-words">
                            {editError}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex flex-col gap-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setQuestionStatus(question.id, 'approved')}
                          className="h-11 inline-flex items-center gap-2 rounded-full bg-[#39d3b5] px-5 text-sm font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                        >
                          <Check size={16} />
                          Aprobar
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuestionStatus(question.id, 'rejected')}
                          className="h-11 inline-flex items-center gap-2 rounded-full bg-[#8b0368] px-5 text-sm font-bold text-[#e6f2fa] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                        >
                          <X size={16} />
                          Rechazar
                        </button>
                      </div>

                      <div className="surface-raised rounded-2xl p-3">
                        <p className="px-1 text-xs font-extrabold uppercase tracking-wide text-[#3f2abe]">
                          Acciones avanzadas
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(question)}
                            className="h-11 inline-flex items-center gap-2 rounded-full border border-[#64a2cc] bg-[#e6f2fa] px-4 text-sm font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                          >
                            <PenSquare size={14} />
                            Editar
                          </button>
                        </div>
                        <p className="mt-2 px-1 text-xs font-semibold text-[#3f2abe]">
                          Fijar y ocultar se habilitan cuando la pregunta está aprobada para presentación.
                        </p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </article>

          <article className="surface-base rounded-[2rem] p-6 shadow-sm">
            <h2 className="type-section-title">Respuestas pendientes ({pendingAnswersQueue.length})</h2>

            {!pendingAnswersQueue.length && (
              <div className="surface-raised mt-4 rounded-3xl p-6 text-center">
                <MessageSquare size={30} className="mx-auto text-[#3f2abe]" />
                <p className="mt-2 text-sm font-medium text-[#3f2abe]">No hay respuestas en revisión.</p>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3">
              {pendingAnswersQueue.map((answer) => (
                <article key={answer.id} className="surface-base rounded-3xl p-4 shadow-sm">
                  <p className="text-xs font-medium text-[#3f2abe] break-words">
                    Pregunta: {answer.questionContent}
                  </p>
                  <p className="mt-2 text-xs font-bold text-[#3f2abe] break-words">
                    {answer.author || 'Anónimo'}
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
                      className="h-11 rounded-full bg-[#39d3b5] px-4 text-sm font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
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
                      className="h-11 rounded-full bg-[#8b0368] px-4 text-sm font-bold text-[#e6f2fa] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                    >
                      Rechazar respuesta
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <h3 className="mt-6 text-lg font-bold">Preguntas para presentación ({presentationQuestions.length})</h3>
            {answerError && (
              <p role="alert" className="mt-2 text-sm font-bold text-[#8b0368] break-words">
                {answerError}
              </p>
            )}
            <div className="mt-3 flex flex-col gap-2">
              {!presentationQuestions.length && (
                <div className="surface-raised rounded-3xl p-5 text-center">
                  <p className="text-sm font-medium text-[#3f2abe]">Aún no hay preguntas aprobadas.</p>
                </div>
              )}
              {visiblePresentationQuestions.map((question) => (
                <article key={question.id} className="surface-base rounded-3xl p-5 shadow-sm">
                  <p className="text-sm font-bold text-[#3f2abe] break-words">{question.content}</p>
                  <p className="mt-1 text-xs font-medium text-[#3f2abe] break-words">
                    {question.author || 'Anónimo'}
                  </p>

                  <div className="surface-raised mt-3 rounded-2xl p-3">
                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#3f2abe]">
                      Visibilidad en presentación
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuestionFields(question.id, { isPinned: !question.isPinned })
                        }
                        className="h-11 inline-flex items-center gap-2 rounded-full border border-[#64a2cc] bg-[#e6f2fa] px-4 text-sm font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                      >
                        <Pin size={14} />
                        {question.isPinned ? 'Desfijar' : 'Fijar'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuestionFields(question.id, { isHidden: true })
                        }
                        className="h-11 inline-flex items-center gap-2 rounded-full border border-[#64a2cc] bg-[#e6f2fa] px-4 text-sm font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                      >
                        <EyeOff size={14} />
                        Ocultar
                      </button>
                    </div>
                  </div>

                  {Array.isArray(question.answers) && question.answers.length > 0 && (
                    <div className="mt-3 border-l-4 border-[#64a2cc] pl-3 flex flex-col gap-2">
                      {question.answers
                        .filter((answer) => answer.status === 'approved')
                        .map((answer) => (
                          <div key={answer.id} className="surface-raised rounded-2xl p-3">
                            <p className="text-xs font-bold text-[#3f2abe] break-words">{answer.author}</p>
                            <p className="mt-1 text-sm font-medium text-[#3f2abe] break-words">{answer.content}</p>
                          </div>
                        ))}
                    </div>
                  )}

                  <form
                    onSubmit={(event) => handleSubmitModeratorAnswer(event, question.id)}
                    className="mt-3 rounded-3xl bg-[#e6f2fa] p-4 flex flex-col gap-2 sm:flex-row sm:items-center"
                  >
                    <label htmlFor={`moderator-answer-${question.id}`} className="sr-only">
                      Responder como moderador a esta pregunta
                    </label>
                    <input
                      id={`moderator-answer-${question.id}`}
                      type="text"
                      maxLength={250}
                      value={answerDrafts[question.id] || ''}
                      onChange={(event) => handleAnswerDraftChange(question.id, event.target.value)}
                      placeholder="Responder como moderador"
                      className="h-11 w-full rounded-full bg-[#e6f2fa] px-4 text-sm font-medium text-[#3f2abe] placeholder:text-[#3f2abe] outline-none"
                      disabled={answeringQuestionId === question.id}
                    />
                    <button
                      type="submit"
                      disabled={
                        answeringQuestionId === question.id ||
                        !(answerDrafts[question.id] || '').trim()
                      }
                      className="h-11 shrink-0 inline-flex items-center justify-center gap-2 rounded-full bg-[#3f2abe] px-4 text-sm font-bold text-[#e6f2fa] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 disabled:opacity-60"
                    >
                      <SendHorizontal size={14} />
                      Responder
                    </button>
                  </form>
                </article>
              ))}

              {!!hiddenPresentationQuestions.length && (
                <div className="surface-base mt-3 rounded-3xl p-4">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-[#3f2abe]">
                    Ocultas en presentación ({hiddenPresentationQuestions.length})
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    {hiddenPresentationQuestions.map((question) => (
                      <div
                        key={question.id}
                        className="surface-raised rounded-2xl p-3"
                      >
                        <p className="text-sm font-semibold text-[#3f2abe] break-words">
                          {question.content}
                        </p>
                        <button
                          type="button"
                          onClick={() => updateQuestionFields(question.id, { isHidden: false })}
                          className="mt-2 h-10 inline-flex items-center gap-2 rounded-full border border-[#64a2cc] bg-[#e6f2fa] px-4 text-xs font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                        >
                          <EyeOff size={13} />
                          Mostrar en presentación
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}
