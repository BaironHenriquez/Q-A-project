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

export default function Participant({ user, session }) {
  const [searchParams] = useSearchParams()
  const sidFromUrl = (searchParams.get('sid') || '').trim()
  const [participantId] = useState(getOrCreateParticipantId)

  const [sessionCode, setSessionCode] = useState('')
  const [sessionCodeError, setSessionCodeError] = useState('')
  const [hasSessionAccess, setHasSessionAccess] = useState(false)

  const [myName, setMyName] = useState(
    () => localStorage.getItem('qna_user_name') || '',
  )
  const [isNameSet, setIsNameSet] = useState(
    () => Boolean(localStorage.getItem('qna_user_name')),
  )
  const [questionText, setQuestionText] = useState('')
  const [sendingQuestion, setSendingQuestion] = useState(false)
  const [questionError, setQuestionError] = useState('')
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [answerDrafts, setAnswerDrafts] = useState({})
  const [sendingAnswerQuestionId, setSendingAnswerQuestionId] = useState('')
  const [answerError, setAnswerError] = useState('')
  const actorId = user?.uid || participantId || ''

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
    if (!session?.sessionId) return
    if (!sidFromUrl) return

    if (sidFromUrl === session.sessionId) {
      setHasSessionAccess(true)
      setSessionCodeError('')
    }
  }, [session?.sessionId, sidFromUrl])

  const visibleQuestions = sortedQuestions.filter(
    (question) => question.status === 'approved' && !question.isHidden,
  )

  const cooldownSeconds = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))

  const handleSubmitQuestion = async (event) => {
    event.preventDefault()
    if (!questionText.trim()) return
    if (cooldownSeconds > 0) return
    if (!session?.isAcceptingQuestions) return
    if (!actorId) {
      setQuestionError('No se pudo identificar tu usuario para enviar la pregunta.')
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
    } catch (error) {
      setQuestionError(error.message || 'No se pudo enviar la pregunta.')
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
    setHasSessionAccess(true)
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
    } catch (error) {
      setAnswerError(error.message || 'No se pudo enviar tu respuesta.')
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
      <div className="min-h-screen bg-[#f8fbfe] font-sans px-4 py-6 md:py-10 flex items-center justify-center">
        <div className="w-full max-w-md p-6 md:p-8 rounded-[2rem] bg-white shadow-lg text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#3f2abe] mb-2 break-words">
            Ingresar a sesión activa
          </h2>
          <p className="text-sm md:text-base font-medium mb-6 text-[#716274]">
            Accede con QR o escribe el ID de la sesión activa.
          </p>

          {sidFromUrl && sidFromUrl !== session?.sessionId && (
            <p className="mb-4 text-sm font-bold text-[#8b0368] break-words">
                El codigo QR no corresponde a la sesion activa.
            </p>
          )}

          <form onSubmit={handleUnlockSession}>
            <input
              type="text"
              required
              maxLength={40}
              value={sessionCode}
              onChange={(event) => setSessionCode(event.target.value)}
              placeholder="ID de sesión"
              className="h-12 md:h-14 w-full rounded-full bg-[#f8fbfe] px-5 text-center text-sm md:text-base font-medium text-[#3f2abe] placeholder:text-[#716274] outline-none mb-4"
            />
            <button
              type="submit"
              className="h-12 md:h-14 w-full rounded-full text-sm md:text-base font-bold text-white bg-[#0a79e8] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
            >
              Validar sesión
            </button>
          </form>

          {sessionCodeError && (
            <p className="mt-4 text-sm font-bold text-[#8b0368] break-words">{sessionCodeError}</p>
          )}
        </div>
      </div>
    )
  }

  if (!isNameSet) {
    return (
      <div className="min-h-screen bg-[#f8fbfe] font-sans px-4 py-6 md:py-10 flex items-center justify-center">
        <div className="w-full max-w-sm p-6 md:p-8 rounded-[2rem] bg-white shadow-lg text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#3f2abe] mb-2 break-words">
            {session?.title || 'Sesión activa'}
          </h2>
          <p className="text-sm md:text-base font-medium mb-6 text-[#716274]">
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
            <input
              type="text"
              required
              maxLength={20}
              autoFocus
              value={myName}
              onChange={(event) => setMyName(event.target.value)}
              placeholder="Tu nombre..."
              className="h-12 md:h-14 w-full rounded-full bg-[#f8fbfe] px-5 text-center text-sm md:text-base font-medium text-[#3f2abe] placeholder:text-[#716274] outline-none mb-4"
            />
            <button
              type="submit"
              className="h-12 md:h-14 w-full rounded-full text-sm md:text-base font-bold text-white bg-[#0a79e8] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
            >
              Entrar a la sala
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#f8fbfe] text-[#3f2abe] font-sans p-4 md:p-8 pb-[calc(11rem+env(safe-area-inset-bottom))] md:pb-8 relative">
      <section className="mx-auto max-w-3xl flex flex-col gap-4 md:gap-5">
        <article className="rounded-[2rem] bg-white p-5 md:p-6 shadow-sm">
          <h1 className="text-2xl md:text-3xl font-bold">Participante</h1>
          <p className="mt-2 text-sm md:text-base font-medium text-[#716274] break-words">
              {session?.title || 'Sesión activa'}
          </p>
          <div className="mt-4 rounded-3xl bg-[#e6f2fa] p-4 md:p-5 text-sm md:text-base">
            <p className="font-bold text-[#3f2abe]">Hola, {myName}</p>
              <p className="mt-1 font-medium text-[#716274] break-words">UID: {actorId || 'anónimo'}</p>
            <p className="mt-1 font-medium text-[#716274]">Preguntas visibles: {visibleQuestions.length}</p>
            <p className="mt-1 font-medium text-[#716274]">
              Las respuestas de participantes pasan por moderación antes de mostrarse.
            </p>
          </div>
          {(questionError || questionsError) && (
            <p className="mt-3 text-sm font-bold text-[#8b0368] break-words">
              {questionError || questionsError}
            </p>
          )}
          {answerError && (
            <p className="mt-2 text-sm font-bold text-[#8b0368] break-words">{answerError}</p>
          )}
          {!session?.isAcceptingQuestions && (
            <p className="mt-2 text-sm font-bold text-[#8b0368]">
              El moderador pausó temporalmente el envío de nuevas preguntas.
            </p>
          )}
        </article>

        <section className="rounded-[2rem] bg-[#e6f2fa] p-3 md:p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg md:text-xl font-bold text-[#3f2abe]">Preguntas publicadas</h2>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#3f2abe]">
              {visibleQuestions.length}
            </span>
          </div>

          <div className="flex flex-col gap-3">
          {loadingQuestions && (
            <p className="text-sm md:text-base font-medium text-[#716274]">Actualizando preguntas...</p>
          )}

          {!loadingQuestions && visibleQuestions.length === 0 && (
            <article className="rounded-[2rem] bg-white p-8 md:p-10 shadow-sm text-center">
              <Sparkles size={36} className="mx-auto text-[#716274]" />
              <p className="mt-3 text-lg md:text-xl font-bold text-[#3f2abe]">Sin preguntas publicadas por ahora</p>
                <p className="mt-1 text-sm md:text-base font-medium text-[#716274]">Cuando moderación apruebe preguntas, aparecerán aquí.</p>
            </article>
          )}

          {visibleQuestions.map((question, index) => {
            const hasVoted = Array.isArray(question.upvotedBy)
              ? question.upvotedBy.includes(actorId)
              : false
            const approvedAnswers = Array.isArray(question.answers)
              ? question.answers.filter((answer) => answer.status === 'approved')
              : []
            const myPendingAnswers = Array.isArray(question.answers)
              ? question.answers.filter(
                  (answer) => answer.status === 'pending' && answer.userId === actorId,
                )
              : []

            return (
              <article key={question.id} className="rounded-[2rem] border border-[#d2e5f3] bg-white p-5 md:p-6 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#716274]">
                  Pregunta {index + 1}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#716274]">
                  <span className="rounded-full bg-[#e6f2fa] px-3 py-1">
                    {question.status || 'pending'}
                  </span>
                    <span>{question.author || 'Anónimo'}</span>
                </div>
                <p className="mt-3 text-base md:text-lg font-medium text-[#3f2abe] break-words">{question.content}</p>

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
                      <div key={answer.id} className="rounded-2xl bg-gray-50 p-3">
                        <p className="text-xs md:text-sm font-bold text-[#716274] break-words">{answer.author}</p>
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
                            className={`h-9 rounded-full px-4 text-xs font-bold shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 ${
                              hasCorrectVote
                                ? 'bg-[#39d3b4] text-[#3f2abe]'
                                : 'bg-white text-[#3f2abe]'
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
                            className={`h-9 rounded-full px-4 text-xs font-bold shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 ${
                              hasIncorrectVote
                                ? 'bg-[#e08ad4] text-[#3f2abe]'
                                : 'bg-white text-[#3f2abe]'
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

                {myPendingAnswers.length > 0 && (
                  <div className="mt-3 rounded-2xl bg-[#e6f2fa] p-3">
                    <p className="text-xs font-bold text-[#716274]">Tienes respuestas pendientes de revisión:</p>
                    <div className="mt-2 flex flex-col gap-2">
                      {myPendingAnswers.map((answer) => (
                        <p key={answer.id} className="text-sm font-medium text-[#3f2abe] break-words">
                          {answer.content}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <form
                  onSubmit={(event) => handleSubmitAnswer(event, question.id)}
                  className="mt-4 rounded-3xl bg-[#f8fbfe] p-3 flex items-center gap-2"
                >
                  <input
                    type="text"
                    maxLength={250}
                    value={answerDrafts[question.id] || ''}
                    onChange={(event) => handleAnswerDraftChange(question.id, event.target.value)}
                    placeholder="Responder a esta pregunta"
                    className="h-11 w-full rounded-full bg-white px-4 text-sm font-medium text-[#3f2abe] placeholder:text-[#716274] outline-none"
                    disabled={sendingAnswerQuestionId === question.id}
                  />
                  <button
                    type="submit"
                    disabled={sendingAnswerQuestionId === question.id || !(answerDrafts[question.id] || '').trim()}
                    className="h-11 shrink-0 rounded-full bg-white px-4 text-xs font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 disabled:opacity-60"
                  >
                    Responder
                  </button>
                </form>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleVote(question)}
                    className={`h-12 rounded-full px-5 text-sm md:text-base font-bold shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 inline-flex items-center gap-2 ${
                      hasVoted
                        ? 'bg-[#39d3b4] text-[#3f2abe]'
                        : 'bg-[#e6f2fa] text-[#3f2abe]'
                    }`}
                  >
                    <ThumbsUp size={16} />
                    {hasVoted ? '-1 me resto' : '+1 me sumo'}
                  </button>
                  <p className="text-sm md:text-base font-bold text-[#0a79e8]">{question.upvotes || 0}</p>
                </div>
              </article>
            )
          })}
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link to="/" className="h-11 inline-flex items-center justify-center rounded-full bg-white px-6 text-sm font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95">
            Volver
          </Link>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-30 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-[#f8fbfe] md:static md:p-0">
        <form
          onSubmit={handleSubmitQuestion}
          className="mx-auto max-w-3xl rounded-[2rem] bg-white p-3 md:p-4 shadow-lg flex items-center gap-2"
        >
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e6f2fa] text-[#3f2abe]">
            <MessageSquare size={18} />
          </div>
          <input
            type="text"
            maxLength={100}
            value={questionText}
            onChange={(event) => setQuestionText(event.target.value)}
            placeholder={cooldownSeconds > 0 ? `Espera ${cooldownSeconds}s...` : 'Escribe tu pregunta'}
            className="h-12 md:h-14 w-full rounded-full bg-[#f8fbfe] px-5 text-sm md:text-base font-medium text-[#3f2abe] placeholder:text-[#716274] outline-none"
            disabled={sendingQuestion || cooldownSeconds > 0 || !session?.isAcceptingQuestions}
          />
          <button
            type="submit"
            disabled={
              sendingQuestion ||
              cooldownSeconds > 0 ||
              !questionText.trim() ||
              !session?.isAcceptingQuestions
            }
            className="h-12 md:h-14 shrink-0 rounded-full bg-[#0a79e8] px-5 text-sm md:text-base font-bold text-white shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 disabled:opacity-60 inline-flex items-center gap-2"
          >
            <SendHorizontal size={16} />
            Enviar
          </button>
        </form>
      </div>
    </main>
  )
}
