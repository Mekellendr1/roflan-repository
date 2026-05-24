/**
 * Страница редактирования своего рабочего профиля.
 * Доступна всем ролям через клик на аватар в сайдбаре.
 */

import { useEffect, useState } from 'react'
import { useAuth } from '../lib/authContext'
import { apiUpdateMyProfile } from '../lib/authApi'
import { getMyEmployee, hydrateFromList } from '../lib/derived'
import { computeAll } from '../lib/metrics'
import { http } from '../lib/api'
import TopBar from '../components/TopBar'
import Icon from '../components/Icon'
import { Badge } from '../components/Primitives'
import { riskColor } from '../lib/utils'

const TIMEZONES = [
  { value: 'Europe/Moscow',       label: 'Москва (UTC+3)' },
  { value: 'Europe/Vilnius',      label: 'Вильнюс / Рига (UTC+2)' },
  { value: 'Europe/Berlin',       label: 'Берлин (UTC+1)' },
  { value: 'Europe/London',       label: 'Лондон (UTC+0)' },
  { value: 'Europe/Lisbon',       label: 'Лиссабон (UTC+0)' },
  { value: 'Asia/Yekaterinburg',  label: 'Екатеринбург (UTC+5)' },
  { value: 'Asia/Novosibirsk',    label: 'Новосибирск (UTC+7)' },
  { value: 'America/New_York',    label: 'Нью-Йорк (UTC-5)' },
  { value: 'America/Los_Angeles', label: 'Лос-Анджелес (UTC-8)' },
  { value: 'UTC',                 label: 'UTC+0' },
]

