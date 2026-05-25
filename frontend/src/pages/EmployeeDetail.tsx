import { useState } from 'react'
import { RISK_WEIGHTS, computeAll } from '../lib/metrics'
import { WEEKDAYS } from '../lib/mockData'
import { getEmployee, hydrateFromList, getMyEmployee } from '../lib/derived'
import { COMPUTED } from '../lib/derived'
import { useAuth } from '../lib/authContext'
import { avatarColor, riskColor } from '../lib/utils'
import { Avatar, Badge, RiskGauge } from '../components/Primitives'
import Icon from '../components/Icon'
import TopBar, { GhostButton } from '../components/TopBar'
import { http } from '../lib/api'
import type { ExceptionType, WorkFormat } from '../lib/types'

const EXC_LABEL: Record<string, string> = {
  vacation: 'Отпуск',
  sick: 'Больничный',
  business_trip: 'Командировка',
  personal: 'Личные часы',
}
const FORMATS: WorkFormat[] = ['Офис', 'Удалёнка', 'Гибрид']

function authHeader() {
  const token = localStorage.getItem('wt_token') || ''
  return { headers: { Authorization: `Bearer ${token}` } }
}

// Перегружаем весь список сотрудников проекта из бэка
async function reloadProjectCache() {
  try {
    const token = localStorage.getItem('wt_token')
    const lastProject = localStorage.getItem('wt_last_project')
    if (!token || !lastProject) return
    const res = await http.get(`/projects/${lastProject}/employees`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data: any[] = Array.isArray(res.data) ? res.data : []
    const filled = data
      .filter((e) => e.profile_filled !== false)
      .map(({ metrics: _m, profile_filled: _pf, ...rest }: any) => rest)
    hydrateFromList(computeAll(filled))
  } catch (err) {
    console.error('cache reload failed', err)
  }
}

export default function EmployeeDetail({
  empId,
  onBack,
  setRoute,
  currentRole,
}: {
  empId: string
  onBack?: () => void
  setRoute: (r: string) => void
  currentRole?: import('../lib/authTypes').ProjectRole | null
}) {
  // Читаем из derived.ts кэша (туда попадают данные с бэка)
  const { user } = useAuth()
  const e = getEmployee(empId)
  const myEmp = user ? getMyEmployee(user.id) : undefined

  // Кто может редактировать: сам сотрудник, HR-специалист, Администратор
  const isMyProfile = myEmp?.id === empId
  const canEdit = isMyProfile
    || currentRole === 'Администратор'
    || currentRole === 'HR-специалист'

  const [editSched, setEditSched] = useState(false)
  const [start, setStart] = useState(e?.schedule.startHour ?? 9)
  const [end, setEnd] = useState(e?.schedule.endHour ?? 18)
  const [days, setDays] = useState<number[]>(e?.schedule.days ?? [0, 1, 2, 3, 4])
  const [showExc, setShowExc] = useState(false)
  const [excType, setExcType] = useState<ExceptionType>('vacation')
  const [excNote, setExcNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [tick, setTick] = useState(0) // форсирует перерендер после мутаций

  if (!e)
    return (
      <div className="p-8">
        <TopBar title="Не найден" subtitle="Сотрудник не найден в текущем проекте">
          <GhostButton icon="back" label="К списку" onClick={() => setRoute('employees')} />
        </TopBar>
      </div>
    )

  const m = e.metrics
  const rc = riskColor[m.riskLevel]

  const riskParts = [
    { label: '(1−Ai) актуальность', w: RISK_WEIGHTS.a, v: 1 - m.actuality },
    { label: 'Ci конфликты', w: RISK_WEIGHTS.c, v: m.outOfHoursRatio },
    { label: 'Li загрузка', w: RISK_WEIGHTS.l, v: Math.min(m.workload, 1.5) },
    { label: 'Zi пояс', w: RISK_WEIGHTS.z, v: m.timezoneShift },
    { label: 'Hi HR-расхождение', w: RISK_WEIGHTS.h, v: m.hrMismatch },
  ]

  const history = e.history ?? []
  const pts = history.map((h) => h.riskAt)
  const maxR = Math.max(0.5, ...pts)

  const toggleDay = (d: number) =>
    setDays((arr) => arr.includes(d) ? arr.filter((x) => x !== d) : [...arr, d].sort())

  async function handleConfirmActuality() {
    setSaving(true)
    try {
      await http.post(`/employees/${empId}/confirm-actuality`, {}, authHeader())
      await reloadProjectCache()
      setTick((t) => t + 1)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function saveSched() {
    setSaving(true)
    try {
      const res = await http.put(`/employees/${empId}/schedule`, {
        days, start_hour: start, end_hour: end,
      }, authHeader())
      await reloadProjectCache()
      setTick((t) => t + 1)
      setEditSched(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleFormatChange(fmt: WorkFormat) {
    setSaving(true)
    try {
      const res = await http.put(`/employees/${empId}/format`, { work_format: fmt }, authHeader())
      await reloadProjectCache()
      setTick((t) => t + 1)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function saveExc() {
    if (!excNote.trim()) return
    setSaving(true)
    try {
      const res = await http.post(`/employees/${empId}/exceptions`, {
        type: excType, note: excNote,
      }, authHeader())
      await reloadProjectCache()
      setTick((t) => t + 1)
      setExcNote('')
      setShowExc(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function removeExc(excId: string) {
    setSaving(true)
    try {
      await http.delete(`/employees/${empId}/exceptions/${excId}`, authHeader())
      await reloadProjectCache()
      setTick((t) => t + 1)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fade-in">
      <TopBar title={e.name} subtitle={`${e.role} · ${e.team}`}>
        {canEdit && (
          <button
            onClick={handleConfirmActuality}
            disabled={saving}
            className="px-3 py-2 text-sm rounded-lg bg-sky-500 text-white hover:bg-sky-400 font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            <Icon name="check" className="w-4 h-4" />
            Подтвердить актуальность
          </button>
        )}
        <GhostButton icon="back" label="К списку" onClick={() => setRoute('employees')} />
      </TopBar>

      <div className="p-8 space-y-6">
        {/* Шапка профиля */}
        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <div className="flex items-start gap-5">
            <Avatar initials={e.initials} color={avatarColor(m.riskLevel)} size="lg" />
            <div className="flex-1">
              <p className="text-xl font-bold text-stone-900">{e.name}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-stone-500">
                <span className="flex items-center gap-1">
                  <Icon name="pin" className="w-3.5 h-3.5" /> {e.timezone} (UTC{e.tzOffset >= 0 ? '+' + e.tzOffset : e.tzOffset})
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="clock" className="w-3.5 h-3.5" />
                  {e.schedule.startHour}:00–{e.schedule.endHour}:00
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="building" className="w-3.5 h-3.5" />
                  {canEdit ? (
                    <select
                      value={e.format}
                      onChange={(ev) => handleFormatChange(ev.target.value as WorkFormat)}
                      className="text-sm border border-stone-200 rounded px-1.5 py-0.5 bg-white cursor-pointer"
                    >
                      {FORMATS.map((f) => <option key={f}>{f}</option>)}
                    </select>
                  ) : (
                    <span className="text-sm">{e.format}</span>
                  )}
                </span>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Badge color={m.riskLevel === 'critical' || m.riskLevel === 'high' ? 'red' : m.riskLevel === 'medium' ? 'amber' : 'green'}>
                  {rc.label} риск неактуальности
                </Badge>
                {m.hrMismatch === 1 && <Badge color="amber">HR: {e.hrFormat}</Badge>}
                {m.timezoneShift === 1 && <Badge color="amber">смена пояса</Badge>}
                {m.hasExceptions && <Badge color="blue">есть исключения</Badge>}
              </div>
            </div>
            <div className="flex flex-col items-center pl-6 border-l border-stone-200">
              <RiskGauge value={m.integralRisk} size={88} />
              <p className="text-[10px] text-stone-500 uppercase tracking-wider mt-1">интегральный риск</p>
            </div>
          </div>
        </div>

        {/* Показатели */}
        <div className="grid grid-cols-4 gap-3">
          <Metric label="Актуальность Ai" value={`${Math.round(m.actuality * 100)}%`} sub={`${m.daysSinceUpdate} дн. без обновления`} alert={m.actuality < 0.6} />
          <Metric label="Загрузка Li" value={`${Math.round(m.workload * 100)}%`} sub={`${m.busyHours}ч / ${m.workHours}ч`} alert={m.workload > 0.8} />
          <Metric label="Конфликты Ci" value={`${Math.round(m.outOfHoursRatio * 100)}%`} sub={`${m.meetingsOutOfHours} из ${m.meetingsTotal} встреч`} alert={m.outOfHoursRatio > 0.25} />
          <Metric label="Всего конфликтов" value={m.conflictCount} sub="календарь ↔ график" alert={m.conflictCount > 2} />
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Разложение риска */}
          <div className="bg-white border border-stone-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="formula" className="w-4 h-4 text-stone-500" />
              <h2 className="font-bold text-stone-900">Из чего складывается риск</h2>
            </div>
            <code className="block font-mono text-xs bg-stone-900 text-sky-400 rounded-lg p-3 mb-4">
              Ri = 0.25·(1−Ai) + 0.30·Ci + 0.25·Li + 0.10·Zi + 0.10·Hi
            </code>
            <div className="space-y-2.5">
              {riskParts.map((p) => {
                const contribution = p.w * p.v
                return (
                  <div key={p.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-stone-600">{p.label}</span>
                      <span className="text-stone-900">{p.w} × {p.v.toFixed(2)} = {contribution.toFixed(3)}</span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-stone-800 rounded-full" style={{ width: `${Math.min(contribution / 0.5, 1) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between">
              <span className="font-semibold text-stone-900">Итого Ri</span>
              <span className={`font-bold ${rc.text}`}>{m.integralRisk.toFixed(3)} ({Math.round(m.integralRisk * 100)}/100)</span>
            </div>
          </div>

          {/* График + исключения */}
          <div className="space-y-4">
            <div className="bg-white border border-stone-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-stone-900">Заявленный график</h2>
                {canEdit && (
                  <button onClick={() => setEditSched((v) => !v)} className="text-sm text-sky-700 font-medium hover:underline cursor-pointer">
                    {editSched ? 'Отмена' : 'Изменить'}
                  </button>
                )}
              </div>
              {!editSched ? (
                <>
                  <div className="flex gap-1.5 mb-3">
                    {WEEKDAYS.map((d, i) => (
                      <div key={d} className={`flex-1 text-center py-2 rounded-lg text-xs font-medium ${e.schedule.days.includes(i) ? 'bg-sky-100 text-sky-800' : 'bg-stone-100 text-stone-400'}`}>{d}</div>
                    ))}
                  </div>
                  <p className="text-sm text-stone-600">
                    Рабочие часы: <span className="font-semibold text-stone-900">{e.schedule.startHour}:00–{e.schedule.endHour}:00</span> ({e.tzShort})
                  </p>
                  <p className="text-xs text-stone-500 mt-1">Последнее обновление: {m.daysSinceUpdate} дн. назад</p>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-1.5">
                    {WEEKDAYS.map((d, i) => (
                      <button key={d} onClick={() => toggleDay(i)} className={`flex-1 py-2 rounded-lg text-xs font-medium cursor-pointer ${days.includes(i) ? 'bg-sky-500 text-white' : 'bg-stone-100 text-stone-400'}`}>{d}</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <label className="text-stone-600">С</label>
                    <input type="number" min={0} max={23} value={start} onChange={(ev) => setStart(Number(ev.target.value))} className="w-16 border border-stone-200 rounded px-2 py-1" />
                    <label className="text-stone-600">До</label>
                    <input type="number" min={1} max={24} value={end} onChange={(ev) => setEnd(Number(ev.target.value))} className="w-16 border border-stone-200 rounded px-2 py-1" />
                  </div>
                  <button onClick={saveSched} disabled={saving} className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-semibold hover:bg-stone-800 disabled:opacity-50 cursor-pointer">
                    {saving ? 'Сохранение...' : 'Сохранить график'}
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-stone-900">Исключения ({e.exceptions.length})</h2>
                {canEdit && (
                  <button onClick={() => setShowExc((v) => !v)} className="text-sm text-sky-700 font-medium hover:underline cursor-pointer">
                    {showExc ? 'Отмена' : '+ Добавить'}
                  </button>
                )}
              </div>
              {showExc && (
                <div className="mb-3 p-3 bg-stone-50 rounded-lg space-y-2">
                  <select value={excType} onChange={(ev) => setExcType(ev.target.value as ExceptionType)} className="w-full border border-stone-200 rounded px-2 py-1.5 text-sm bg-white">
                    <option value="vacation">Отпуск</option>
                    <option value="sick">Больничный</option>
                    <option value="business_trip">Командировка</option>
                    <option value="personal">Личные часы</option>
                  </select>
                  <input value={excNote} onChange={(ev) => setExcNote(ev.target.value)} placeholder="Например: отпуск 1–7 июня" className="w-full border border-stone-200 rounded px-2 py-1.5 text-sm" />
                  <button onClick={saveExc} disabled={saving} className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-sm font-semibold hover:bg-stone-800 disabled:opacity-50 cursor-pointer">
                    {saving ? '...' : 'Добавить исключение'}
                  </button>
                </div>
              )}
              {e.exceptions.length === 0 ? (
                <p className="text-sm text-stone-500">Нет активных исключений</p>
              ) : (
                <div className="space-y-2">
                  {e.exceptions.map((x) => (
                    <div key={x.id} className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                      <Badge color="blue">{EXC_LABEL[x.type] ?? x.type}</Badge>
                      <span className="text-sm text-stone-700 flex-1">{x.note}</span>
                      {canEdit && (
                        <button onClick={() => removeExc(x.id)} className="text-stone-400 hover:text-red-500 cursor-pointer">
                          <Icon name="x" className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* История */}
        {pts.length > 0 && (
          <div className="bg-white border border-stone-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="clock" className="w-4 h-4 text-stone-500" />
              <h2 className="font-bold text-stone-900">История изменений</h2>
            </div>
            {pts.length > 1 && (
              <div className="mb-5">
                <svg viewBox={`0 0 ${Math.max(pts.length - 1, 1) * 80} 100`} className="w-full h-24" preserveAspectRatio="none">
                  <polyline fill="none" stroke="#60a5fa" strokeWidth="2" points={pts.map((p, i) => `${i * 80},${100 - (p / maxR) * 90 - 5}`).join(' ')} />
                  {pts.map((p, i) => <circle key={i} cx={i * 80} cy={100 - (p / maxR) * 90 - 5} r="3" fill="#1e40af" />)}
                </svg>
                <p className="text-xs text-stone-400 mt-1">Динамика Ri (чем ниже — тем актуальнее)</p>
              </div>
            )}
            <div className="space-y-2">
              {[...history].reverse().map((h) => (
                <div key={h.id} className="flex items-center gap-3 border-l-4 border-l-stone-300 bg-stone-50 rounded-lg px-4 py-2.5">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-stone-900">{h.action}</p>
                    <p className="text-xs text-stone-500">{h.detail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-stone-600">Ri {Math.round(h.riskAt * 100)}</p>
                    <p className="text-[10px] text-stone-400">{new Date(h.date).toLocaleDateString('ru')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* События */}
        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <h2 className="font-bold text-stone-900 mb-3">Фактические события ({e.events.length})</h2>
          {e.events.length === 0 ? (
            <p className="text-sm text-stone-500">Нет зафиксированных событий</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {e.events.map((ev) => {
                const inSchedule = e.schedule.days.includes(ev.day) && ev.startHour >= e.schedule.startHour && ev.endHour <= e.schedule.endHour
                return (
                  <div key={ev.id} className={`flex items-center gap-3 rounded-lg px-3 py-2 border ${!inSchedule && ev.type !== 'focus' ? 'bg-red-50 border-red-200' : 'bg-stone-50 border-stone-200'}`}>
                    <span className="text-xs text-stone-400 w-6">{WEEKDAYS[ev.day]}</span>
                    <span className="text-sm text-stone-800 flex-1 truncate">{ev.title}</span>
                    <span className="text-xs text-stone-500">{Math.floor(ev.startHour)}:{String(Math.round((ev.startHour % 1) * 60)).padStart(2, '0')}–{Math.floor(ev.endHour)}:{String(Math.round((ev.endHour % 1) * 60)).padStart(2, '0')}</span>
                    {!inSchedule && ev.type !== 'focus' && <Badge color="red">вне графика</Badge>}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Рекомендации */}
        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="bulb" className="w-4 h-4 text-sky-600" />
            <h2 className="font-bold text-stone-900">Рекомендации</h2>
          </div>
          <div className="space-y-2">
            {m.recommendations.map((r) => (
              <div key={r.id} className="flex items-start gap-3 border-l-4 border-l-sky-500 bg-sky-50 rounded-lg px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-stone-900">{r.action}</p>
                  <p className="text-xs text-stone-600 mt-0.5">{r.reason}</p>
                </div>
                <Badge color={r.priority === 'high' ? 'red' : r.priority === 'medium' ? 'amber' : 'stone'}>
                  {r.priority === 'high' ? 'высокий' : r.priority === 'medium' ? 'средний' : 'низкий'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, sub, alert }: { label: string; value: string | number; sub: string; alert?: boolean }) {
  return (
    <div className={`rounded-xl p-4 border ${alert ? 'bg-red-50 border-red-200' : 'bg-white border-stone-200'}`}>
      <p className="text-xs text-stone-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${alert ? 'text-red-700' : 'text-stone-900'}`}>{value}</p>
      <p className="text-xs text-stone-500 mt-0.5">{sub}</p>
    </div>
  )
}
