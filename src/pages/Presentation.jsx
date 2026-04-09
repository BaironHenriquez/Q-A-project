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
        .sort((left, right) => {
          if (Boolean(right.isPinned) !== Boolean(left.isPinned)) {
            return Number(Boolean(right.isPinned)) - Number(Boolean(left.isPinned))
          }

          const voteDiff = (right.upvotes || 0) - (left.upvotes || 0)
          if (voteDiff !== 0) return voteDiff

          return (right.createdAt || 0) - (left.createdAt || 0)
        }),
    [approvedQuestions],
  )

  return (
    <main className="min-h-screen bg-[#64a2cc] text-[#3f2abe] font-sans p-3 md:p-4 lg:p-6">
      <section className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full flex-wrap items-start gap-6 lg:gap-7">
        <aside className="w-full rounded-[2rem] border border-[#64a2cc] bg-[#e6f2fa] p-5 shadow-md sm:p-7 md:w-[320px] md:flex-none md:p-8 xl:w-[350px] lg:p-9">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Acceso audiencia</h2>
          <p className="mt-2 text-sm md:text-base font-semibold text-[#3f2abe] leading-relaxed">
            Escanea y entra directo a la vista de participante.
          </p>
          <div className="mt-5 flex w-full justify-center">
            <div className="inline-flex w-full max-w-[320px] justify-center rounded-3xl bg-[#e6f2fa] p-3 shadow-sm sm:p-4 lg:p-5">
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
          <p className="mt-4 rounded-2xl bg-[#e6f2fa] px-4 py-3 break-words text-sm md:text-base font-bold text-[#8b0368]">
            {joinUrl}
          </p>
          <Link
            to="/moderador"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#3f2abe] px-5 text-sm font-bold text-[#e6f2fa] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95 md:px-6 md:text-base"
          >
            Volver a moderador
          </Link>
        </aside>

        <article className="min-w-[300px] flex-1 rounded-[2rem] border border-[#64a2cc] bg-[#e6f2fa] p-6 shadow-md md:p-9 lg:p-11">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight break-words">
            {session?.title || 'Sesión sin título'}
          </h1>
          <p className="mt-2 text-base md:text-lg font-semibold text-[#3f2abe] break-words">Presentación en vivo</p>

          {!session?.isAcceptingQuestions && (
            <div className="mt-4 rounded-2xl border border-[#8b0368] bg-[#8b0368] px-4 py-3 text-sm md:text-base font-bold text-[#e6f2fa]">
              El moderador pausó temporalmente la recepción de nuevas preguntas.
            </div>
          )}

          <div className="mt-6 flex-1 overflow-y-auto pr-1">
            {!approvedQuestions.length && (
              <div className="rounded-3xl bg-[#e6f2fa] p-8 text-center shadow-sm md:p-11 lg:p-16">
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
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
                {featuredQuestions.map((question) => {
                  const approvedAnswers = Array.isArray(question.answers)
                    ? question.answers.filter((answer) => answer.status === 'approved')
                    : []

                  return (
                    <article key={question.id} className="rounded-3xl border border-[#64a2cc] bg-[#e6f2fa] p-6 shadow-sm md:p-7">
                      {question.isPinned && (
                        <span className="inline-flex rounded-full bg-[#e08ad4] px-3 py-1 text-xs font-bold text-[#3f2abe]">
                          Fijada
                        </span>
                      )}
                      <p className="mt-2 text-lg md:text-xl font-extrabold tracking-tight text-[#3f2abe] break-words">
                        {question.content}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-sm md:text-base font-semibold text-[#3f2abe] break-words">
                          {question.author || 'Anónimo'}
                        </p>
                        <p className="text-sm md:text-base font-bold text-[#8b0368]">
                          {question.upvotes || 0} votos
                        </p>
                      </div>

                      {approvedAnswers.length > 0 && (
                        <div className="mt-5 border-t border-[#64a2cc] pt-4">
                          <p className="text-xs font-extrabold uppercase tracking-wide text-[#3f2abe]">Respuestas</p>
                          <div className="mt-3 flex flex-col gap-2">
                            {approvedAnswers.map((answer) => (
                              <div
                                key={answer.id}
                                className="rounded-2xl border border-[#64a2cc] bg-[#e6f2fa] p-4"
                              >
                                <p className="text-xs font-bold text-[#3f2abe] break-words">
                                  {answer.author || 'Anónimo'}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-[#3f2abe] break-words">
                                  {answer.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </article>
      </section>
    </main>
  )
}
