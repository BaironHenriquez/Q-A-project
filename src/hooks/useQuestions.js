import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore'
import { appId, db } from '../services/firebase'

const MAX_QUESTION = 100
const MAX_ANSWER = 250

const buildQuestionsCollectionRef = (sessionId) =>
  collection(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId, 'questions')

const buildQuestionDocRef = (sessionId, questionId) =>
  doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId, 'questions', questionId)

const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const normalizeAnswerVotes = (answer) => {
  const correctVoters = Array.isArray(answer.isCorrectVotedBy)
    ? answer.isCorrectVotedBy
    : []
  const incorrectVoters = Array.isArray(answer.isIncorrectVotedBy)
    ? answer.isIncorrectVotedBy
    : []

  return {
    ...answer,
    isCorrectVotedBy: correctVoters,
    isIncorrectVotedBy: incorrectVoters,
    isCorrectVotes: correctVoters.length,
    isIncorrectVotes: incorrectVoters.length,
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

  const activeQuestions = useMemo(() => (sessionId ? questions : []), [questions, sessionId])

  const loadingQuestions = useMemo(
    () => Boolean(sessionId) && (snapshotMeta.sessionId !== sessionId || !snapshotMeta.loaded),
    [sessionId, snapshotMeta.loaded, snapshotMeta.sessionId],
  )

  const questionsError = useMemo(
    () => (snapshotMeta.sessionId === sessionId ? snapshotMeta.error : ''),
    [sessionId, snapshotMeta.error, snapshotMeta.sessionId],
  )

  const sortedQuestions = useMemo(
    () => [...activeQuestions].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [activeQuestions],
  )

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
      if (!sessionId) throw new Error('No existe una sesion activa')

      const text = (content || '').trim()
      if (!text) throw new Error('La pregunta no puede estar vacia')
      if (text.length > MAX_QUESTION) {
        throw new Error(`La pregunta supera el limite de ${MAX_QUESTION} caracteres`)
      }

      await addDoc(buildQuestionsCollectionRef(sessionId), {
        author: author || 'Anonimo',
        userId: userId || 'unknown',
        content: text,
        status: 'pending',
        upvotes: 0,
        upvotedBy: [],
        isPinned: false,
        isProjected: false,
        isHidden: false,
        createdAt: Date.now(),
        answers: [],
      })
    },
    [sessionId],
  )

  const toggleVote = useCallback(
    async ({ questionId, userId, hasVoted }) => {
      if (!sessionId || !questionId || !userId) return

      const qRef = buildQuestionDocRef(sessionId, questionId)

      if (hasVoted) {
        await updateDoc(qRef, {
          upvotes: increment(-1),
          upvotedBy: arrayRemove(userId),
        })
      } else {
        await updateDoc(qRef, {
          upvotes: increment(1),
          upvotedBy: arrayUnion(userId),
        })
      }
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
      if (!text) throw new Error('La pregunta no puede estar vacia')
      if (text.length > MAX_QUESTION) {
        throw new Error(`La pregunta supera el limite de ${MAX_QUESTION} caracteres`)
      }

      await updateDoc(buildQuestionDocRef(sessionId, questionId), { content: text })
    },
    [sessionId],
  )

  const addAnswer = useCallback(
    async ({ questionId, author, userId, content, isModerator }) => {
      if (!sessionId || !questionId) return

      const text = (content || '').trim()
      if (!text) throw new Error('La respuesta no puede estar vacia')
      if (text.length > MAX_ANSWER) {
        throw new Error(`La respuesta supera el limite de ${MAX_ANSWER} caracteres`)
      }

      const newAnswer = {
        id: createId(),
        author: author || 'Anonimo',
        userId: userId || 'unknown',
        content: text,
        status: isModerator ? 'approved' : 'pending',
        createdAt: Date.now(),
        isCorrectVotes: 0,
        isIncorrectVotes: 0,
        isCorrectVotedBy: [],
        isIncorrectVotedBy: [],
      }

      await updateDoc(buildQuestionDocRef(sessionId, questionId), {
        answers: arrayUnion(newAnswer),
      })
    },
    [sessionId],
  )

  const moderateAnswer = useCallback(
    async ({ questionId, answerId, nextStatus }) => {
      if (!sessionId || !questionId || !answerId) return

      const qRef = buildQuestionDocRef(sessionId, questionId)
      const qSnap = await getDoc(qRef)
      if (!qSnap.exists()) return

      const updatedAnswers = (qSnap.data().answers || []).map((ans) => {
        if (ans.id !== answerId) return ans
        return {
          ...normalizeAnswerVotes(ans),
          status: nextStatus,
        }
      })

      await updateDoc(qRef, { answers: updatedAnswers })
    },
    [sessionId],
  )

  const voteAnswerCorrectness = useCallback(
    async ({ questionId, answerId, userId, voteType }) => {
      if (!sessionId || !questionId || !answerId || !userId) return
      if (voteType !== 'correct' && voteType !== 'incorrect') return

      const qRef = buildQuestionDocRef(sessionId, questionId)
      const qSnap = await getDoc(qRef)
      if (!qSnap.exists()) return

      const updatedAnswers = (qSnap.data().answers || []).map((rawAnswer) => {
        const answer = normalizeAnswerVotes(rawAnswer)
        if (answer.id !== answerId || answer.status !== 'approved') return answer

        let correctVoters = [...answer.isCorrectVotedBy]
        let incorrectVoters = [...answer.isIncorrectVotedBy]

        const hasCorrectVote = correctVoters.includes(userId)
        const hasIncorrectVote = incorrectVoters.includes(userId)

        if (voteType === 'correct') {
          if (hasCorrectVote) {
            correctVoters = correctVoters.filter((uid) => uid !== userId)
          } else {
            correctVoters.push(userId)
            incorrectVoters = incorrectVoters.filter((uid) => uid !== userId)
          }
        }

        if (voteType === 'incorrect') {
          if (hasIncorrectVote) {
            incorrectVoters = incorrectVoters.filter((uid) => uid !== userId)
          } else {
            incorrectVoters.push(userId)
            correctVoters = correctVoters.filter((uid) => uid !== userId)
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

      await updateDoc(qRef, { answers: updatedAnswers })
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
