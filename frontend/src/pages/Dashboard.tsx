import { useState } from 'react'
<<<<<<< HEAD
import { COMPUTED, dashboardStats, diagnosticGroups, getMyEmployee } from '../lib/derived'
import { useAuth } from '../lib/authContext'
import { avatarColor, riskColor } from '../lib/utils'
import { Avatar, Badge, RiskGauge } from '../components/Primitives'
import Icon from '../components/Icon'
import TopBar, { GhostButton } from '../components/TopBar'
import type { ProjectRole } from '../lib/authTypes'

const WEEKDAY = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export default function Dashboard({
  setRoute,
  currentRole,
}: {
  setRoute: (r: string) => void
  currentRole?: ProjectRole | null
}) {
  const { user } = useAuth()
  const isEmployee = currentRole === 'Сотрудник'
  const myEmp = user ? getMyEmployee(user.id) : undefined

  if (isEmployee) {
    return <EmployeeDashboard emp={myEmp} setRoute={setRoute} />
  }
  return <TeamDashboard setRoute={setRoute} currentRole={currentRole} />
}

// ─── Личный дашборд Сотрудника ───────────────────────────────────────────────

function EmployeeDashboard({ emp, setRoute }: { emp: any; setRoute: (r: string) => void }) {
  if (!emp) {
    return (
      <div className="fade-in">
        <TopBar title="Дашборд" subtitle="Добро пожаловать в WorkTime Sync" />
        <div className="p-8">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800">
            <p className="font-semibold mb-1">Рабочий профиль не заполнен</p>
            <p className="text-sm">Кликните на свой аватар в сайдбаре чтобы заполнить профиль и начать работу.</p>
          </div>
        </div>
      </div>
    )
  }

  const m = emp.metrics
  const rc = riskColor[m.riskLevel]

  return (
    <div className="fade-in">
      <TopBar title="Мой дашборд" subtitle="Ваш рабочий профиль и актуальность данных">
        <button
          onClick={() => setRoute('my-profile')}
          className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold flex items-center gap-2 cursor-pointer"
        >
          <Icon name="edit" className="w-4 h-4" />
          Обновить профиль
        </button>
      </TopBar>

      <div className="p-8 bg-gray-50 min-h-[calc(100vh-100px)] space-y-6">
        {/* Карточка профиля */}
        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <div className="flex items-center gap-5">
            <Avatar initials={emp.initials} color={avatarColor(m.riskLevel)} size="lg" />
            <div className="flex-1">
              <p className="text-xl font-bold text-stone-900">{emp.name}</p>
              <p className="text-sm text-stone-500 mt-0.5">{emp.role} · {emp.team}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-stone-500">
                <span className="flex items-center gap-1">
                  <Icon name="pin" className="w-3.5 h-3.5" />
                  {emp.tzShort} (UTC{emp.tzOffset >= 0 ? '+' + emp.tzOffset : emp.tzOffset})
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="clock" className="w-3.5 h-3.5" />
                  {emp.schedule.startHour}:00–{emp.schedule.endHour}:00
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="building" className="w-3.5 h-3.5" />
                  {emp.format}
                </span>
              </div>
            </div>
            <div className="text-center">
              <RiskGauge value={m.integralRisk} size={80} />
              <p className="text-[10px] text-stone-500 uppercase tracking-wider mt-1">риск Ri</p>
            </div>
          </div>
        </div>

        {/* Личные KPI */}
        <div className="grid grid-cols-4 gap-4">
          <Kpi
            label="Актуальность Ai"
            value={`${Math.round(m.actuality * 100)}%`}
            sub={`${m.daysSinceUpdate} дн. без обновления`}
            tone={m.actuality < 0.6 ? 'danger' : 'neutral'}
          />
          <Kpi
            label="Загрузка Li"
            value={`${Math.round(m.workload * 100)}%`}
            sub={`${m.busyHours}ч занято из ${m.workHours}ч`}
            tone={m.workload > 0.8 ? 'danger' : 'neutral'}
          />
          <Kpi
            label="Конфликты Ci"
            value={m.conflictCount}
            sub={`${m.meetingsOutOfHours} встреч вне графика`}
            tone={m.conflictCount > 0 ? 'warning' : 'neutral'}
          />
          <Kpi
            label="Статус профиля"
            value={rc.label}
            sub={`Риск ${Math.round(m.integralRisk * 100)}/100`}
            tone={m.riskLevel === 'critical' || m.riskLevel === 'high' ? 'danger' : m.riskLevel === 'medium' ? 'warning' : 'neutral'}
          />
        </div>

        {/* Действие */}
        {m.actuality < 0.8 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-200 flex items-center justify-center flex-shrink-0">
              <Icon name="bell" className="w-5 h-5 text-amber-800" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-900 text-sm">Рекомендуется обновить профиль</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Актуальность данных снизилась до {Math.round(m.actuality * 100)}%. Подтвердите или обновите рабочий график.
              </p>
            </div>
            <button
              onClick={() => setRoute('my-profile')}
              className="px-4 py-2 bg-amber-700 text-white text-sm font-semibold rounded-lg hover:bg-amber-800 cursor-pointer flex-shrink-0"
            >
              Обновить
            </button>
          </div>
        )}

        {/* Мои события */}
        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <h2 className="font-bold text-stone-900 mb-4">События на неделе ({emp.events.length})</h2>
          {emp.events.length === 0 ? (
            <p className="text-sm text-stone-500">Нет зафиксированных событий</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {emp.events.slice(0, 8).map((ev: any) => {
                const inSch = emp.schedule.days.includes(ev.day)
                  && ev.startHour >= emp.schedule.startHour
                  && ev.endHour <= emp.schedule.endHour
                return (
                  <div key={ev.id} className={`flex items-center gap-3 rounded-lg px-3 py-2 border text-sm ${
                    !inSch && ev.type !== 'focus' ? 'bg-red-50 border-red-200' : 'bg-stone-50 border-stone-200'
                  }`}>
                    <span className="text-xs text-stone-400 w-6 flex-shrink-0">{WEEKDAY[ev.day]}</span>
                    <span className="flex-1 truncate text-stone-800">{ev.title}</span>
                    <span className="text-xs text-stone-400 flex-shrink-0">{ev.startHour}:00</span>
                    {!inSch && ev.type !== 'focus' && (
                      <Badge color="red">вне графика</Badge>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Мои рекомендации */}
        {m.recommendations.filter((r: any) => r.action !== 'Действий не требуется').length > 0 && (
          <div className="bg-white border border-stone-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="bulb" className="w-4 h-4 text-sky-600" />
              <h2 className="font-bold text-stone-900">Рекомендации для вас</h2>
            </div>
            <div className="space-y-2">
              {m.recommendations.filter((r: any) => r.action !== 'Действий не требуется').map((r: any) => (
                <div key={r.id} className="flex items-start gap-3 bg-sky-50 border border-sky-200 rounded-lg px-4 py-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-stone-900">{r.action}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{r.reason}</p>
                  </div>
                  <Badge color={r.priority === 'high' ? 'red' : r.priority === 'medium' ? 'amber' : 'stone'}>
                    {r.priority === 'high' ? 'важно' : 'средне'}
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

// ─── Командный дашборд для всех остальных ролей ──────────────────────────────

function TeamDashboard({ setRoute, currentRole }: { setRoute: (r: string) => void; currentRole?: ProjectRole | null }) {
  const teams = ['Все команды', ...new Set(COMPUTED.map((e) => e.team))]
  const [team, setTeam] = useState('Все команды')
  const list = team === 'Все команды' ? COMPUTED : COMPUTED.filter((e) => e.team === team)
  const s = dashboardStats(list)
  const groups = diagnosticGroups(list)
  const topRisk = [...list].sort((a, b) => b.metrics.integralRisk - a.metrics.integralRisk).slice(0, 6)

  const roleLabel: Record<string, string> = {
    'Руководитель': 'Обзор команды',
    'HR-специалист': 'Обзор · HR',
    'Проектный менеджер': 'Обзор · Планирование',
    'Аналитик': 'Обзор · Аналитика',
    'Администратор': 'Обзор проекта',
  }
=======
import {
  COMPUTED,
  dashboardStats,
  diagnosticGroups,
} from '../lib/derived'
import { TEAMS } from '../lib/mockData'
import { avatarColor, riskColor } from '../lib/utils'
import { Avatar, Badge } from '../components/Primitives'
import Icon from '../components/Icon'
import TopBar, { GhostButton } from '../components/TopBar'

export default function Dashboard({ setRoute }: { setRoute: (r: string) => void }) {
  const [team, setTeam] = useState('Все команды')
  const list =
    team === 'Все команды' ? COMPUTED : COMPUTED.filter((e) => e.team === team)
  const s = dashboardStats(list)
  const groups = diagnosticGroups(list)
  const topRisk = [...list]
    .sort((a, b) => b.metrics.integralRisk - a.metrics.integralRisk)
    .slice(0, 6)
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5

  return (
    <div className="fade-in">
      <TopBar
<<<<<<< HEAD
        title={roleLabel[currentRole ?? ''] ?? 'Обзор'}
        subtitle={`${s.total} сотрудников · обновлено только что`}
=======
        title="Обзор"
        subtitle={`${s.total} сотрудников • 5 часовых поясов • обновлено только что`}
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
      >
        <select
          value={team}
          onChange={(e) => setTeam(e.target.value)}
<<<<<<< HEAD
          className="px-4 py-2 text-sm border border-stone-300 rounded-lg bg-white font-medium"
        >
          {teams.map((t) => <option key={t}>{t}</option>)}
=======
          className="px-4 py-2 text-sm border border-stone-300 rounded-lg bg-white font-medium text-gray-900 hover:border-stone-400 focus:border-blue-500 transition-colors"
        >
          {TEAMS.map((t) => (
            <option key={t}>{t}</option>
          ))}
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
        </select>
        <GhostButton icon="refresh" label="Обновить" />
      </TopBar>

      <div className="p-8 bg-gray-50 min-h-[calc(100vh-100px)]">
<<<<<<< HEAD
        {/* KPI */}
        <div className="grid grid-cols-4 gap-5 mb-8">
          <Kpi label="Ср. актуальность" value={`${s.avgActuality}%`} sub="среднее по команде" tone={s.avgActuality < 60 ? 'danger' : 'neutral'} />
          <Kpi label="В зоне риска" value={s.critical} sub="высокий и критический" tone={s.critical > 0 ? 'danger' : 'neutral'} />
          <Kpi label="Конфликтов" value={s.conflicts} sub="пересечения в расписании" tone={s.conflicts > 0 ? 'warning' : 'neutral'} />
          <Kpi label="Перегруженных" value={s.overloaded} sub="загрузка > 80%" tone={s.overloaded > 0 ? 'warning' : 'neutral'} />
        </div>

=======
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <Kpi 
            label="Актуальность" 
            value={`${s.avgActuality}%`} 
            sub="среднее по команде" 
            tone={s.avgActuality < 60 ? 'danger' : 'neutral'} 
          />
          <Kpi 
            label="В зоне риска" 
            value={s.critical} 
            sub="высокий и критический" 
            tone="danger" 
          />
          <Kpi 
            label="Конфликтов" 
            value={s.conflicts} 
            sub="пересечения в расписании" 
            tone="warning" 
          />
          <Kpi 
            label="Перегруженных" 
            value={s.overloaded} 
            sub="загрузка больше 80%" 
            tone={s.overloaded ? 'warning' : 'neutral'} 
          />
        </div>

        {/* Sections */}
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
        <div className="space-y-8">
          {/* Диагностика */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Диагностика по группам</h2>
<<<<<<< HEAD
              <button onClick={() => setRoute('diagnostics')} className="text-sm text-blue-700 font-medium hover:text-blue-800 cursor-pointer">Подробнее →</button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {groups.filter((g) => g.employees.length > 0).slice(0, 6).map((g) => (
                <button key={g.id} onClick={() => setRoute('diagnostics')}
                  className="bg-white border border-stone-200 rounded-lg p-5 text-left hover:shadow-md transition cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{g.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{g.desc}</p>
                    </div>
                    <span className={`text-2xl font-bold font-mono ${
                      g.color === 'red' ? 'text-red-600' : g.color === 'amber' ? 'text-amber-600' : g.color === 'green' ? 'text-emerald-600' : 'text-gray-600'
                    }`}>{g.employees.length}</span>
                  </div>
                  <div className={`h-1 rounded-full ${g.color === 'red' ? 'bg-red-100' : g.color === 'amber' ? 'bg-amber-100' : g.color === 'green' ? 'bg-emerald-100' : 'bg-gray-100'}`} />
                </button>
              ))}
=======
              <button
                onClick={() => setRoute('diagnostics')}
                className="text-sm text-blue-700 font-medium hover:text-blue-800 transition"
              >
                Подробнее →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups
                .filter((g) => g.employees.length > 0)
                .slice(0, 6)
                .map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setRoute('diagnostics')}
                    className="bg-white border border-stone-200 rounded-lg p-5 text-left hover:shadow-md card-hover transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{g.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{g.desc}</p>
                      </div>
                      <span className={`text-2xl font-bold font-mono ${
                        g.color === 'red' ? 'text-red-600' :
                        g.color === 'amber' ? 'text-amber-600' :
                        g.color === 'green' ? 'text-emerald-600' :
                        'text-gray-600'
                      }`}>
                        {g.employees.length}
                      </span>
                    </div>
                    <div className={`h-1 rounded-full ${
                      g.color === 'red' ? 'bg-red-100' :
                      g.color === 'amber' ? 'bg-amber-100' :
                      g.color === 'green' ? 'bg-emerald-100' :
                      'bg-gray-100'
                    }`} />
                  </button>
                ))}
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
            </div>
          </section>

          {/* Топ риска */}
<<<<<<< HEAD
          {topRisk.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Требуют внимания</h2>
                <button onClick={() => setRoute('roadmap')} className="text-sm text-blue-700 font-medium hover:text-blue-800 cursor-pointer">План действий →</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {topRisk.map((e) => {
                  const rc = riskColor[e.metrics.riskLevel]
                  return (
                    <button key={e.id} onClick={() => setRoute('emp/' + e.id)}
                      className="bg-white border border-stone-200 rounded-lg p-5 text-left hover:shadow-md transition cursor-pointer">
                      <div className="flex items-start gap-4">
                        <Avatar initials={e.initials} color={avatarColor(e.metrics.riskLevel)} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">{e.name}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{e.role} · {e.tzShort}</p>
                          <div className="flex gap-2 mt-3 flex-wrap">
                            <Badge color={e.metrics.riskLevel === 'critical' || e.metrics.riskLevel === 'high' ? 'red' : e.metrics.riskLevel === 'medium' ? 'amber' : 'green'}>{rc.label}</Badge>
                            <Badge color="stone">актуальность {Math.round(e.metrics.actuality * 100)}%</Badge>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-2xl font-bold ${rc.text}`}>{Math.round(e.metrics.integralRisk * 100)}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-semibold">риск</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          {list.length === 0 && (
            <div className="text-center py-16 text-stone-400">
              <p className="font-semibold">Нет данных о сотрудниках</p>
              <p className="text-sm mt-1">Добавьте участников в проект</p>
            </div>
          )}
=======
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Требуют внимания</h2>
              <button
                onClick={() => setRoute('roadmap')}
                className="text-sm text-blue-700 font-medium hover:text-blue-800 transition"
              >
                План действий →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topRisk.map((e) => {
                const rc = riskColor[e.metrics.riskLevel]
                return (
                  <button
                    key={e.id}
                    onClick={() => setRoute('emp/' + e.id)}
                    className="bg-white border border-stone-200 rounded-lg p-5 text-left hover:shadow-md card-hover transition"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar
                        initials={e.initials}
                        color={avatarColor(e.metrics.riskLevel)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{e.name}</p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {e.role} • {e.tzShort}
                        </p>
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <Badge color={e.metrics.riskLevel === 'critical' || e.metrics.riskLevel === 'high' ? 'red' : e.metrics.riskLevel === 'medium' ? 'amber' : 'green'}>
                            {rc.label}
                          </Badge>
                          <Badge color="stone">
                            актуальность {Math.round(e.metrics.actuality * 100)}%
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-2xl font-bold ${rc.text}`}>
                          {Math.round(e.metrics.integralRisk * 100)}
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">риск</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
        </div>
      </div>
    </div>
  )
}

<<<<<<< HEAD
function Kpi({ label, value, sub, tone = 'neutral' }: { label: string; value: string | number; sub: string; tone?: 'danger' | 'warning' | 'neutral' }) {
  const valueColor = tone === 'danger' ? 'text-red-600' : tone === 'warning' ? 'text-amber-600' : 'text-gray-900'
  const bgColor = tone === 'danger' ? 'bg-red-50 border-red-100' : tone === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-white border-stone-200'
  return (
    <div className={`${bgColor} border rounded-lg p-6`}>
      <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">{label}</p>
=======
function Kpi({
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  label: string
  value: string | number
  sub: string
  tone?: 'danger' | 'warning' | 'neutral'
}) {
  const valueColor = 
    tone === 'danger' ? 'text-red-600' : 
    tone === 'warning' ? 'text-amber-600' : 
    'text-gray-900'
  
  const bgColor =
    tone === 'danger' ? 'bg-red-50 border-red-100' :
    tone === 'warning' ? 'bg-amber-50 border-amber-100' :
    'bg-white border-stone-200'

  return (
    <div className={`${bgColor} border rounded-lg p-6 card-subtle`}>
      <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">
        {label}
      </p>
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
      <p className={`text-4xl font-bold ${valueColor} mb-2`}>{value}</p>
      <p className="text-sm text-gray-600">{sub}</p>
    </div>
  )
<<<<<<< HEAD
}
=======
}
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
