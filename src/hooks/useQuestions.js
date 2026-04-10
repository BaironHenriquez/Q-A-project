import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  updateDoc,
} from 'firebase/firestore'
import { appId, db } from '../services/firebase'

const MAX_QUESTION = 100
const MAX_ANSWER = 250

const buildQuestionsCollectionRef = (sessionId) =>
  collection(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId, 'questions')

const buildQuestionDocRef = (sessionId, questionId) =>
  doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId, 'questions', questionId)

const buildParticipantDocRef = (sessionId, userId) =>
  doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId, 'participants', userId)

const buildParticipantQuestionDocRef = (sessionId, userId, questionId) =>
  doc(
    db,
    'artifacts',
    appId,
    'public',
    'data',
    'sessions',
    sessionId,
    'participants',
    userId,
    'questions',
    questionId,
  )

const buildParticipantAnswerDocRef = (sessionId, userId, answerId) =>
  doc(
    db,
    'artifacts',
    appId,
    'public',
    'data',
    'sessions',
    sessionId,
    'participants',
    userId,
    'answers',
    answerId,
  )

const buildParticipantQuestionVoteDocRef = (sessionId, userId, questionId) =>
  doc(
    db,
    'artifacts',
    appId,
    'public',
    'data',
    'sessions',
    sessionId,
    'participants',
    userId,
    'question_votes',
    questionId,
  )

const buildActiveSessionRef = () =>
  doc(db, 'artifacts', appId, 'public', 'data', 'session_meta', 'active')

const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const normalizeActorId = (value) => {
  const clean = String(value || '').trim() || 'unknown'
  return clean.replaceAll('/', '_')
}

const normalizeAuthorName = (value) => {
  const clean = String(value || '').trim()
  return clean || 'Anónimo'
}

const normalizeVoters = (value) => {
  const list = Array.isArray(value) ? value : []
  return [...new Set(list.map((item) => String(item || '').trim()).filter(Boolean))]
}

const normalizeAnswerVotes = (answer) => {
  const correctVoters = normalizeVoters(answer.isCorrectVotedBy)
  const incorrectVoters = normalizeVoters(answer.isIncorrectVotedBy)

  return {
    ...answer,
    isCorrectVotedBy: correctVoters,
    isIncorrectVotedBy: incorrectVoters,
    isCorrectVotes: correctVoters.length,
    isIncorrectVotes: incorrectVoters.length,
  }
}

const normalizeQuestionVotes = (question) => {
  const uniqueVoters = normalizeVoters(question.upvotedBy)

  return {
    ...question,
    upvotedBy: uniqueVoters,
    upvotes: uniqueVoters.length,
  }
}

