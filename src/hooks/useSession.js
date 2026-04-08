import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { appId, db } from '../services/firebase'

export function useSession() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'session_meta', 'active')

    const unsubscribe = onSnapshot(
      sessionRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data()
          setSession({
            id: docSnap.id,
            ...data,
            moderatorId: data.moderatorId || data.moderatorUid || null,
          })
        } else {
          setSession(null)
        }
        setLoading(false)
      },
      (err) => {
        console.error('Error al escuchar la sesion:', err)
        setError(err)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  const createSession = async (title, moderatorId) => {
    try {
      const sessionId = Math.random().toString(36).substring(2, 10)
      const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'session_meta', 'active')

      await setDoc(sessionRef, {
        sessionId,
        title,
        isAcceptingQuestions: true,
        createdAt: Date.now(),
        moderatorId,
        moderatorUid: moderatorId,
      })

      sessionStorage.setItem('qna_role', 'moderator')
      return true
    } catch (err) {
      console.error('Error creando sesion:', err)
      return false
    }
  }

  const toggleSessionStatus = async () => {
    if (!session) return

    try {
      const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'session_meta', 'active')
      await updateDoc(sessionRef, {
        isAcceptingQuestions: !session.isAcceptingQuestions,
      })
    } catch (err) {
      console.error('Error actualizando estado de sesion:', err)
    }
  }

  return {
    session,
    loading,
    error,
    createSession,
    toggleSessionStatus,
  }
}