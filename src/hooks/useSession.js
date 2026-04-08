import { useEffect, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
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
        console.error('Error al escuchar la sesión:', err)
        setError(err)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  const createSession = async (title) => {
    try {
      const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'session_meta', 'active')

      const result = await runTransaction(db, async (transaction) => {
        const existingSession = await transaction.get(sessionRef)
        if (existingSession.exists()) {
          return {
            ok: false,
            message: 'Ya existe una sesión activa. Debes borrarla antes de crear una nueva.',
          }
        }

        const sessionId = Math.random().toString(36).substring(2, 10)

        transaction.set(sessionRef, {
          sessionId,
          title,
          isAcceptingQuestions: true,
          createdAt: Date.now(),
          moderatorId: 'mod',
          moderatorUid: 'mod',
        })

        return { ok: true }
      })

      return result
    } catch (err) {
      console.error('Error creando sesión:', err)
      return {
        ok: false,
        message: 'No se pudo crear la sesión. Intenta de nuevo.',
      }
    }
  }

  const deleteSession = async () => {
    if (!session?.sessionId) {
      return { ok: false, message: 'No hay una sesión activa para borrar.' }
    }

    try {
      const targetSessionId = String(session.sessionId)
      const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'session_meta', 'active')

      const activeSnap = await getDoc(sessionRef)
      const activeSessionId = activeSnap.exists() ? String(activeSnap.data().sessionId || '') : ''
      if (!activeSessionId) {
        return { ok: false, message: 'No hay una sesión activa para borrar.' }
      }

      if (activeSessionId !== targetSessionId) {
        return {
          ok: false,
          message: 'La sesión activa cambió. Recarga la vista antes de volver a intentar.',
        }
      }

      const questionsRef = collection(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'sessions',
        targetSessionId,
        'questions',
      )
      const questionsSnap = await getDocs(questionsRef)
      const chunkSize = 400

      for (let index = 0; index < questionsSnap.docs.length; index += chunkSize) {
        const batch = writeBatch(db)
        questionsSnap.docs.slice(index, index + chunkSize).forEach((questionDoc) => {
          batch.delete(questionDoc.ref)
        })
        await batch.commit()
      }

      // El documento de sesión puede existir aunque no tenga campos útiles.
      const sessionDataRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', targetSessionId)
      await deleteDoc(sessionDataRef)

      const latestActiveSnap = await getDoc(sessionRef)
      const latestSessionId = latestActiveSnap.exists()
        ? String(latestActiveSnap.data().sessionId || '')
        : ''
      if (latestSessionId && latestSessionId !== targetSessionId) {
        return {
          ok: false,
          message: 'La sesión activa cambió durante la limpieza. No se eliminó el puntero activo.',
        }
      }

      await deleteDoc(sessionRef)
      return { ok: true }
    } catch (err) {
      console.error('Error borrando sesión activa:', err)
      return {
        ok: false,
        message: 'No se pudo borrar la sesión activa. Intenta de nuevo.',
      }
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
      console.error('Error actualizando estado de sesión:', err)
    }
  }

  return {
    session,
    loading,
    error,
    createSession,
    deleteSession,
    toggleSessionStatus,
  }
}