const FORMATS = ['Офис', 'Удалёнка', 'Гибрид']
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export default function MyProfile({ onBack }: { onBack: () => void }) {
  const { user, token } = useAuth()
  const myEmp = user ? getMyEmployee(user.id) : undefined

  const [role, setRole] = useState(myEmp?.role ?? '')
  const [team, setTeam] = useState(myEmp?.team ?? '')
  const [timezone, setTimezone] = useState(myEmp?.timezone ?? 'Europe/Moscow')
  const [workFormat, setWorkFormat] = useState(myEmp?.format ?? 'Офис')
  const [workStart, setWorkStart] = useState(myEmp?.schedule.startHour ?? 9)
  const [workEnd, setWorkEnd] = useState(myEmp?.schedule.endHour ?? 18)
  const [days, setDays] = useState<number[]>(myEmp?.schedule.days ?? [0, 1, 2, 3, 4])

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleDay = (idx: number) =>
    setDays((d) => d.includes(idx) ? d.filter((x) => x !== idx) : [...d, idx].sort())

  async function reloadCache() {
    // Перегружаем сотрудников проекта чтобы кэш обновился
    try {
      const lastProject = localStorage.getItem('wt_last_project')
      if (!lastProject || !token) return
      const res = await http.get(`/projects/${lastProject}/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data: any[] = Array.isArray(res.data) ? res.data : []
      const filled = data.filter((e) => e.profile_filled !== false)
        .map(({ metrics: _m, profile_filled: _pf, ...rest }: any) => rest)
      hydrateFromList(computeAll(filled))
    } catch {}
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    setError(null)
    try {
      await apiUpdateMyProfile(token, {
        role: role.trim() || undefined,
        team: team.trim() || undefined,
        timezone,
        work_format: workFormat,
        work_start: workStart,
        work_end: workEnd,
        schedule_days: days.join(','),
      })
      await reloadCache()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  if (!myEmp) {
    return (
      <div className="fade-in">
        <TopBar title="Мой профиль">
          <button onClick={onBack} className="text-sm text-stone-500 hover:text-stone-800 cursor-pointer">← Назад</button>
        </TopBar>
        <div className="p-8">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-800 text-sm">
            Ваш рабочий профиль не найден в текущем проекте. Возможно, он ещё не заполнен
            или вы не добавлены как сотрудник.
          </div>
        </div>
      </div>
    )
  }

  const m = myEmp.metrics
  const rc = riskColor[m.riskLevel]

  return (
    <div className="fade-in">
      <TopBar title="Мой профиль" subtitle={`${myEmp.role} · ${myEmp.team}`}>
        <button onClick={onBack} className="text-sm text-stone-500 hover:text-stone-800 cursor-pointer px-3 py-2 rounded-lg border border-stone-200 hover:bg-stone-50">
          ← Назад
        </button>
      </TopBar>

      <div className="p-8 max-w-2xl space-y-6">
        {/* Текущие метрики */}
        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <p className="text-sm font-semibold text-stone-600 mb-3">Текущее состояние профиля</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-stone-500 mb-1">Актуальность</p>
              <p className={`text-xl font-bold ${m.actuality < 0.6 ? 'text-red-600' : 'text-stone-900'}`}>
                {Math.round(m.actuality * 100)}%
              </p>
              <p className="text-xs text-stone-400">{m.daysSinceUpdate} дн. без обновления</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 mb-1">Загрузка</p>
              <p className={`text-xl font-bold ${m.workload > 0.8 ? 'text-red-600' : 'text-stone-900'}`}>
                {Math.round(m.workload * 100)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-500 mb-1">Риск неактуальности</p>
              <p className={`text-xl font-bold ${rc.text}`}>{Math.round(m.integralRisk * 100)}/100</p>
              <Badge color={m.riskLevel === 'critical' || m.riskLevel === 'high' ? 'red' : m.riskLevel === 'medium' ? 'amber' : 'green'}>
                {rc.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Форма редактирования */}
        <form onSubmit={handleSave} className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
          <p className="font-semibold text-stone-900">Рабочий профиль</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Должность</label>
              <input type="text" value={role} onChange={(e) => setRole(e.target.value)}
                placeholder="Frontend Developer"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Команда</label>
              <input type="text" value={team} onChange={(e) => setTeam(e.target.value)}
                placeholder="Frontend"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Часовой пояс</label>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              {TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Формат работы</label>
            <div className="flex gap-2">
              {FORMATS.map((f) => (
                <button key={f} type="button" onClick={() => setWorkFormat(f)}
                  className={`flex-1 py-2 text-sm rounded-lg border transition font-medium cursor-pointer ${
                    workFormat === f ? 'bg-blue-600 text-white border-blue-600' : 'border-stone-200 text-stone-600 hover:border-blue-300'
                  }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Рабочие часы</label>
            <div className="flex items-center gap-3">
              <select value={workStart} onChange={(e) => setWorkStart(Number(e.target.value))}
                className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white">
                {Array.from({ length: 14 }, (_, i) => i + 7).map((h) => (
                  <option key={h} value={h}>{h}:00</option>
                ))}
              </select>
              <span className="text-stone-400">—</span>
              <select value={workEnd} onChange={(e) => setWorkEnd(Number(e.target.value))}
                className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white">
                {Array.from({ length: 14 }, (_, i) => i + 8).filter((h) => h > workStart).map((h) => (
                  <option key={h} value={h}>{h}:00</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Рабочие дни</label>
            <div className="flex gap-1.5">
              {WEEKDAYS.map((d, i) => (
                <button key={i} type="button" onClick={() => toggleDay(i)}
                  className={`flex-1 py-2 text-xs rounded-lg border transition font-semibold cursor-pointer ${
                    days.includes(i) ? 'bg-blue-600 text-white border-blue-600' : 'border-stone-200 text-stone-500 hover:border-blue-300'
                  }`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          <button type="submit" disabled={saving}
            className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer">
            {saved ? '✓ Сохранено' : saving ? 'Сохранение...' : 'Сохранить профиль'}
          </button>
        </form>

        {/* Мои рекомендации */}
        {m.recommendations.length > 0 && (
          <div className="bg-white border border-stone-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="bulb" className="w-4 h-4 text-sky-600" />
              <p className="font-semibold text-stone-900">Рекомендации для вас</p>
            </div>
            <div className="space-y-2">
              {m.recommendations.filter(r => r.action !== 'Действий не требуется').map((r) => (
                <div key={r.id} className="flex items-start gap-3 bg-sky-50 border border-sky-200 rounded-lg px-4 py-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-stone-900">{r.action}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{r.reason}</p>
                  </div>
                  <Badge color={r.priority === 'high' ? 'red' : r.priority === 'medium' ? 'amber' : 'stone'}>
                    {r.priority === 'high' ? 'важно' : r.priority === 'medium' ? 'средне' : 'низкий'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
