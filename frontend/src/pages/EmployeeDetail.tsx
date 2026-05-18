import { useState } from 'react'
import { RISK_WEIGHTS } from '../lib/metrics'
import { WEEKDAYS } from '../lib/mockData'
import { useStore } from '../lib/store'
import { avatarColor, riskColor } from '../lib/utils'
import { Avatar, Badge, RiskGauge } from '../components/Primitives'
import Icon from '../components/Icon'
import TopBar, { GhostButton } from '../components/TopBar'
import type { ExceptionType, WorkFormat } from '../lib/types'

const EXC_LABEL: Record<string, string> = {
  vacation: 'Отпуск',
  sick: 'Больничный',
  business_trip: 'Командировка',
  personal: 'Личные часы',
}
const FORMATS: WorkFormat[] = ['Офис', 'Удалёнка', 'Гибрид']

export default function EmployeeDetail({
  empId,
  setRoute,
}: {
  empId: string
  setRoute: (r: string) => void
}) {
  const {
    getEmployee,
    confirmActuality,
    updateSchedule,
    updateFormat,
    addException,
    removeException,
  } = useStore()
  const e = getEmployee(empId)

  const [editSched, setEditSched] = useState(false)
  const [start, setStart] = useState(e?.schedule.startHour ?? 9)
  const [end, setEnd] = useState(e?.schedule.endHour ?? 18)
  const [days, setDays] = useState<number[]>(e?.schedule.days ?? [0, 1, 2, 3, 4])
  const [showExc, setShowExc] = useState(false)
  const [excType, setExcType] = useState<ExceptionType>('vacation')
  const [excNote, setExcNote] = useState('')

  if (!e)
    return (
      <div className="p-8">
        <TopBar title="Не найден" />
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
  // точки графика динамики риска
  const pts = history.map((h) => h.riskAt)
  const maxR = Math.max(0.5, ...pts)

  const toggleDay = (d: number) =>
    setDays((arr) =>
      arr.includes(d) ? arr.filter((x) => x !== d) : [...arr, d].sort()
    )

  const saveSched = () => {
    updateSchedule(e.id, { days, startHour: start, endHour: end })
    setEditSched(false)
  }

  const saveExc = () => {
    if (!excNote.trim()) return
    addException(e.id, {
      type: excType,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 5 * 864e5).toISOString(),
      note: excNote,
      source: 'Добавлено вручную',
    })
    setExcNote('')
    setShowExc(false)
  }

  return (
    <div className="fade-in">
      <TopBar title={e.name} subtitle={`${e.role} · ${e.team}`}>
        <button
          onClick={() => confirmActuality(e.id)}
          className="px-3 py-2 text-sm rounded-lg bg-lime-500 text-stone-900 hover:bg-lime-400 font-semibold flex items-center gap-2"
        >
          <Icon name="check" className="w-4 h-4" />
          Подтвердить актуальность
        </button>
        <GhostButton
          icon="back"
          label="К списку"
          onClick={() => setRoute('employees')}
        />
      </TopBar>

      <div className="p-8 space-y-6">
        {/* Шапка профиля */}
        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <div className="flex items-start gap-5">
            <Avatar
              initials={e.initials}
              color={avatarColor(m.riskLevel)}
              size="lg"
            />
            <div className="flex-1">
              <p className="text-xl font-bold text-stone-900">{e.name}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-stone-500">
                <span className="flex items-center gap-1">
                  <Icon name="pin" className="w-3.5 h-3.5" /> {e.timezone} (UTC
                  {e.tzOffset >= 0 ? '+' + e.tzOffset : e.tzOffset})
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="clock" className="w-3.5 h-3.5" />
                  {e.schedule.startHour}:00–{e.schedule.endHour}:00
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="building" className="w-3.5 h-3.5" />
                  <select
                    value={e.format}
                    onChange={(ev) =>
                      updateFormat(e.id, ev.target.value as WorkFormat)
                    }
                    className="text-sm border border-stone-200 rounded px-1.5 py-0.5 bg-white"
                  >
                    {FORMATS.map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </span>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Badge
                  color={
                    m.riskLevel === 'critical' || m.riskLevel === 'high'
                      ? 'red'
                      : m.riskLevel === 'medium'
                        ? 'amber'
                        : 'green'
                  }
                >
                  {rc.label} риск неактуальности
                </Badge>
                {m.hrMismatch === 1 && (
                  <Badge color="amber">HR: {e.hrFormat}</Badge>
                )}
                {m.timezoneShift === 1 && (
                  <Badge color="amber">смена пояса</Badge>
                )}
                {m.hasExceptions && <Badge color="blue">есть исключения</Badge>}
              </div>
            </div>
            <div className="flex flex-col items-center pl-6 border-l border-stone-200">
              <RiskGauge value={m.integralRisk} size={88} />
              <p className="text-[10px] text-stone-500 uppercase tracking-wider mt-1">
                интегральный риск
              </p>
            </div>
          </div>
        </div>

        {/* Показатели */}
        <div className="grid grid-cols-4 gap-3">
          <Metric
            label="Актуальность Ai"
            value={`${Math.round(m.actuality * 100)}%`}
            sub={`${m.daysSinceUpdate} дн. без обновления`}
            alert={m.actuality < 0.6}
          />
          <Metric
            label="Загрузка Li"
            value={`${Math.round(m.workload * 100)}%`}
            sub={`${m.busyHours}ч / ${m.workHours}ч`}
            alert={m.workload > 0.8}
          />
          <Metric
            label="Конфликты Ci"
            value={`${Math.round(m.outOfHoursRatio * 100)}%`}
            sub={`${m.meetingsOutOfHours} из ${m.meetingsTotal} встреч`}
            alert={m.outOfHoursRatio > 0.25}
          />
          <Metric
            label="Всего конфликтов"
            value={m.conflictCount}
            sub="календарь ↔ график"
            alert={m.conflictCount > 2}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Разложение риска */}
          <div className="bg-white border border-stone-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="formula" className="w-4 h-4 text-stone-500" />
              <h2 className="font-bold text-stone-900">
                Из чего складывается риск
              </h2>
            </div>
            <code className="block font-mono text-xs bg-stone-900 text-lime-400 rounded-lg p-3 mb-4">
              Ri = 0.25·(1−Ai) + 0.30·Ci + 0.25·Li + 0.10·Zi + 0.10·Hi
            </code>
            <div className="space-y-2.5">
              {riskParts.map((p) => {
                const contribution = p.w * p.v
                return (
                  <div key={p.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-stone-600">{p.label}</span>
                      <span className="font-mono text-stone-900">
                        {p.w} × {p.v.toFixed(2)} = {contribution.toFixed(3)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-stone-800 rounded-full"
                        style={{
                          width: `${Math.min(contribution / 0.5, 1) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between">
              <span className="font-semibold text-stone-900">Итого Ri</span>
              <span className={`font-mono font-bold ${rc.text}`}>
                {m.integralRisk.toFixed(3)} ({Math.round(m.integralRisk * 100)}
                /100)
              </span>
            </div>
          </div>

          {/* Расписание (редактируемое) + исключения */}
          <div className="space-y-4">
            <div className="bg-white border border-stone-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-stone-900">Заявленный график</h2>
                <button
                  onClick={() => setEditSched((v) => !v)}
                  className="text-sm text-lime-700 font-medium hover:underline"
                >
                  {editSched ? 'Отмена' : 'Изменить'}
                </button>
              </div>

              {!editSched ? (
                <>
                  <div className="flex gap-1.5 mb-3">
                    {WEEKDAYS.map((d, i) => (
                      <div
                        key={d}
                        className={`flex-1 text-center py-2 rounded-lg text-xs font-medium ${
                          e.schedule.days.includes(i)
                            ? 'bg-lime-100 text-lime-800'
                            : 'bg-stone-100 text-stone-400'
                        }`}
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-stone-600">
                    Рабочие часы:{' '}
                    <span className="font-mono font-semibold text-stone-900">
                      {e.schedule.startHour}:00–{e.schedule.endHour}:00
                    </span>{' '}
                    ({e.tzShort})
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    Последнее обновление: {m.daysSinceUpdate} дн. назад
                  </p>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-1.5">
                    {WEEKDAYS.map((d, i) => (
                      <button
                        key={d}
                        onClick={() => toggleDay(i)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium ${
                          days.includes(i)
                            ? 'bg-lime-500 text-stone-900'
                            : 'bg-stone-100 text-stone-400'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <label className="text-stone-600">С</label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={start}
                      onChange={(ev) => setStart(Number(ev.target.value))}
                      className="w-16 border border-stone-200 rounded px-2 py-1 font-mono"
                    />
                    <label className="text-stone-600">До</label>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={end}
                      onChange={(ev) => setEnd(Number(ev.target.value))}
                      className="w-16 border border-stone-200 rounded px-2 py-1 font-mono"
                    />
                  </div>
                  <button
                    onClick={saveSched}
                    className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-semibold hover:bg-stone-800"
                  >
                    Сохранить график
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-stone-900">
                  Исключения ({e.exceptions.length})
                </h2>
                <button
                  onClick={() => setShowExc((v) => !v)}
                  className="text-sm text-lime-700 font-medium hover:underline"
                >
                  {showExc ? 'Отмена' : '+ Добавить'}
                </button>
              </div>

              {showExc && (
                <div className="mb-3 p-3 bg-stone-50 rounded-lg space-y-2">
                  <select
                    value={excType}
                    onChange={(ev) =>
                      setExcType(ev.target.value as ExceptionType)
                    }
                    className="w-full border border-stone-200 rounded px-2 py-1.5 text-sm bg-white"
                  >
                    <option value="vacation">Отпуск</option>
                    <option value="sick">Больничный</option>
                    <option value="business_trip">Командировка</option>
                    <option value="personal">Личные часы</option>
                  </select>
                  <input
                    value={excNote}
                    onChange={(ev) => setExcNote(ev.target.value)}
                    placeholder="Например: отпуск 1–7 июня"
                    className="w-full border border-stone-200 rounded px-2 py-1.5 text-sm"
                  />
                  <button
                    onClick={saveExc}
                    className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-sm font-semibold hover:bg-stone-800"
                  >
                    Добавить исключение
                  </button>
                </div>
              )}

              {e.exceptions.length === 0 ? (
                <p className="text-sm text-stone-500">
                  Нет активных исключений
                </p>
              ) : (
                <div className="space-y-2">
                  {e.exceptions.map((x) => (
                    <div
                      key={x.id}
                      className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2"
                    >
                      <Badge color="blue">{EXC_LABEL[x.type]}</Badge>
                      <span className="text-sm text-stone-700 flex-1">
                        {x.note}
                      </span>
                      <button
                        onClick={() => removeException(e.id, x.id)}
                        className="text-stone-400 hover:text-red-500"
                      >
                        <Icon name="x" className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* История изменений (раздел 3 ТЗ, проблема №11) */}
        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="clock" className="w-4 h-4 text-stone-500" />
            <h2 className="font-bold text-stone-900">
              История изменений и динамика риска
            </h2>
          </div>

          {pts.length > 1 && (
            <div className="mb-5">
              <svg
                viewBox={`0 0 ${Math.max(pts.length - 1, 1) * 80} 100`}
                className="w-full h-24"
                preserveAspectRatio="none"
              >
                <polyline
                  fill="none"
                  stroke="#84cc16"
                  strokeWidth="2"
                  points={pts
                    .map(
                      (p, i) =>
                        `${i * 80},${100 - (p / maxR) * 90 - 5}`
                    )
                    .join(' ')}
                />
                {pts.map((p, i) => (
                  <circle
                    key={i}
                    cx={i * 80}
                    cy={100 - (p / maxR) * 90 - 5}
                    r="3"
                    fill="#4d7c0f"
                  />
                ))}
              </svg>
              <p className="text-xs text-stone-400 mt-1">
                Динамика Ri по событиям профиля (чем ниже — тем актуальнее)
              </p>
            </div>
          )}

          <div className="space-y-2">
            {[...history].reverse().map((h) => (
              <div
                key={h.id}
                className="flex items-center gap-3 border-l-4 border-l-stone-300 bg-stone-50 rounded-lg px-4 py-2.5"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-stone-900">
                    {h.action}
                  </p>
                  <p className="text-xs text-stone-500">{h.detail}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono text-stone-600">
                    Ri {Math.round(h.riskAt * 100)}
                  </p>
                  <p className="text-[10px] text-stone-400">
                    {new Date(h.date).toLocaleDateString('ru')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* События */}
        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <h2 className="font-bold text-stone-900 mb-3">
            Фактические события ({e.events.length})
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {e.events.map((ev) => {
              const inSchedule =
                e.schedule.days.includes(ev.day) &&
                ev.startHour >= e.schedule.startHour &&
                ev.endHour <= e.schedule.endHour
              return (
                <div
                  key={ev.id}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 border ${
                    !inSchedule && ev.type !== 'focus'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <span className="text-xs font-mono text-stone-400 w-6">
                    {WEEKDAYS[ev.day]}
                  </span>
                  <span className="text-sm text-stone-800 flex-1 truncate">
                    {ev.title}
                  </span>
                  <span className="text-xs font-mono text-stone-500">
                    {ev.startHour}:00–{ev.endHour}:00
                  </span>
                  {!inSchedule && ev.type !== 'focus' && (
                    <Badge color="red">вне графика</Badge>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Рекомендации */}
        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="bulb" className="w-4 h-4 text-lime-600" />
            <h2 className="font-bold text-stone-900">Рекомендации</h2>
          </div>
          <div className="space-y-2">
            {m.recommendations.map((r) => (
              <div
                key={r.id}
                className="flex items-start gap-3 border-l-4 border-l-lime-500 bg-lime-50 rounded-lg px-4 py-3"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-stone-900">
                    {r.action}
                  </p>
                  <p className="text-xs text-stone-600 mt-0.5">{r.reason}</p>
                </div>
                <Badge
                  color={
                    r.priority === 'high'
                      ? 'red'
                      : r.priority === 'medium'
                        ? 'amber'
                        : 'stone'
                  }
                >
                  {r.priority === 'high'
                    ? 'высокий'
                    : r.priority === 'medium'
                      ? 'средний'
                      : 'низкий'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  sub,
  alert,
}: {
  label: string
  value: string | number
  sub: string
  alert?: boolean
}) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        alert ? 'bg-red-50 border-red-200' : 'bg-white border-stone-200'
      }`}
    >
      <p className="text-xs text-stone-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p
        className={`text-2xl font-bold font-mono ${
          alert ? 'text-red-700' : 'text-stone-900'
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-stone-500 mt-0.5">{sub}</p>
    </div>
  )
}
