import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
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
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState<boolean>(!!localStorage.getItem(TOKEN_KEY))
  const [error, setError] = useState<string | null>(null)

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

  const login = useCallback(async (data: LoginData) => {
    setError(null)
    try {
      const t = await apiLogin(data)
      const u = await apiGetMe(t)
      localStorage.setItem(TOKEN_KEY, t)
      setToken(t)
      setUser(u)
    } catch (e: unknown) {
      const msg = (e as any)?.response?.data?.detail || 'Ошибка входа'
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
      const msg = (e as any)?.response?.data?.detail || 'Ошибка регистрации'
      setError(msg)
      throw new Error(msg)
    }
  }, [login])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('wt_last_project')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