export function useQuestions(sessionId) {
  const [questions, setQuestions] = useState([])
  const [snapshotMeta, setSnapshotMeta] = useState({
    sessionId: null,
    loaded: false,
    error: '',
  })

  useEffect(() => {
    if (!sessionId) {
      return undefined
    }

    const unsubscribe = onSnapshot(
      buildQuestionsCollectionRef(sessionId),
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
        setQuestions(data)
        setSnapshotMeta({ sessionId, loaded: true, error: '' })
      },
      (error) => {
        setSnapshotMeta({ sessionId, loaded: true, error: error.message })
      },
    )

    return () => unsubscribe()
  }, [sessionId])

  const activeQuestions = useMemo(
    () => (snapshotMeta.sessionId === sessionId ? questions : []),
    [questions, sessionId, snapshotMeta.sessionId],
  )

  const loadingQuestions = useMemo(
    () => Boolean(sessionId) && (snapshotMeta.sessionId !== sessionId || !snapshotMeta.loaded),
    [sessionId, snapshotMeta.loaded, snapshotMeta.sessionId],
  )

  const questionsError = useMemo(
    () => (snapshotMeta.sessionId === sessionId ? snapshotMeta.error : ''),
    [sessionId, snapshotMeta.error, snapshotMeta.sessionId],
  )

  const sortedQuestions = useMemo(() => {
    const normalizedQuestions = activeQuestions.map(normalizeQuestionVotes)
    return normalizedQuestions.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  }, [activeQuestions])

  const pendingQuestions = useMemo(
    () => sortedQuestions.filter((q) => q.status === 'pending' && !q.isHidden),
    [sortedQuestions],
  )

  const approvedQuestions = useMemo(
    () => sortedQuestions.filter((q) => q.status === 'approved' && !q.isHidden),
    [sortedQuestions],
  )

  const createQuestion = useCallback(
    async ({ author, userId, content }) => {
      if (!sessionId) throw new Error('No existe una sesión activa')

      const text = (content || '').trim()
      if (!text) throw new Error('La pregunta no puede estar vacía')
      if (text.length > MAX_QUESTION) {
        throw new Error(`La pregunta supera el límite de ${MAX_QUESTION} caracteres`)
      }

      const actorId = normalizeActorId(userId)
      const authorName = normalizeAuthorName(author)

      await runTransaction(db, async (transaction) => {
        const activeSessionRef = buildActiveSessionRef()
        const activeSessionSnap = await transaction.get(activeSessionRef)

        if (!activeSessionSnap.exists()) {
          throw new Error('No hay una sesión activa en este momento.')
        }

        const activeSessionData = activeSessionSnap.data()
        if (String(activeSessionData.sessionId || '') !== String(sessionId)) {
          throw new Error('La sesión activa cambió. Actualiza e inténtalo de nuevo.')
        }

        if (!activeSessionData.isAcceptingQuestions) {
          throw new Error('La moderación pausó temporalmente la recepción de preguntas.')
        }

        const newQuestionRef = doc(buildQuestionsCollectionRef(sessionId))
        const createdAt = Date.now()
        transaction.set(newQuestionRef, {
          author: authorName,
          userId: actorId,
          content: text,
          status: 'pending',
          upvotes: 0,
          upvotedBy: [],
          isPinned: false,
          isProjected: false,
          isHidden: false,
          createdAt,
          answers: [],
        })

        const participantRef = buildParticipantDocRef(sessionId, actorId)
        transaction.set(
          participantRef,
          {
            userId: actorId,
            lastDisplayName: authorName,
            lastActivityAt: createdAt,
            updatedAt: createdAt,
          },
          { merge: true },
        )

        const participantQuestionRef = buildParticipantQuestionDocRef(sessionId, actorId, newQuestionRef.id)
        transaction.set(participantQuestionRef, {
          questionId: newQuestionRef.id,
          author: authorName,
          content: text,
          status: 'pending',
          createdAt,
        })
      })
    },
    [sessionId],
  )

  const toggleVote = useCallback(
    async ({ questionId, userId }) => {
      if (!sessionId) throw new Error('No existe una sesión activa para votar')
      if (!questionId) throw new Error('La pregunta no es válida')

      const actorIdRaw = String(userId || '').trim()
      if (!actorIdRaw) throw new Error('No se pudo identificar al usuario para votar')
      const actorId = normalizeActorId(actorIdRaw)

      const qRef = buildQuestionDocRef(sessionId, questionId)

      await runTransaction(db, async (transaction) => {
        const qSnap = await transaction.get(qRef)
        if (!qSnap.exists()) {
          throw new Error('La pregunta ya no existe')
        }

        const data = qSnap.data()
        const questionAuthorId = normalizeActorId(data.userId)
        if (questionAuthorId === actorId) {
          throw new Error('No puedes sumarte a tu propia pregunta')
        }

        const uniqueVoters = normalizeVoters(data.upvotedBy)
        const hasVoted = uniqueVoters.includes(actorId)

        const nextVoters = hasVoted
          ? uniqueVoters.filter((uid) => uid !== actorId)
          : [...uniqueVoters, actorId]

        const now = Date.now()
        const participantRef = buildParticipantDocRef(sessionId, actorId)
        transaction.set(
          participantRef,
          {
            userId: actorId,
            lastActivityAt: now,
            updatedAt: now,
          },
          { merge: true },
        )

        const participantVoteRef = buildParticipantQuestionVoteDocRef(sessionId, actorId, questionId)
        if (hasVoted) {
          transaction.delete(participantVoteRef)
        } else {
          transaction.set(participantVoteRef, {
            questionId,
            votedAt: now,
          })
        }

        transaction.update(qRef, {
          upvotedBy: nextVoters,
          upvotes: nextVoters.length,
        })
      })
    },
    [sessionId],
  )

  const setQuestionStatus = useCallback(
    async (questionId, status) => {
      if (!sessionId || !questionId) return
      await updateDoc(buildQuestionDocRef(sessionId, questionId), { status })
    },
    [sessionId],
  )

  const updateQuestionFields = useCallback(
    async (questionId, fields) => {
      if (!sessionId || !questionId) return
      await updateDoc(buildQuestionDocRef(sessionId, questionId), fields)
    },
    [sessionId],
  )

  const editQuestionContent = useCallback(
    async ({ questionId, content }) => {
      if (!sessionId || !questionId) return

      const text = (content || '').trim()
      if (!text) throw new Error('La pregunta no puede estar vacía')
      if (text.length > MAX_QUESTION) {
        throw new Error(`La pregunta supera el límite de ${MAX_QUESTION} caracteres`)
      }

      await updateDoc(buildQuestionDocRef(sessionId, questionId), { content: text })
    },
    [sessionId],
  )

  const addAnswer = useCallback(
    async ({ questionId, author, userId, content, isModerator }) => {
      if (!sessionId || !questionId) return

      const text = (content || '').trim()
      if (!text) throw new Error('La respuesta no puede estar vacía')
      if (text.length > MAX_ANSWER) {
        throw new Error(`La respuesta supera el límite de ${MAX_ANSWER} caracteres`)
      }

      const actorIdRaw = String(userId || '').trim()
      if (!actorIdRaw) throw new Error('No se pudo identificar al usuario para responder')

      const actorId = normalizeActorId(actorIdRaw)
      const authorName = normalizeAuthorName(author)
      const qRef = buildQuestionDocRef(sessionId, questionId)

      await runTransaction(db, async (transaction) => {
        const qSnap = await transaction.get(qRef)
        if (!qSnap.exists()) {
          throw new Error('La pregunta ya no existe')
        }

        const existingAnswers = Array.isArray(qSnap.data().answers) ? qSnap.data().answers : []
        const createdAt = Date.now()

        const newAnswer = {
          id: createId(),
          author: authorName,
          userId: actorId,
          content: text,
          status: isModerator ? 'approved' : 'pending',
          createdAt,
          isCorrectVotes: 0,
          isIncorrectVotes: 0,
          isCorrectVotedBy: [],
          isIncorrectVotedBy: [],
        }

        transaction.update(qRef, {
          answers: [...existingAnswers, newAnswer],
        })

        const participantRef = buildParticipantDocRef(sessionId, actorId)
        transaction.set(
          participantRef,
          {
            userId: actorId,
            lastDisplayName: authorName,
            lastActivityAt: createdAt,
            updatedAt: createdAt,
          },
          { merge: true },
        )

        const participantAnswerRef = buildParticipantAnswerDocRef(sessionId, actorId, newAnswer.id)
        transaction.set(participantAnswerRef, {
          answerId: newAnswer.id,
          questionId,
          author: authorName,
          content: text,
          status: newAnswer.status,
          createdAt,
        })
      })
    },
    [sessionId],
  )

  const moderateAnswer = useCallback(
    async ({ questionId, answerId, nextStatus }) => {
      if (!sessionId || !questionId || !answerId) return

      const qRef = buildQuestionDocRef(sessionId, questionId)

      await runTransaction(db, async (transaction) => {
        const qSnap = await transaction.get(qRef)
        if (!qSnap.exists()) return

        let hasTargetAnswer = false
        const updatedAnswers = (qSnap.data().answers || []).map((rawAnswer) => {
          const answer = normalizeAnswerVotes(rawAnswer)
          if (answer.id !== answerId) return answer

          hasTargetAnswer = true
          return {
            ...answer,
            status: nextStatus,
          }
        })

        if (!hasTargetAnswer) return

        transaction.update(qRef, { answers: updatedAnswers })
      })
    },
    [sessionId],
  )

  const voteAnswerCorrectness = useCallback(
    async ({ questionId, answerId, userId, voteType }) => {
      if (!sessionId) throw new Error('No existe una sesión activa para votar')
      if (!questionId || !answerId) throw new Error('La respuesta no es válida')

      const actorId = String(userId || '').trim()
      if (!actorId) throw new Error('No se pudo identificar al usuario para votar')

      if (voteType !== 'correct' && voteType !== 'incorrect') {
        throw new Error('Tipo de voto inválido')
      }

      const qRef = buildQuestionDocRef(sessionId, questionId)

      await runTransaction(db, async (transaction) => {
        const qSnap = await transaction.get(qRef)
        if (!qSnap.exists()) {
          throw new Error('La pregunta ya no existe')
        }

        let voteApplied = false
        const updatedAnswers = (qSnap.data().answers || []).map((rawAnswer) => {
          const answer = normalizeAnswerVotes(rawAnswer)
          if (answer.id !== answerId || answer.status !== 'approved') return answer

          voteApplied = true

          let correctVoters = [...answer.isCorrectVotedBy]
          let incorrectVoters = [...answer.isIncorrectVotedBy]

          const hasCorrectVote = correctVoters.includes(actorId)
          const hasIncorrectVote = incorrectVoters.includes(actorId)

          if (voteType === 'correct') {
            if (hasCorrectVote) {
              correctVoters = correctVoters.filter((uid) => uid !== actorId)
            } else {
              correctVoters = normalizeVoters([...correctVoters, actorId])
              incorrectVoters = incorrectVoters.filter((uid) => uid !== actorId)
            }
          }

          if (voteType === 'incorrect') {
            if (hasIncorrectVote) {
              incorrectVoters = incorrectVoters.filter((uid) => uid !== actorId)
            } else {
              incorrectVoters = normalizeVoters([...incorrectVoters, actorId])
              correctVoters = correctVoters.filter((uid) => uid !== actorId)
            }
          }

          return {
            ...answer,
            isCorrectVotedBy: correctVoters,
            isIncorrectVotedBy: incorrectVoters,
            isCorrectVotes: correctVoters.length,
            isIncorrectVotes: incorrectVoters.length,
          }
        })

        if (!voteApplied) {
          throw new Error('La respuesta no está disponible para votar')
        }

        transaction.update(qRef, { answers: updatedAnswers })
      })
    },
    [sessionId],
  )

  return {
    questions: activeQuestions,
    sortedQuestions,
    pendingQuestions,
    approvedQuestions,
    loadingQuestions,
    questionsError,
    createQuestion,
    toggleVote,
    setQuestionStatus,
    updateQuestionFields,
    editQuestionContent,
    addAnswer,
    moderateAnswer,
    voteAnswerCorrectness,
  }
}
