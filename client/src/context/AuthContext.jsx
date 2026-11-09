import { createContext, useContext, useState } from 'react'
import { authApi } from '../services/api.js'

const AuthContext = createContext(null)
const SESSION_USER_KEY = 'bookhub-session-user'
const SESSION_TOKEN_KEY = 'bookhub-session-token'

const readStoredUser = () => {
  try {
    const stored = sessionStorage.getItem(SESSION_USER_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  const [token, setToken] = useState(() => sessionStorage.getItem(SESSION_TOKEN_KEY) || '')

  const storeSession = (session) => {
    setUser(session.user)
    setToken(session.accessToken)
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(session.user))
    sessionStorage.setItem(SESSION_TOKEN_KEY, session.accessToken)
  }

  const login = async (payload) => {
    const response = await authApi.login(payload)
    storeSession(response.data)
    return response
  }

  const register = async (payload) => {
    const response = await authApi.register(payload)
    storeSession(response.data)
    return response
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      // Local logout still succeeds if the API is unavailable.
    }
    setUser(null)
    setToken('')
    sessionStorage.removeItem(SESSION_USER_KEY)
    sessionStorage.removeItem(SESSION_TOKEN_KEY)
  }

  const value = { user, token, isAuthenticated: Boolean(token), login, register, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
