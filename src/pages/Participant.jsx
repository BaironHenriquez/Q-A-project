import { useState } from 'react'
import { MessageSquare, SendHorizontal, Sparkles, ThumbsUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuestions } from '../hooks/useQuestions'

export default function Participant({ user, session }) {
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

  const {
    sortedQuestions,
    loadingQuestions,
    questionsError,
    createQuestion,
    toggleVote,
  } = useQuestions(
    isNameSet ? session?.sessionId : null,
  )

  const visibleQuestions = sortedQuestions.filter((question) => !question.isHidden)

  const cooldownSeconds = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))

  const handleSubmitQuestion = async (event) => {
    event.preventDefault()
    if (!questionText.trim()) return
    if (cooldownSeconds > 0) return

    setSendingQuestion(true)
    setQuestionError('')

    try {
      await createQuestion({
        author: myName,
        userId: user?.uid,
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

  const handleToggleVote = async (question) => {
    try {
      const hasVoted = Array.isArray(question.upvotedBy)
        ? question.upvotedBy.includes(user?.uid)
        : false

      await toggleVote({
        questionId: question.id,
        userId: user?.uid,
        hasVoted,
      })
    } catch (error) {
      setQuestionError(error.message || 'No se pudo registrar tu voto.')
    }
  }

  if (!isNameSet) {
    return (
      <div className="min-h-screen bg-[#f8fbfe] font-sans px-4 py-6 md:py-10 flex items-center justify-center">
        <div className="w-full max-w-sm p-6 md:p-8 rounded-[2rem] bg-white shadow-lg text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#3f2abe] mb-2 break-words">
            {session?.title || 'Sesion activa'}
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
            {session?.title || 'Sesion activa'}
          </p>
          <div className="mt-4 rounded-3xl bg-[#e6f2fa] p-4 md:p-5 text-sm md:text-base">
            <p className="font-bold text-[#3f2abe]">Hola, {myName}</p>
            <p className="mt-1 font-medium text-[#716274] break-words">UID: {user?.uid || 'anonimo'}</p>
            <p className="mt-1 font-medium text-[#716274]">Preguntas visibles: {visibleQuestions.length}</p>
          </div>
          {(questionError || questionsError) && (
            <p className="mt-3 text-sm font-bold text-[#8b0368] break-words">
              {questionError || questionsError}
            </p>
          )}
        </article>

        <div className="flex flex-col gap-3">
          {loadingQuestions && (
            <p className="text-sm md:text-base font-medium text-[#716274]">Actualizando preguntas...</p>
          )}

          {!loadingQuestions && visibleQuestions.length === 0 && (
            <article className="rounded-[2rem] bg-white p-8 md:p-10 shadow-sm text-center">
              <Sparkles size={36} className="mx-auto text-[#716274]" />
              <p className="mt-3 text-lg md:text-xl font-bold text-[#3f2abe]">La audiencia esta pensando...</p>
              <p className="mt-1 text-sm md:text-base font-medium text-[#716274]">Se el primero en lanzar una pregunta.</p>
            </article>
          )}

          {visibleQuestions.map((question) => {
            const hasVoted = Array.isArray(question.upvotedBy)
              ? question.upvotedBy.includes(user?.uid)
              : false

            return (
              <article key={question.id} className="rounded-[2rem] bg-white p-5 md:p-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#716274]">
                  <span className="rounded-full bg-[#e6f2fa] px-3 py-1">
                    {question.status || 'pending'}
                  </span>
                  <span>{question.author || 'Anonimo'}</span>
                </div>
                <p className="mt-3 text-base md:text-lg font-medium text-[#3f2abe] break-words">{question.content}</p>

                {Array.isArray(question.answers) && question.answers.length > 0 && (
                  <div className="mt-3 border-l-4 border-[#64a2cc] pl-3 flex flex-col gap-2">
                    {question.answers.map((answer) => (
                      <div key={answer.id} className="rounded-2xl bg-gray-50 p-3">
                        <p className="text-xs md:text-sm font-bold text-[#716274] break-words">{answer.author}</p>
                        <p className="mt-1 text-sm md:text-base font-medium text-[#3f2abe] break-words">{answer.content}</p>
                      </div>
                    ))}
                  </div>
                )}

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
                    {hasVoted ? 'Votaste' : 'Votar'}
                  </button>
                  <p className="text-sm md:text-base font-bold text-[#0a79e8]">{question.upvotes || 0}</p>
                </div>
              </article>
            )
          })}
        </div>

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
            disabled={sendingQuestion || cooldownSeconds > 0}
          />
          <button
            type="submit"
            disabled={sendingQuestion || cooldownSeconds > 0 || !questionText.trim()}
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
