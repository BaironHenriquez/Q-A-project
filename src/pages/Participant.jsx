import { useEffect, useState } from 'react'
import { Hand, MessageSquare, SendHorizontal, Sparkles } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useQuestions } from '../hooks/useQuestions'

const PARTICIPANT_ID_KEY = 'qna_participant_id'
const PARTICIPANT_NAME_KEY = 'qna_user_name'
const PARTICIPANT_AFFILIATION_KEY = 'qna_user_affiliation'
const PARTICIPANT_AFFILIATION_DETAIL_KEY = 'qna_user_affiliation_detail'
const QUESTION_MAX_LENGTH = 500

const AFFILIATION_OPTIONS = [
  'Alcaldía',
  'Administración Municipal',
  'Juzgados de Policía Local',
  'Secretaría Municipal',
  'Secretaría Comunal de Planificación',
  'Dirección de Administración y Finanzas',
  'Dirección Jurídica',
  'Dirección de Control',
  'Dirección de Obras Municipales',
  'Dirección de Tránsito',
  'Dirección de Medioambiente, Aseo y Ornato',
  'Dirección de Desarrollo Comunitario',
  'Dirección de Servicios Traspasados',
  'Dirección de Concesiones',
  'Dirección de Operaciones',
  'Dirección de Turismo',
  'Dirección de Seguridad Pública',
  'Externo',
  'Otro',
]

const REQUIRES_AFFILIATION_DETAIL = new Set(['Externo', 'Otro'])

const getStoredValue = (key) => {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(key) || ''
}

