import {
  Check,
  ClipboardList,
  Clock3,
  EyeOff,
  MessageSquare,
  Pin,
  UserRound,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuestions } from '../hooks/useQuestions'

export default function Moderator({ session, toggleSessionStatus }) {
  const {
    pendingQuestions,
    approvedQuestions,
    loadingQuestions,
    questionsError,
    setQuestionStatus,
    updateQuestionFields,
  } = useQuestions(session?.sessionId)

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Sin hora'
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <main className="min-h-screen bg-[#f8fbfe] text-[#3f2abe] font-sans p-4 md:p-8">
      <section className="mx-auto max-w-6xl flex flex-col gap-5">
        <article className="rounded-[2rem] bg-white p-6 md:p-8 shadow-md">
          <h1 className="text-3xl font-bold">Panel moderador</h1>
          <p className="mt-2 text-sm font-medium text-[#716274]">
            Gestiona preguntas en tiempo real con controles claros y de baja carga cognitiva.
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
            </div>
          </div>
        </article>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <article className="rounded-[2rem] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ClipboardList size={18} className="text-[#0a79e8]" />
              <h2 className="text-xl font-bold">Pendientes ({pendingQuestions.length})</h2>
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
              {pendingQuestions.map((question) => (
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
                    <span className="rounded-full bg-[#e08ad4] px-3 py-1 text-[#3f2abe] font-bold">Pendiente</span>
                  </div>

                  <p className="mt-3 text-sm font-medium text-[#3f2abe] break-words">{question.content}</p>

                  {Array.isArray(question.answers) && question.answers.length > 0 && (
                    <div className="mt-3 border-l-4 border-[#64a2cc] pl-3 flex flex-col gap-2">
                      {question.answers.map((answer) => (
                        <div key={answer.id} className="rounded-2xl bg-gray-50 p-3">
                          <p className="text-xs font-bold text-[#716274] break-words">{answer.author}</p>
                          <p className="mt-1 text-sm font-medium text-[#3f2abe] break-words">{answer.content}</p>
                        </div>
                      ))}
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
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">Aprobadas ({approvedQuestions.length})</h2>
            <div className="mt-4 flex flex-col gap-3">
              {!approvedQuestions.length && (
                <div className="rounded-3xl bg-[#e6f2fa] p-6 text-center">
                  <MessageSquare size={30} className="mx-auto text-[#716274]" />
                  <p className="mt-2 text-sm font-medium text-[#716274]">
                    Aun no hay preguntas aprobadas.
                  </p>
                </div>
              )}
              {approvedQuestions.slice(0, 8).map((question) => (
                <article key={question.id} className="rounded-3xl bg-[#f8fbfe] p-4 shadow-sm">
                  <p className="text-sm font-bold text-[#3f2abe] break-words">{question.content}</p>
                  <p className="mt-2 text-xs font-medium text-[#716274]">
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
