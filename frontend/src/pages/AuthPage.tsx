<<<<<<< HEAD
=======
/**
 * Страница входа / регистрации.
 */

>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
import { useState } from 'react'
import { useAuth } from '../lib/authContext'
import Icon from '../components/Icon'

type Tab = 'login' | 'register'

<<<<<<< HEAD
// Кнопки быстрого входа — реальные аккаунты из seed.py
const DEMO_ACCOUNTS = [
  { username: 'maria',  label: 'Мария Косова',    sub: 'Tech Lead · Администратор',        color: 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100' },
  { username: 'anna',   label: 'Анна Морозова',   sub: 'Tech Lead · Руководитель',         color: 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100' },
  { username: 'olga',   label: 'Ольга Никитина',  sub: 'QA Engineer · HR-специалист',     color: 'bg-sky-50 text-sky-900 border-sky-200 hover:bg-sky-100' },
  { username: 'pavel',  label: 'Павел Орлов',     sub: 'Frontend · Проектный менеджер',   color: 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100' },
  { username: 'sergey', label: 'Сергей Лебедев',  sub: 'DevOps · Аналитик',               color: 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100' },
  { username: 'ivan',   label: 'Иван Петров',     sub: 'Senior Backend · Сотрудник',      color: 'bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100' },
]

export default function AuthPage() {
  const { login, register, error } = useAuth()
  const [tab, setTab] = useState<Tab>('login')
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
=======
export default function AuthPage() {
  const { login, register, error } = useAuth()
  const [tab, setTab] = useState<Tab>('login')

  // login fields
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // register fields
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
  const [regEmail, setRegEmail] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regFullName, setRegFullName] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regPassword2, setRegPassword2] = useState('')
<<<<<<< HEAD
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [demoLoading, setDemoLoading] = useState<string | null>(null)
=======

  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLocalError(null)
    setSubmitting(true)
    try {
      await login({ username: loginUsername, password: loginPassword })
    } catch (err: unknown) {
      setLocalError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLocalError(null)
<<<<<<< HEAD
    if (regPassword !== regPassword2) { setLocalError('Пароли не совпадают'); return }
    setSubmitting(true)
    try {
      await register({ email: regEmail, username: regUsername, full_name: regFullName, password: regPassword })
=======
    if (regPassword !== regPassword2) {
      setLocalError('Пароли не совпадают')
      return
    }
    setSubmitting(true)
    try {
      await register({
        email: regEmail,
        username: regUsername,
        full_name: regFullName,
        password: regPassword,
      })
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
    } catch (err: unknown) {
      setLocalError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

<<<<<<< HEAD
  async function handleDemoLogin(username: string) {
    setDemoLoading(username)
    setLocalError(null)
    try {
      await login({ username, password: 'demo1234' })
    } catch (err: unknown) {
      setLocalError((err as Error).message)
    } finally {
      setDemoLoading(null)
    }
  }

  const displayError = localError || error

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 gap-5">

      {/* Шапка */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl accent-bar flex items-center justify-center">
          <Icon name="clock" className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="font-bold text-stone-900 text-lg leading-tight">WorkTime Sync</p>
          <p className="text-xs text-stone-500 leading-tight">Система актуализации рабочего времени</p>
        </div>
      </div>

      {/* Демо-доступ */}
      <div className="w-full max-w-xl bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-6 pt-5 pb-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded bg-amber-100 flex items-center justify-center">
              <Icon name="bulb" className="w-3 h-3 text-amber-700" />
            </div>
            <p className="font-bold text-stone-900 text-sm">Демо-доступ</p>
            <span className="ml-auto text-xs text-stone-400 font-mono bg-stone-100 px-2 py-0.5 rounded">пароль: demo1234</span>
          </div>
          <p className="text-xs text-stone-500 mb-4">
            Войдите под аккаунтом реального сотрудника демо-проекта
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.username}
                onClick={() => handleDemoLogin(acc.username)}
                disabled={demoLoading !== null}
                className={`flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all disabled:opacity-60 cursor-pointer ${acc.color}`}
              >
                <span className="text-sm font-semibold leading-tight">{acc.label}</span>
                <span className="text-[11px] opacity-70 leading-tight mt-0.5">{acc.sub}</span>
                {demoLoading === acc.username && (
                  <span className="text-[10px] opacity-50 mt-0.5">Вход...</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Форма входа/регистрации */}
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-stone-200">
            <button
              onClick={() => { setTab('login'); setLocalError(null) }}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors cursor-pointer ${
                tab === 'login' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400 hover:text-stone-600'
=======
  const displayError = localError || error

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl accent-bar flex items-center justify-center">
            <Icon name="clock" className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-stone-900 text-lg leading-tight">WorkTime</p>
            <p className="text-xs text-stone-500 leading-tight">Sync · v1.0</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-stone-200">
            <button
              onClick={() => { setTab('login'); setLocalError(null) }}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                tab === 'login'
                  ? 'text-stone-900 border-b-2 border-stone-900'
                  : 'text-stone-400 hover:text-stone-600'
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => { setTab('register'); setLocalError(null) }}
<<<<<<< HEAD
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors cursor-pointer ${
                tab === 'register' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400 hover:text-stone-600'
=======
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                tab === 'register'
                  ? 'text-stone-900 border-b-2 border-stone-900'
                  : 'text-stone-400 hover:text-stone-600'
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
              }`}
            >
              Регистрация
            </button>
          </div>

          <div className="p-6">
            {displayError && (
              <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {displayError}
              </div>
            )}

            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
<<<<<<< HEAD
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Email или логин</label>
                  <input type="text" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)}
                    required placeholder="ivan или ivan@worktimesync.demo"
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Пароль</label>
                  <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                    required placeholder="••••••••"
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50" />
                </div>
                <button type="submit" disabled={submitting}
                  className="w-full py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors cursor-pointer">
=======
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                    Email или логин
                  </label>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    required
                    placeholder="user@example.com"
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                    Пароль
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors mt-2"
                >
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
                  {submitting ? 'Вход...' : 'Войти'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
<<<<<<< HEAD
                <div className="px-3 py-2.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-xs">
                  После регистрации вы попадёте в демо-проект и заполните рабочий профиль
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Полное имя</label>
                  <input type="text" value={regFullName} onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Иван Иванов"
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Email</label>
                  <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                    required placeholder="user@example.com"
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Логин</label>
                  <input type="text" value={regUsername} onChange={(e) => setRegUsername(e.target.value)}
                    required placeholder="username"
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Пароль</label>
                  <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                    required placeholder="••••••••"
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Повторите пароль</label>
                  <input type="password" value={regPassword2} onChange={(e) => setRegPassword2(e.target.value)}
                    required placeholder="••••••••"
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50" />
                </div>
                <button type="submit" disabled={submitting}
                  className="w-full py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors cursor-pointer">
=======
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder="user@example.com"
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                    Имя пользователя
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    required
                    placeholder="username"
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                    Полное имя
                  </label>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Иван Иванов"
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                    Пароль
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                    Повторите пароль
                  </label>
                  <input
                    type="password"
                    value={regPassword2}
                    onChange={(e) => setRegPassword2(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors mt-2"
                >
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
                  {submitting ? 'Создание...' : 'Создать аккаунт'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
