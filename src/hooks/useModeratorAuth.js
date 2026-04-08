import { useState } from 'react'

const MODERATOR_USERNAME = 'mod'
const MODERATOR_PASSWORD = 'mod4783'
const STORAGE_KEY = 'qna_moderator_authenticated'

const getInitialModeratorAuth = () => {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(STORAGE_KEY) === 'true'
}

export function useModeratorAuth() {
  const [isModeratorAuthenticated, setIsModeratorAuthenticated] = useState(
    getInitialModeratorAuth,
  )

  const loginModerator = (username, password) => {
    const nextUsername = (username || '').trim()
    const nextPassword = (password || '').trim()

    const isValid =
      nextUsername === MODERATOR_USERNAME &&
      nextPassword === MODERATOR_PASSWORD

    if (!isValid) return false

    sessionStorage.setItem(STORAGE_KEY, 'true')
    setIsModeratorAuthenticated(true)
    return true
  }

  const logoutModerator = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    setIsModeratorAuthenticated(false)
  }

  return {
    isModeratorAuthenticated,
    loginModerator,
    logoutModerator,
  }
}
