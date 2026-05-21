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
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState<boolean>(!!localStorage.getItem(TOKEN_KEY))
  const [error, setError] = useState<string | null>(null)

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

  const login = useCallback(async (data: LoginData) => {
    setError(null)
    try {
      const t = await apiLogin(data)
      const u = await apiGetMe(t)
      localStorage.setItem(TOKEN_KEY, t)
      setToken(t)
      setUser(u)
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Ошибка входа'
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
      const msg =
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (e as Error)?.message ||
        'Ошибка регистрации'
      setError(msg)
      throw new Error(msg)
    }
  }, [login])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
