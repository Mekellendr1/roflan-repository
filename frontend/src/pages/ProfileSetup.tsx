/**
 * Страница заполнения рабочего профиля.
 * Показывается после регистрации если profile_filled = false.
 */

import { useState } from 'react'
import { useAuth } from '../lib/authContext'
import { apiSetupProfile } from '../lib/authApi'
import Icon from '../components/Icon'

const TIMEZONES = [
  { value: 'Europe/Moscow',       label: 'Москва (UTC+3)',          short: 'МСК' },
  { value: 'Europe/Vilnius',      label: 'Вильнюс / Рига (UTC+2)',  short: 'VNO' },
  { value: 'Europe/Berlin',       label: 'Берлин / Варшава (UTC+1)',short: 'BER' },
  { value: 'Europe/London',       label: 'Лондон (UTC+0)',          short: 'LON' },
  { value: 'Europe/Lisbon',       label: 'Лиссабон (UTC+0)',        short: 'LIS' },
  { value: 'Asia/Yekaterinburg',  label: 'Екатеринбург (UTC+5)',    short: 'ЕКБ' },
  { value: 'Asia/Novosibirsk',    label: 'Новосибирск (UTC+7)',     short: 'НСК' },
  { value: 'America/New_York',    label: 'Нью-Йорк (UTC-5)',        short: 'NYC' },
  { value: 'America/Los_Angeles', label: 'Лос-Анджелес (UTC-8)',    short: 'LAX' },
  { value: 'UTC',                 label: 'UTC+0',                   short: 'UTC' },
]

const FORMATS = ['Офис', 'Удалёнка', 'Гибрид']
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 7..20

const WEEK_DAYS = [
  { idx: 0, label: 'Пн' },
  { idx: 1, label: 'Вт' },
  { idx: 2, label: 'Ср' },
  { idx: 3, label: 'Чт' },
  { idx: 4, label: 'Пт' },
  { idx: 5, label: 'Сб' },
  { idx: 6, label: 'Вс' },
]

export default function ProfileSetup({ onDone }: { onDone: () => void }) {
  const { token, refreshUser } = useAuth()

  const [role, setRole] = useState('')
  const [team, setTeam] = useState('')
  const [timezone, setTimezone] = useState('Europe/Moscow')
  const [workFormat, setWorkFormat] = useState('Офис')
  const [workStart, setWorkStart] = useState(9)
  const [workEnd, setWorkEnd] = useState(18)
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleDay = (idx: number) => {
    setDays((d) => d.includes(idx) ? d.filter((x) => x !== idx) : [...d, idx].sort())
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    if (!role.trim()) { setError('Укажите должность'); return }
    if (!team.trim()) { setError('Укажите команду'); return }
    if (workEnd <= workStart) { setError('Время окончания должно быть позже начала'); return }
    if (days.length === 0) { setError('Выберите хотя бы один рабочий день'); return }

    setSubmitting(true)
    setError(null)
    try {
      await apiSetupProfile(token, {
        role: role.trim(),
        team: team.trim(),
        timezone,
        work_format: workFormat,
        work_start: workStart,
        work_end: workEnd,
        schedule_days: days.join(','),
      })
      await refreshUser()
      onDone()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Ошибка сохранения профиля')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-stone-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Icon name="clock" className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-stone-900">Рабочий профиль</h1>
              <p className="text-xs text-stone-500">WorkTime Sync</p>
            </div>
          </div>
          <p className="text-sm text-stone-600">
            Заполните данные о вашем рабочем времени. На их основе система будет считать
            метрики актуальности и находить конфликты в расписании.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
          {/* Должность + команда */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
                Должность
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Frontend Developer"
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
                Команда
              </label>
              <input
                type="text"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                placeholder="Frontend"
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Часовой пояс */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
              Часовой пояс
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>

          {/* Формат работы */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
              Формат работы
            </label>
            <div className="flex gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setWorkFormat(f)}
                  className={`flex-1 py-2 text-sm rounded-lg border transition font-medium cursor-pointer ${
                    workFormat === f
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-stone-200 text-stone-600 hover:border-blue-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Рабочие часы */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
              Рабочие часы
            </label>
            <div className="flex items-center gap-3">
              <select
                value={workStart}
                onChange={(e) => setWorkStart(Number(e.target.value))}
                className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {HOURS.map((h) => <option key={h} value={h}>{h}:00</option>)}
              </select>
              <span className="text-stone-400 text-sm">—</span>
              <select
                value={workEnd}
                onChange={(e) => setWorkEnd(Number(e.target.value))}
                className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {HOURS.filter((h) => h > workStart).map((h) => <option key={h} value={h}>{h}:00</option>)}
              </select>
            </div>
          </div>

          {/* Рабочие дни */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
              Рабочие дни
            </label>
            <div className="flex gap-1.5">
              {WEEK_DAYS.map((d) => (
                <button
                  key={d.idx}
                  type="button"
                  onClick={() => toggleDay(d.idx)}
                  className={`flex-1 py-2 text-xs rounded-lg border transition font-semibold cursor-pointer ${
                    days.includes(d.idx)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-stone-200 text-stone-500 hover:border-blue-300'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
          >
            {submitting ? 'Сохранение...' : 'Сохранить и продолжить →'}
          </button>
        </form>
      </div>
    </div>
  )
}
