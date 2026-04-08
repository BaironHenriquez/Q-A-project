import { MessageSquare } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Link } from 'react-router-dom'
import { useQuestions } from '../hooks/useQuestions'

export default function Presentation({ session }) {
  const joinUrl = `${window.location.origin}/participante?sid=${encodeURIComponent(
    session?.sessionId || '',
  )}`
  const { approvedQuestions } = useQuestions(session?.sessionId)

  return (
    <main className="min-h-screen bg-[#f8fbfe] text-[#3f2abe] font-sans p-4 md:p-8 lg:p-10">
      <section className="mx-auto grid max-w-[1400px] grid-cols-1 md:grid-cols-[380px_1fr] gap-5 lg:gap-7">
        <aside className="rounded-[2rem] bg-[#e6f2fa] p-6 md:p-7 lg:p-8 shadow-md">
          <h2 className="text-2xl md:text-3xl font-bold">Acceso audiencia</h2>
          <p className="mt-2 text-sm md:text-base font-medium text-[#716274]">
            Escanea y entra directo a la vista de participante.
          </p>
          <div className="mt-5 inline-flex rounded-3xl bg-white p-4 lg:p-5 shadow-sm">
            <QRCodeSVG
              value={joinUrl}
              size={280}
              bgColor="#ffffff"
              fgColor="#3f2abe"
              level="H"
            />
          </div>
          <p className="mt-3 break-words text-sm md:text-base font-bold text-[#0a79e8]">{joinUrl}</p>
          <Link
            to="/moderador"
            className="mt-5 h-11 md:h-12 inline-flex items-center justify-center rounded-full bg-white px-5 md:px-6 text-sm md:text-base font-bold text-[#3f2abe] shadow-sm transition-all transition-transform hover:opacity-90 hover:shadow-md active:scale-95"
          >
            Volver a moderador
          </Link>
        </aside>

        <article className="rounded-[2rem] bg-white p-6 md:p-8 lg:p-10 shadow-md">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">Presentación en vivo</h1>
          <p className="mt-2 text-base md:text-lg font-medium text-[#716274] break-words">
            Sesión: {session?.title || 'Sin título'}
          </p>

          {!approvedQuestions.length && (
            <div className="mt-8 rounded-3xl bg-[#e6f2fa] p-10 lg:p-14 text-center">
              <MessageSquare size={44} className="mx-auto text-[#716274]" />
              <p className="mt-3 text-lg md:text-xl lg:text-2xl font-bold text-[#3f2abe]">Aún no hay preguntas destacadas</p>
              <p className="mt-1 text-sm md:text-base font-medium text-[#716274]">La audiencia está calentando motores.</p>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
            {approvedQuestions.slice(0, 10).map((question) => (
              <article key={question.id} className="rounded-3xl bg-[#f8fbfe] p-5 md:p-6 shadow-sm">
                {question.isPinned && (
                  <span className="inline-flex rounded-full bg-[#e08ad4] px-3 py-1 text-xs font-bold text-[#3f2abe]">
                    Fijada
                  </span>
                )}
                <p className="mt-2 text-lg md:text-xl font-bold text-[#3f2abe] break-words">{question.content}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-sm md:text-base font-medium text-[#716274] break-words">
                    {question.author || 'Anónimo'}
                  </p>
                  <p className="text-sm md:text-base font-bold text-[#0a79e8]">{question.upvotes || 0} votos</p>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>
    </main>
  )
}