const hasCompleteParticipantProfile = () => {
  const storedName = getStoredValue(PARTICIPANT_NAME_KEY).trim()
  const storedAffiliation = getStoredValue(PARTICIPANT_AFFILIATION_KEY).trim()
  const storedAffiliationDetail = getStoredValue(PARTICIPANT_AFFILIATION_DETAIL_KEY).trim()

  if (!storedName || !storedAffiliation) return false
  if (!REQUIRES_AFFILIATION_DETAIL.has(storedAffiliation)) return true

  return Boolean(storedAffiliationDetail)
}

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
    () => getStoredValue(PARTICIPANT_NAME_KEY),
  )
  const [selectedAffiliation, setSelectedAffiliation] = useState(
    () => getStoredValue(PARTICIPANT_AFFILIATION_KEY),
  )
  const [affiliationDetail, setAffiliationDetail] = useState(
    () => getStoredValue(PARTICIPANT_AFFILIATION_DETAIL_KEY),
  )
  const [isAffiliationPickerOpen, setIsAffiliationPickerOpen] = useState(false)
  const [affiliationSearch, setAffiliationSearch] = useState('')
  const [profileError, setProfileError] = useState('')
  const [isNameSet, setIsNameSet] = useState(
    hasCompleteParticipantProfile,
  )
  const [questionText, setQuestionText] = useState('')
  const [sendingQuestion, setSendingQuestion] = useState(false)
  const [questionError, setQuestionError] = useState('')
  const [questionSuccess, setQuestionSuccess] = useState('')
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [cooldownNow, setCooldownNow] = useState(() => Date.now())
  const [answerCooldownUntil, setAnswerCooldownUntil] = useState(0)
  const [answerCooldownNow, setAnswerCooldownNow] = useState(() => Date.now())
  const [answerDrafts, setAnswerDrafts] = useState({})
  const [expandedAnswerQuestionId, setExpandedAnswerQuestionId] = useState('')
  const [sendingAnswerQuestionId, setSendingAnswerQuestionId] = useState('')
  const [answerError, setAnswerError] = useState('')
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
    if (answerCooldownUntil <= Date.now()) return undefined

    const intervalId = window.setInterval(() => {
      setAnswerCooldownNow(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [answerCooldownUntil])

  useEffect(() => {
    if (answerCooldownUntil > 0 && answerCooldownNow >= answerCooldownUntil) {
      setAnswerCooldownUntil(0)
    }
  }, [answerCooldownNow, answerCooldownUntil])

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

  const filteredAffiliations = AFFILIATION_OPTIONS.filter((option) =>
    option.toLowerCase().includes(affiliationSearch.trim().toLowerCase()),
  )

  const requiresAffiliationDetail = REQUIRES_AFFILIATION_DETAIL.has(selectedAffiliation)

  const cooldownSeconds = Math.max(0, Math.ceil((cooldownUntil - cooldownNow) / 1000))
  const answerCooldownSeconds = Math.max(0, Math.ceil((answerCooldownUntil - answerCooldownNow) / 1000))
  const questionLength = questionText.length
  const isQuestionOverLimit = questionLength > QUESTION_MAX_LENGTH

  const handleSubmitQuestion = async (event) => {
    event.preventDefault()
    if (!questionText.trim()) return
    if (isQuestionOverLimit) {
      setQuestionError(`La pregunta supera el límite de ${QUESTION_MAX_LENGTH} caracteres.`)
      setQuestionSuccess('')
      return
    }
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
    if (answerCooldownSeconds > 0) {
      setAnswerError(`Puedes enviar otra respuesta en ${answerCooldownSeconds}s.`)
      setQuestionSuccess('')
      return
    }
    if (!actorId) {
      setAnswerError('No se pudo identificar tu usuario para responder.')
      setQuestionSuccess('')
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
      setAnswerCooldownUntil(Date.now() + 5000)
      setQuestionSuccess('Tu respuesta se envió y quedará visible cuando moderación la apruebe.')
    } catch (error) {
      setAnswerError(error.message || 'No se pudo enviar tu respuesta.')
      setQuestionSuccess('')
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
      setQuestionError('No se pudo identificar tu usuario para registrar tu me sumo.')
      return
    }

    if (String(question.userId || '').trim() === String(actorId || '').trim()) {
      setQuestionError('No puedes sumarte a tu propia pregunta.')
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

  const handleSelectAffiliation = (option) => {
    setSelectedAffiliation(option)
    setProfileError('')
    setIsAffiliationPickerOpen(false)

    if (!REQUIRES_AFFILIATION_DETAIL.has(option)) {
      setAffiliationDetail('')
    }
  }

  const handleEnterParticipantRoom = (event) => {
    event.preventDefault()

    const trimmedName = myName.trim()
    const trimmedAffiliationDetail = affiliationDetail.trim()

    if (!trimmedName) {
      setProfileError('Ingresa tu nombre para participar.')
      return
    }

    if (!selectedAffiliation) {
      setProfileError('Selecciona tu área o institución para continuar.')
      return
    }

    if (requiresAffiliationDetail && !trimmedAffiliationDetail) {
      setProfileError(`Debes indicar a qué corresponde "${selectedAffiliation}".`)
      return
    }

    setProfileError('')
    localStorage.setItem(PARTICIPANT_NAME_KEY, trimmedName)
    localStorage.setItem(PARTICIPANT_AFFILIATION_KEY, selectedAffiliation)

    if (requiresAffiliationDetail) {
      localStorage.setItem(PARTICIPANT_AFFILIATION_DETAIL_KEY, trimmedAffiliationDetail)
      setAffiliationDetail(trimmedAffiliationDetail)
    } else {
      localStorage.removeItem(PARTICIPANT_AFFILIATION_DETAIL_KEY)
      setAffiliationDetail('')
    }

    setMyName(trimmedName)
    setIsNameSet(true)
  }

  const handleReturnToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    setExpandedAnswerQuestionId('')
    setAnswerError('')
  }

  if (!hasSessionAccess) {
    return (
      <div className="min-h-screen bg-[#64a2cc] font-sans px-3 py-4 md:px-4 md:py-6 lg:px-6 lg:py-8 flex items-center justify-center">
        <div className="surface-base w-full rounded-[2rem] p-7 text-center shadow-lg md:p-9">
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
        <div className="surface-base w-full rounded-[2rem] p-7 text-center shadow-lg md:p-9">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#3f2abe] mb-2 break-words">
            {session?.title || 'Sesión activa'}
          </h2>
          <p className="text-sm md:text-base font-semibold mb-6 text-[#3f2abe]">
            Ingresa tu nombre y selecciona tu área para participar
          </p>
          <form onSubmit={handleEnterParticipantRoom} className="text-left">
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

            <label className="mb-1 block text-xs font-bold text-[#3f2abe]">
              Selecciona tu área o institución
            </label>
            <button
              type="button"
              onClick={() => setIsAffiliationPickerOpen((previous) => !previous)}
              aria-expanded={isAffiliationPickerOpen}
              className="surface-raised mb-3 flex h-11 w-full items-center justify-between rounded-full px-4 text-sm font-semibold text-[#3f2abe] shadow-sm"
            >
              <span className="truncate">
                {selectedAffiliation || 'Pulsa para abrir la lista'}
              </span>
              <span className="ml-3 text-xs font-extrabold">{isAffiliationPickerOpen ? 'Cerrar' : 'Abrir'}</span>
            </button>

            {isAffiliationPickerOpen && (
              <div className="surface-raised mb-3 rounded-2xl p-3 shadow-sm">
                <label htmlFor="participant-affiliation-search" className="mb-1 block text-xs font-bold text-[#3f2abe]">
                  Buscar área o institución
                </label>
                <input
                  id="participant-affiliation-search"
                  type="text"
                  value={affiliationSearch}
                  onChange={(event) => setAffiliationSearch(event.target.value)}
                  placeholder="Busca en la lista"
                  className="h-10 w-full rounded-full bg-[#e6f2fa] px-4 text-sm font-medium text-[#3f2abe] placeholder:text-[#3f2abe] outline-none"
                />

                <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-[#64a2cc] bg-[#e6f2fa] p-2">
                  {filteredAffiliations.length > 0 ? (
                    filteredAffiliations.map((option) => {
                      const isSelected = selectedAffiliation === option

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleSelectAffiliation(option)}
                          className={`mb-1 flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${
                            isSelected
                              ? 'bg-[#3f2abe] text-[#e6f2fa]'
                              : 'text-[#3f2abe] hover:bg-[#d9ecf8]'
                          }`}
                        >
                          {option}
                        </button>
                      )
                    })
                  ) : (
                    <p className="px-2 py-3 text-sm font-semibold text-[#3f2abe]">
                      Sin coincidencias para tu búsqueda.
                    </p>
                  )}
                </div>
              </div>
            )}

            {requiresAffiliationDetail && (
              <>
                <label htmlFor="participant-affiliation-detail" className="mb-1 block text-xs font-bold text-[#3f2abe] text-left">
                  Especifica cuál ({selectedAffiliation})
                </label>
                <input
                  id="participant-affiliation-detail"
                  type="text"
                  required
                  maxLength={80}
                  value={affiliationDetail}
                  onChange={(event) => {
                    setAffiliationDetail(event.target.value)
                    setProfileError('')
                  }}
                  placeholder="Escribe tu área o institución"
                  className="h-11 w-full rounded-full bg-[#e6f2fa] px-4 text-sm font-medium text-[#3f2abe] placeholder:text-[#3f2abe] outline-none mb-4"
                />
              </>
            )}

            {profileError && (
              <p role="alert" className="alert-critical mb-3 break-words text-sm text-left">
                {profileError}
              </p>
            )}

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
          <h1 className="type-page-title break-words">
            {myName || 'Participante'}
          </h1>
          <p className="type-page-subtitle mt-2 text-[#3f2abe] break-words">
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

          {answerCooldownSeconds > 0 && (
            <p
              role="status"
              aria-live="polite"
              className="alert-info mt-2 break-words text-sm"
            >
              Puedes enviar otra respuesta en {answerCooldownSeconds}s.
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
            <h2 className="type-section-title text-[#3f2abe]">Preguntas publicadas</h2>
            <span className="surface-raised rounded-full px-3 py-1.5 text-xs font-extrabold text-[#3f2abe]">
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
                    <p className="type-label-caps text-[#3f2abe]">
                      Pregunta {index + 1}
                    </p>
                      <p className="type-card-title mt-2 text-[#3f2abe] break-words">
                      <span className="font-extrabold">{question.author || 'Anónimo'}:</span>{' '}
                      {question.content}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <p className="type-meta text-[#8b0368]">{question.upvotes || 0} votos</p>
                    <button
                      type="button"
                      onClick={() => handleToggleVote(question)}
                      disabled={String(question.userId || '').trim() === String(actorId || '').trim()}
                      className={`h-10 min-w-[195px] rounded-full border border-[#64a2cc] px-3 text-xs font-bold shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 inline-flex items-center justify-center gap-2 ${
                        String(question.userId || '').trim() === String(actorId || '').trim()
                          ? 'bg-[#d9ecf8] text-[#3f2abe] opacity-70 cursor-not-allowed'
                          : hasVoted
                          ? 'bg-[#39d3b5] text-[#3f2abe]'
                          : 'surface-raised text-[#3f2abe]'
                      }`}
                      title={String(question.userId || '').trim() === String(actorId || '').trim() ? 'No puedes sumarte a tu propia pregunta' : undefined}
                    >
                      <Hand size={14} />
                      Me sumo a la pregunta
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedAnswerQuestionId(question.id)}
                      className="surface-raised h-10 w-[130px] rounded-full px-3 text-xs font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
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
                      disabled={
                        sendingAnswerQuestionId === question.id ||
                        answerCooldownSeconds > 0 ||
                        !(answerDrafts[question.id] || '').trim()
                      }
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
          <button
            type="button"
            onClick={handleReturnToTop}
            className="h-11 inline-flex items-center justify-center rounded-full bg-[#e6f2fa] px-6 text-sm font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
          >
            Volver arriba
          </button>
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
            value={questionText}
            onChange={(event) => {
              setQuestionText(event.target.value)
            }}
            placeholder={cooldownSeconds > 0 ? `Espera ${cooldownSeconds}s...` : 'Escribe tu pregunta'}
            className="h-12 md:h-14 w-full rounded-full bg-[#e6f2fa] px-5 text-sm md:text-base font-medium text-[#3f2abe] placeholder:text-[#3f2abe] outline-none"
            disabled={sendingQuestion || cooldownSeconds > 0}
          />
          <p className={`px-2 text-xs font-semibold ${isQuestionOverLimit ? 'text-[#8b0368]' : 'text-[#3f2abe]'}`}>
            {questionLength}/{QUESTION_MAX_LENGTH} caracteres
          </p>
          {isQuestionOverLimit && (
            <p role="alert" className="alert-warning px-2 text-xs">
              La pregunta excede el máximo permitido. Reduce el texto para poder enviarla.
            </p>
          )}
          <button
            type="submit"
            disabled={
              sendingQuestion ||
              cooldownSeconds > 0 ||
              isQuestionOverLimit ||
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
