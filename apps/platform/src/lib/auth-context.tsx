'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from './api'

interface User {
  id: string
  email: string
  name: string | null
  plan: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('affibase_token')
    if (!stored) {
      setIsLoading(false)
      return
    }
    setToken(stored)
    api.get<{ user: User }>('/api/v1/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => {
        localStorage.removeItem('affibase_token')
        setToken(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('affibase_token', newToken)
    setToken(newToken)
    setUser(newUser)
  }

  const logout = () => {
    localStorage.removeItem('affibase_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
