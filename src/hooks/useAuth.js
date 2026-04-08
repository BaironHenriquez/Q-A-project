import { useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
} from 'firebase/auth'
import { auth, authToken } from '../services/firebase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isActive = true

    const bootstrapAuth = async () => {
      try {
        if (!auth.currentUser) {
          if (authToken) {
            await signInWithCustomToken(auth, authToken)
          } else {
            await signInAnonymously(auth)
          }
        }
      } catch (err) {
        if (isActive) {
          console.error('Error de autenticacion:', err)
          setError(err)
        }
      }
    }

    bootstrapAuth()

    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        if (!isActive) return
        setUser(nextUser)
        setLoading(false)
      },
      (err) => {
        if (!isActive) return
        console.error('Error escuchando auth state:', err)
        setError(err)
        setLoading(false)
      },
    )

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [])

  return { user, loading, error }
}