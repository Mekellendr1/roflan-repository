<<<<<<< HEAD
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
=======
/**
 * Контекст авторизации.
 * Хранит текущего пользователя и JWT-токен, предоставляет методы login/logout/register.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
import type { AuthUser } from './authTypes'
import { apiGetMe, apiLogin, apiRegister, type LoginData, type RegisterData } from './authApi'

const TOKEN_KEY = 'wt_token'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  loading: boolean
  error: string | null
  login: (data: LoginData) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
<<<<<<< HEAD
  refreshUser: () => Promise<void>
=======
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState<boolean>(!!localStorage.getItem(TOKEN_KEY))
  const [error, setError] = useState<string | null>(null)

<<<<<<< HEAD
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (!stored) { setLoading(false); return }
    apiGetMe(stored)
      .then((u) => { setUser(u); setToken(stored) })
      .catch(() => { localStorage.removeItem(TOKEN_KEY); setToken(null) })
      .finally(() => setLoading(false))
  }, [])

  const refreshUser = useCallback(async () => {
    const t = localStorage.getItem(TOKEN_KEY)
    if (!t) return
    const u = await apiGetMe(t)
    setUser(u)
  }, [])

=======
  // Восстанавливаем сессию из localStorage при монтировании
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (!stored) {
      setLoading(false)
      return
    }
    apiGetMe(stored)
      .then((u) => {
        setUser(u)
        setToken(stored)
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [])

>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
  const login = useCallback(async (data: LoginData) => {
    setError(null)
    try {
      const t = await apiLogin(data)
      const u = await apiGetMe(t)
      localStorage.setItem(TOKEN_KEY, t)
      setToken(t)
      setUser(u)
    } catch (e: unknown) {
<<<<<<< HEAD
      const msg = (e as any)?.response?.data?.detail || 'Ошибка входа'
=======
      const msg =
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Ошибка входа'
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
      setError(msg)
      throw new Error(msg)
    }
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    setError(null)
    try {
      await apiRegister(data)
      await login({ username: data.email, password: data.password })
    } catch (e: unknown) {
<<<<<<< HEAD
      const msg = (e as any)?.response?.data?.detail || 'Ошибка регистрации'
=======
      const msg =
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (e as Error)?.message ||
        'Ошибка регистрации'
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
      setError(msg)
      throw new Error(msg)
    }
  }, [login])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
<<<<<<< HEAD
    localStorage.removeItem('wt_last_project')
=======
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
    setToken(null)
    setUser(null)
  }, [])

  return (
<<<<<<< HEAD
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, refreshUser }}>
=======
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout }}>
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
      {children}
    </AuthContext.Provider>
  )
}

<<<<<<< HEAD
export function useAuth() {
=======
export function useAuth(): AuthContextValue {
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
