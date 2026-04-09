import { useEffect, useState } from 'react'
import { MessageSquare, SendHorizontal, Sparkles, ThumbsUp } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuestions } from '../hooks/useQuestions'

const PARTICIPANT_ID_KEY = 'qna_participant_id'

const getOrCreateParticipantId = () => {
  if (typeof window === 'undefined') return ''

  const current = localStorage.getItem(PARTICIPANT_ID_KEY)
  if (current) return current

  const generated = `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  localStorage.setItem(PARTICIPANT_ID_KEY, generated)
  return generated
}

const normalizeAnswerAuthor = (author) => {
  const value = String(author || '').trim()
  if (!value) return 'Participante'
  if (value.toLowerCase() === 'respondedor') return 'Responder'
  return value
}

export default function Participant({ user, session }) {
  const [searchParams] = useSearchParams()
  const sidFromUrl = (searchParams.get('sid') || '').trim()
  const [participantId] = useState(getOrCreateParticipantId)

  const [sessionCode, setSessionCode] = useState('')
  const [sessionCodeError, setSessionCodeError] = useState('')
  const [authorizedSessionId, setAuthorizedSessionId] = useState('')

  const [myName, setMyName] = useState(
    () => localStorage.getItem('qna_user_name') || '',
  )
  const [isNameSet, setIsNameSet] = useState(
    () => Boolean(localStorage.getItem('qna_user_name')),
  )
  const [questionText, setQuestionText] = useState('')
  const [sendingQuestion, setSendingQuestion] = useState(false)
  const [questionError, setQuestionError] = useState('')
  const [questionSuccess, setQuestionSuccess] = useState('')
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [cooldownNow, setCooldownNow] = useState(() => Date.now())
  const [answerDrafts, setAnswerDrafts] = useState({})
  const [expandedAnswerQuestionId, setExpandedAnswerQuestionId] = useState('')
  const [sendingAnswerQuestionId, setSendingAnswerQuestionId] = useState('')
  const [answerError, setAnswerError] = useState('')
  const [answerSuccess, setAnswerSuccess] = useState('')
  const [isComposerCompact, setIsComposerCompact] = useState(false)
  const actorId = user?.uid || participantId || ''
  const isSessionOpen = session?.isAcceptingQuestions !== false
  const hasSessionAccess = Boolean(
    session?.sessionId && authorizedSessionId === session.sessionId,
  )

  const {
    sortedQuestions,
    loadingQuestions,
    questionsError,
    createQuestion,
    toggleVote,
    addAnswer,
    voteAnswerCorrectness,
  } = useQuestions(
    isNameSet && hasSessionAccess ? session?.sessionId : null,
  )

  useEffect(() => {
    if (!session?.sessionId) {
      setAuthorizedSessionId('')
      return
    }

    if (!sidFromUrl) return

    if (sidFromUrl === session.sessionId) {
      setAuthorizedSessionId(session.sessionId)
      setSessionCodeError('')
    }
  }, [session?.sessionId, sidFromUrl])

  useEffect(() => {
    if (!questionSuccess) return undefined

    const timeoutId = window.setTimeout(() => {
      setQuestionSuccess('')
    }, 4000)

    return () => window.clearTimeout(timeoutId)
  }, [questionSuccess])

  useEffect(() => {
    if (!answerSuccess) return undefined

    const timeoutId = window.setTimeout(() => {
      setAnswerSuccess('')
    }, 5000)

    return () => window.clearTimeout(timeoutId)
  }, [answerSuccess])

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return undefined

    const intervalId = window.setInterval(() => {
      setCooldownNow(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [cooldownUntil])

  useEffect(() => {
    if (cooldownUntil > 0 && cooldownNow >= cooldownUntil) {
      setCooldownUntil(0)
    }
  }, [cooldownNow, cooldownUntil])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const handleViewportBehavior = () => {
      if (window.innerWidth < 1024) {
        setIsComposerCompact(false)
        return
      }

      setIsComposerCompact(window.scrollY > 220)
    }

    handleViewportBehavior()
    window.addEventListener('scroll', handleViewportBehavior, { passive: true })
    window.addEventListener('resize', handleViewportBehavior)

    return () => {
      window.removeEventListener('scroll', handleViewportBehavior)
      window.removeEventListener('resize', handleViewportBehavior)
    }
  }, [])

  const visibleQuestions = sortedQuestions.filter(
    (question) => question.status === 'approved' && !question.isHidden,
  )

  const cooldownSeconds = Math.max(0, Math.ceil((cooldownUntil - cooldownNow) / 1000))

  const handleSubmitQuestion = async (event) => {
    event.preventDefault()
    if (!questionText.trim()) return
    if (cooldownSeconds > 0) return
    if (!isSessionOpen) {
      setQuestionError('La sesión está pausada. Espera a que moderación reanude preguntas.')
      setQuestionSuccess('')
      return
    }
    if (!actorId) {
      setQuestionError('No se pudo identificar tu usuario para enviar la pregunta.')
      setQuestionSuccess('')
      return
    }

    setSendingQuestion(true)
    setQuestionError('')

    try {
      await createQuestion({
        author: myName,
        userId: actorId,
        content: questionText,
      })
      setQuestionText('')
      setCooldownUntil(Date.now() + 5000)
      setQuestionSuccess('Tu pregunta se envió y quedará visible cuando moderación la apruebe.')
    } catch (error) {
      setQuestionError(error.message || 'No se pudo enviar la pregunta.')
      setQuestionSuccess('')
    } finally {
      setSendingQuestion(false)
    }
  }

  const handleUnlockSession = (event) => {
    event.preventDefault()

    const code = sessionCode.trim()
    if (!code) {
      setSessionCodeError('Ingresa el ID de la sesión activa.')
      return
    }

    if (code !== session?.sessionId) {
      setSessionCodeError('El ID no coincide con la sesión activa.')
      return
    }

    setSessionCodeError('')
    setAuthorizedSessionId(session.sessionId)
  }

  const handleAnswerDraftChange = (questionId, value) => {
    setAnswerDrafts((previous) => ({
      ...previous,
      [questionId]: value,
    }))
  }

  const handleSubmitAnswer = async (event, questionId) => {
    event.preventDefault()

    const answerText = (answerDrafts[questionId] || '').trim()
    if (!answerText) return
    if (sendingAnswerQuestionId === questionId) return
    if (!actorId) {
      setAnswerError('No se pudo identificar tu usuario para responder.')
      setAnswerSuccess('')
      return
    }

    setSendingAnswerQuestionId(questionId)
    setAnswerError('')

    try {
      await addAnswer({
        questionId,
        author: myName,
        userId: actorId,
        content: answerText,
        isModerator: false,
      })

      setAnswerDrafts((previous) => ({
        ...previous,
        [questionId]: '',
      }))
      setExpandedAnswerQuestionId('')
      setAnswerSuccess('Tu respuesta se envió y quedará visible cuando moderación la apruebe.')
    } catch (error) {
      setAnswerError(error.message || 'No se pudo enviar tu respuesta.')
      setAnswerSuccess('')
    } finally {
      setSendingAnswerQuestionId('')
    }
  }

  const handleVoteAnswerCorrectness = async ({ questionId, answerId, voteType }) => {
    if (!actorId) {
      setAnswerError('No se pudo identificar tu usuario para votar esta respuesta.')
      return
    }

    try {
      await voteAnswerCorrectness({
        questionId,
        answerId,
        userId: actorId,
        voteType,
      })
    } catch (error) {
      setAnswerError(error.message || 'No se pudo registrar tu voto en la respuesta.')
    }
  }

  const handleToggleVote = async (question) => {
    if (!actorId) {
      setQuestionError('No se pudo identificar tu usuario para registrar el +1.')
      return
    }

    try {
      await toggleVote({
        questionId: question.id,
        userId: actorId,
      })
    } catch (error) {
      setQuestionError(error.message || 'No se pudo registrar tu voto.')
    }
  }

  if (!hasSessionAccess) {
    return (
      <div className="min-h-screen bg-[#64a2cc] font-sans px-3 py-4 md:px-4 md:py-6 lg:px-6 lg:py-8 flex items-center justify-center">
        <div className="w-full rounded-[2rem] border border-[#64a2cc] bg-[#e6f2fa] p-7 text-center shadow-lg md:p-9">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#3f2abe] mb-2 break-words">
            Ingresar a sesión activa
          </h2>
          <p className="text-sm md:text-base font-semibold mb-6 text-[#3f2abe]">
            Accede con QR o escribe el ID de la sesión activa.
          </p>

          {sidFromUrl && sidFromUrl !== session?.sessionId && (
            <p role="alert" className="mb-4 text-sm font-bold text-[#8b0368] break-words">
              El código QR no corresponde a la sesión activa.
            </p>
          )}

          <form onSubmit={handleUnlockSession}>
            <label htmlFor="participant-session-id" className="mb-1 block text-xs font-bold text-[#3f2abe]">
              ID de sesión activa
            </label>
            <input
              id="participant-session-id"
              type="text"
              required
              maxLength={40}
              value={sessionCode}
              onChange={(event) => setSessionCode(event.target.value)}
              placeholder="ID de sesión"
              aria-invalid={Boolean(sessionCodeError)}
              className="h-12 md:h-14 w-full rounded-full bg-[#e6f2fa] px-5 text-center text-sm md:text-base font-medium text-[#3f2abe] placeholder:text-[#3f2abe] outline-none mb-4"
            />
            <button
              type="submit"
              className="h-12 md:h-14 w-full rounded-full bg-[#3f2abe] text-sm font-bold text-[#e6f2fa] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 md:text-base"
            >
              Validar sesión
            </button>
          </form>

          {sessionCodeError && (
            <p role="alert" className="mt-4 text-sm font-bold text-[#8b0368] break-words">
              {sessionCodeError}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (!isNameSet) {
    return (
      <div className="min-h-screen bg-[#64a2cc] font-sans px-3 py-4 md:px-4 md:py-6 lg:px-6 lg:py-8 flex items-center justify-center">
        <div className="w-full rounded-[2rem] border border-[#64a2cc] bg-[#e6f2fa] p-7 text-center shadow-lg md:p-9">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#3f2abe] mb-2 break-words">
            {session?.title || 'Sesión activa'}
          </h2>
          <p className="text-sm md:text-base font-semibold mb-6 text-[#3f2abe]">
            Ingresa un nombre para participar
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              const trimmedName = myName.trim()
              if (!trimmedName) return

              localStorage.setItem('qna_user_name', trimmedName)
              setMyName(trimmedName)
              setIsNameSet(true)
            }}
          >
            <label htmlFor="participant-name" className="mb-1 block text-xs font-bold text-[#3f2abe]">
              Tu nombre para participar
            </label>
            <input
              id="participant-name"
              type="text"
              required
              maxLength={20}
              autoFocus
              value={myName}
              onChange={(event) => setMyName(event.target.value)}
              placeholder="Tu nombre..."
              className="h-12 md:h-14 w-full rounded-full bg-[#e6f2fa] px-5 text-center text-sm md:text-base font-medium text-[#3f2abe] placeholder:text-[#3f2abe] outline-none mb-4"
            />
            <button
              type="submit"
              className="h-12 md:h-14 w-full rounded-full bg-[#3f2abe] text-sm font-bold text-[#e6f2fa] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 md:text-base"
            >
              Entrar a la sala
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#64a2cc] text-[#3f2abe] font-sans p-3 md:p-4 lg:p-6 pb-[calc(11rem+env(safe-area-inset-bottom))] relative">
      <section className="mx-auto w-full flex flex-col gap-5 md:gap-6">
        <article className="surface-base rounded-[2rem] p-6 shadow-md md:p-7">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight break-words">
            {myName || 'Participante'}
          </h1>
          <p className="mt-2 text-sm md:text-base font-semibold text-[#3f2abe] break-words">
              {session?.title || 'Sesión activa'}
          </p>
          <div className="surface-raised mt-4 rounded-3xl p-5 text-sm md:p-6 md:text-base">
            <p className="font-semibold text-[#3f2abe]">Envía preguntas y respuestas breves para no interrumpir la charla.</p>
            <p className="mt-1 font-semibold text-[#3f2abe]">Preguntas visibles: {visibleQuestions.length}</p>
          </div>

          <p
            role="alert"
            className="alert-warning mt-3 break-words text-sm"
          >
            Tus preguntas y respuestas pasan por moderación antes de mostrarse.
          </p>

          {cooldownSeconds > 0 && (
            <p
              role="status"
              aria-live="polite"
              className="alert-info mt-2 break-words text-sm"
            >
              Puedes enviar otra pregunta en {cooldownSeconds}s.
            </p>
          )}

          {answerSuccess && (
            <p
              role="status"
              aria-live="polite"
              className="alert-success mt-2 break-words text-sm"
            >
              {answerSuccess}
            </p>
          )}

          {(questionError || questionsError) && (
            <p role="alert" className="alert-critical mt-3 break-words text-sm">
              {questionError || questionsError}
            </p>
          )}
          {answerError && (
            <p role="alert" className="alert-critical mt-2 break-words text-sm">
              {answerError}
            </p>
          )}
          {!isSessionOpen && (
            <p className="alert-critical mt-2 text-sm">
              El moderador pausó temporalmente el envío de nuevas preguntas.
            </p>
          )}
        </article>

        <section className="surface-base rounded-[2rem] p-4 shadow-md md:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-[#3f2abe]">Preguntas publicadas</h2>
            <span className="rounded-full bg-[#e6f2fa] px-3 py-1.5 text-xs font-extrabold text-[#3f2abe]">
              {visibleQuestions.length}
            </span>
          </div>

          <div className="flex flex-col gap-3">
          {loadingQuestions && (
            <p className="text-sm md:text-base font-semibold text-[#3f2abe]">Actualizando preguntas...</p>
          )}

          {!loadingQuestions && visibleQuestions.length === 0 && (
            <article className="surface-raised rounded-[2rem] p-9 text-center shadow-md md:p-11">
              <Sparkles size={36} className="mx-auto text-[#3f2abe]" />
              <p className="mt-3 text-lg md:text-xl font-extrabold text-[#3f2abe]">Sin preguntas publicadas por ahora</p>
                <p className="mt-1 text-sm md:text-base font-semibold text-[#3f2abe]">Cuando moderación apruebe preguntas, aparecerán aquí.</p>
            </article>
          )}

          {visibleQuestions.map((question, index) => {
            const hasVoted = Array.isArray(question.upvotedBy)
              ? question.upvotedBy.includes(actorId)
              : false
            const approvedAnswers = Array.isArray(question.answers)
              ? question.answers.filter((answer) => answer.status === 'approved')
              : []

            return (
              <article
                key={question.id}
                className="surface-base live-enter rounded-[2rem] p-5 shadow-sm md:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[#3f2abe]">
                      Pregunta {index + 1}
                    </p>
                    <p className="mt-2 text-base md:text-lg font-semibold text-[#3f2abe] break-words">
                      <span className="font-extrabold">{question.author || 'Anónimo'}:</span>{' '}
                      {question.content}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <p className="text-xs font-extrabold text-[#8b0368]">{question.upvotes || 0} votos</p>
                    <button
                      type="button"
                      onClick={() => handleToggleVote(question)}
                      className={`h-10 w-[130px] rounded-full border border-[#64a2cc] px-3 text-xs font-bold shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 inline-flex items-center justify-center gap-2 ${
                        hasVoted
                          ? 'bg-[#39d3b5] text-[#3f2abe]'
                          : 'bg-[#e6f2fa] text-[#3f2abe]'
                      }`}
                    >
                      <ThumbsUp size={14} />
                      {hasVoted ? 'Me resto' : 'Me sumo'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedAnswerQuestionId(question.id)}
                      className="h-10 w-[130px] rounded-full border border-[#64a2cc] bg-[#e6f2fa] px-3 text-xs font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
                    >
                      Responder
                    </button>
                  </div>
                </div>

                {approvedAnswers.length > 0 && (
                  <div className="mt-3 border-l-4 border-[#64a2cc] pl-3 flex flex-col gap-2">
                    {approvedAnswers.map((answer) => {
                      const correctVoters = Array.isArray(answer.isCorrectVotedBy)
                        ? answer.isCorrectVotedBy
                        : []
                      const incorrectVoters = Array.isArray(answer.isIncorrectVotedBy)
                        ? answer.isIncorrectVotedBy
                        : []
                      const hasCorrectVote = correctVoters.includes(actorId)
                      const hasIncorrectVote = incorrectVoters.includes(actorId)

                      return (
                      <div
                        key={answer.id}
                        className="surface-raised live-enter rounded-2xl p-3"
                      >
                        <p className="text-xs md:text-sm font-bold text-[#3f2abe] break-words">
                          {normalizeAnswerAuthor(answer.author)}
                        </p>
                        <p className="mt-1 text-sm md:text-base font-medium text-[#3f2abe] break-words">{answer.content}</p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleVoteAnswerCorrectness({
                                questionId: question.id,
                                answerId: answer.id,
                                voteType: 'correct',
                              })
                            }
                            className={`h-11 rounded-full border border-[#64a2cc] px-4 text-sm font-bold shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 ${
                              hasCorrectVote
                                ? 'bg-[#39d3b5] text-[#3f2abe]'
                                : 'bg-[#e6f2fa] text-[#3f2abe]'
                            }`}
                          >
                            Es correcto ({answer.isCorrectVotes || 0})
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleVoteAnswerCorrectness({
                                questionId: question.id,
                                answerId: answer.id,
                                voteType: 'incorrect',
                              })
                            }
                            className={`h-11 rounded-full border border-[#64a2cc] px-4 text-sm font-bold shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 ${
                              hasIncorrectVote
                                ? 'bg-[#e08ad4] text-[#3f2abe]'
                                : 'bg-[#e6f2fa] text-[#3f2abe]'
                            }`}
                          >
                            No es correcto ({answer.isIncorrectVotes || 0})
                          </button>
                        </div>
                      </div>
                      )
                    })}
                  </div>
                )}

                {expandedAnswerQuestionId === question.id && (
                  <form
                    onSubmit={(event) => handleSubmitAnswer(event, question.id)}
                    className="surface-raised mt-3 rounded-3xl p-4 shadow-sm flex flex-col gap-2 sm:flex-row sm:items-center"
                  >
                    <label htmlFor={`answer-${question.id}`} className="sr-only">
                      Escribe tu respuesta para la pregunta {index + 1}
                    </label>
                    <input
                      id={`answer-${question.id}`}
                      type="text"
                      maxLength={250}
                      value={answerDrafts[question.id] || ''}
                      onChange={(event) => handleAnswerDraftChange(question.id, event.target.value)}
                      placeholder="Escribe tu respuesta"
                      className="h-11 w-full rounded-full border border-[#64a2cc] bg-[#e6f2fa] px-4 text-sm font-medium text-[#3f2abe] placeholder:text-[#3f2abe] outline-none"
                      disabled={sendingAnswerQuestionId === question.id}
                    />
                    <button
                      type="submit"
                      disabled={sendingAnswerQuestionId === question.id || !(answerDrafts[question.id] || '').trim()}
                      className="h-11 shrink-0 rounded-full bg-[#3f2abe] px-4 text-sm font-bold text-[#e6f2fa] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 disabled:opacity-60"
                    >
                      Responder
                    </button>
                  </form>
                )}
              </article>
            )
          })}
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link to="/" className="h-11 inline-flex items-center justify-center rounded-full bg-[#e6f2fa] px-6 text-sm font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95">
            Volver
          </Link>
        </div>
      </section>

      {questionSuccess && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center p-4">
          <p
            role="status"
            aria-live="polite"
            className="snackbar-center alert-success max-w-[560px] break-words text-sm md:text-base"
          >
            {questionSuccess}
          </p>
        </div>
      )}

      <div className="surface-overlay fixed bottom-0 left-0 right-0 z-30 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <form
          onSubmit={handleSubmitQuestion}
          className={`surface-base mx-auto flex w-full max-w-[1200px] flex-col gap-2 rounded-[2rem] shadow-lg transition-all duration-200 sm:flex-row sm:items-center ${isComposerCompact ? 'p-3 md:p-3' : 'p-4 md:p-5'}`}
        >
          <label htmlFor="participant-question-input" className="sr-only">
            Escribe tu pregunta
          </label>
          {!isComposerCompact && (
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e6f2fa] text-[#3f2abe] sm:inline-flex">
              <MessageSquare size={18} />
            </div>
          )}
          <input
            id="participant-question-input"
            type="text"
            maxLength={100}
            value={questionText}
            onChange={(event) => setQuestionText(event.target.value)}
            placeholder={cooldownSeconds > 0 ? `Espera ${cooldownSeconds}s...` : 'Escribe tu pregunta'}
            className="h-12 md:h-14 w-full rounded-full bg-[#e6f2fa] px-5 text-sm md:text-base font-medium text-[#3f2abe] placeholder:text-[#3f2abe] outline-none"
            disabled={sendingQuestion || cooldownSeconds > 0}
          />
          <button
            type="submit"
            disabled={
              sendingQuestion ||
              cooldownSeconds > 0 ||
              !questionText.trim()
            }
            className="h-12 md:h-14 shrink-0 rounded-full bg-[#3f2abe] px-5 text-sm md:text-base font-bold text-[#e6f2fa] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 disabled:opacity-60 inline-flex items-center gap-2"
          >
            <SendHorizontal size={16} />
            Enviar pregunta
          </button>
        </form>
      </div>
    </main>
  )
}
