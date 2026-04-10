import { useMemo } from 'react'
import { MessageSquare } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Link } from 'react-router-dom'
import { useQuestions } from '../hooks/useQuestions'

export default function Presentation({ session }) {
  const joinUrl = `${window.location.origin}/participante?sid=${encodeURIComponent(
    session?.sessionId || '',
  )}`
  const { approvedQuestions } = useQuestions(session?.sessionId)
  const featuredQuestions = useMemo(
    () =>
      [...approvedQuestions]
        .sort((left, right) => (right.createdAt || 0) - (left.createdAt || 0))
        .slice(0, 9),
    [approvedQuestions],
  )
  const focusQuestion = featuredQuestions[0] || null
  const secondaryQuestions = featuredQuestions.slice(1)

  return (
    <main className="min-h-screen bg-[#64a2cc] text-[#3f2abe] font-sans p-3 md:p-4 lg:p-6">
      <section className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full flex-wrap items-start gap-6 lg:gap-7">
        <aside className="surface-base w-full rounded-[2rem] p-5 shadow-md sm:p-7 md:w-[320px] md:flex-none md:p-8 lg:p-9 xl:w-[350px]">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Acceso audiencia</h2>
          <p className="mt-2 text-sm md:text-base font-semibold text-[#3f2abe] leading-relaxed">
            Escanea y entra directo a la vista de participante.
          </p>
          <div className="mt-5 flex w-full justify-center">
            <div className="surface-raised inline-flex w-full max-w-[320px] justify-center rounded-3xl p-3 shadow-sm sm:p-4 lg:p-5">
              <QRCodeSVG
                value={joinUrl}
                size={300}
                bgColor="#e6f2fa"
                fgColor="#3f2abe"
                level="H"
                style={{ width: '100%', maxWidth: '280px', height: 'auto' }}
              />
            </div>
          </div>
          <p className="surface-raised mt-4 rounded-2xl break-words px-4 py-3 text-sm font-bold text-[#8b0368] md:text-base">
            {joinUrl}
          </p>
          <Link
            to="/moderador"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#3f2abe] px-5 text-sm font-bold text-[#e6f2fa] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 md:px-6 md:text-base"
          >
            Volver a moderador
          </Link>
        </aside>

        <article className="surface-base min-w-[300px] flex-1 rounded-[2rem] p-6 shadow-md md:p-9 lg:p-11">
          <h1 className="type-page-title break-words">
            {session?.title || 'Sesión sin título'}
          </h1>
          <p className="type-page-subtitle mt-2 text-[#3f2abe] break-words">Presentación en vivo</p>

          {!session?.isAcceptingQuestions && (
            <div className="alert-critical mt-4 text-sm md:text-base">
              El moderador pausó temporalmente la recepción de nuevas preguntas.
            </div>
          )}

          <div className="mt-6 flex-1 overflow-y-auto pr-1">
            {!approvedQuestions.length && (
              <div className="surface-raised rounded-3xl p-8 text-center shadow-sm md:p-11 lg:p-16">
                <MessageSquare size={44} className="mx-auto text-[#3f2abe]" />
                <p className="mt-3 text-lg md:text-xl lg:text-2xl font-extrabold text-[#3f2abe]">
                  Aún no hay preguntas destacadas
                </p>
                <p className="mt-1 text-sm md:text-base font-semibold text-[#3f2abe]">
                  La audiencia está calentando motores.
                </p>
              </div>
            )}

            {!!featuredQuestions.length && (
              <div>
                {Boolean(focusQuestion) && (() => {
                  const approvedAnswers = Array.isArray(focusQuestion.answers)
                    ? focusQuestion.answers
                        .filter((answer) => answer.status === 'approved')
                        .sort((left, right) => (right.createdAt || 0) - (left.createdAt || 0))
                    : []
                  const latestApprovedAnswer = approvedAnswers[0]
                  const hiddenAnswersCount = Math.max(0, approvedAnswers.length - 1)
                  const answersLabel = approvedAnswers.length > 1 ? 'Respuestas' : 'Respuesta'

                  return (
                    <article className="surface-base live-enter rounded-3xl p-5 shadow-sm md:p-6">
                      <span className="inline-flex rounded-full bg-[#39d3b5] px-3 py-1 text-xs font-extrabold text-[#3f2abe]">
                        Mas reciente
                      </span>
                      {focusQuestion.isPinned && (
                        <span className="ml-2 inline-flex rounded-full bg-[#e08ad4] px-3 py-1 text-xs font-bold text-[#3f2abe]">
                          Fijada
                        </span>
                      )}
                      <p className="type-card-title mt-2 text-[#3f2abe] break-words md:text-2xl">
                        <span className="font-black">{focusQuestion.author || 'Anónimo'}:</span>{' '}
                        {focusQuestion.content}
                      </p>
                      <div className="mt-2 flex items-center justify-end">
                        <p className="type-meta text-[#8b0368]">
                          {focusQuestion.upvotes || 0} votos
                        </p>
                      </div>

                      {Boolean(latestApprovedAnswer) && (
                        <div className="mt-4 border-t border-[#64a2cc] pt-3">
                          <p className="text-xs font-extrabold uppercase tracking-wide text-[#3f2abe]">
                            {answersLabel}
                          </p>
                          <div className="mt-2 flex flex-col gap-2">
                            <div className="surface-raised live-enter rounded-2xl p-3">
                              <p className="text-xs font-bold text-[#3f2abe] break-words">
                                {latestApprovedAnswer.author || 'Anónimo'}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-[#3f2abe] break-words clamp-3">
                                {latestApprovedAnswer.content}
                              </p>
                            </div>
                            {hiddenAnswersCount > 0 && (
                              <p className="text-xs font-bold text-[#3f2abe]">
                                +{hiddenAnswersCount} respuesta{hiddenAnswersCount > 1 ? 's' : ''} aprobada{hiddenAnswersCount > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {!latestApprovedAnswer && (
                        <p className="mt-3 text-xs font-bold text-[#3f2abe]">
                          Sin respuestas aprobadas aún.
                        </p>
                      )}
                    </article>
                  )
                })()}

                {!!secondaryQuestions.length && (
                  <div className="mt-4 columns-1 gap-4 xl:columns-2 xl:gap-5 2xl:columns-3">
                    {secondaryQuestions.map((question) => {
                  const approvedAnswers = Array.isArray(question.answers)
                    ? question.answers
                        .filter((answer) => answer.status === 'approved')
                        .sort((left, right) => (right.createdAt || 0) - (left.createdAt || 0))
                    : []
                  const latestApprovedAnswer = approvedAnswers[0]
                  const hiddenAnswersCount = Math.max(0, approvedAnswers.length - 1)
                  const answersLabel = approvedAnswers.length > 1 ? 'Respuestas' : 'Respuesta'

                  return (
                    <article
                      key={question.id}
                      className="surface-base live-enter mb-4 break-inside-avoid rounded-3xl p-4 shadow-sm md:p-5"
                    >
                      {question.isPinned && (
                        <span className="inline-flex rounded-full bg-[#e08ad4] px-3 py-1 text-xs font-bold text-[#3f2abe]">
                          Fijada
                        </span>
                      )}
                      <p className="type-card-title mt-2 text-[#3f2abe] break-words">
                        <span className="font-black">{question.author || 'Anónimo'}:</span>{' '}
                        {question.content}
                      </p>
                      <div className="mt-2 flex items-center justify-end gap-3">
                        <p className="type-meta text-[#8b0368]">
                          {question.upvotes || 0} votos
                        </p>
                      </div>

                      {Boolean(latestApprovedAnswer) && (
                        <div className="mt-3 border-t border-[#64a2cc] pt-3">
                          <p className="text-xs font-extrabold uppercase tracking-wide text-[#3f2abe]">
                            {answersLabel}
                          </p>
                          <div className="mt-2 flex flex-col gap-2">
                            <div className="surface-raised live-enter rounded-2xl p-3">
                              <p className="text-xs font-bold text-[#3f2abe] break-words">
                                {latestApprovedAnswer.author || 'Anónimo'}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-[#3f2abe] break-words clamp-2">
                                {latestApprovedAnswer.content}
                              </p>
                            </div>
                            {hiddenAnswersCount > 0 && (
                              <p className="text-xs font-bold text-[#3f2abe]">
                                +{hiddenAnswersCount} respuesta{hiddenAnswersCount > 1 ? 's' : ''} aprobada{hiddenAnswersCount > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {!latestApprovedAnswer && (
                        <p className="mt-3 text-xs font-bold text-[#3f2abe]">
                          Sin respuestas aprobadas aún.
                        </p>
                      )}
                    </article>
                  )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </article>
      </section>
    </main>
  )
}
