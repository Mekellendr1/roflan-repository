import { useState } from 'react'
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

  return (
    <div className="fade-in">
      <TopBar
        title="Обзор"
        subtitle={`${s.total} сотрудников • 5 часовых поясов • обновлено только что`}
      >
        <select
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          className="px-4 py-2 text-sm border border-stone-300 rounded-lg bg-white font-medium text-gray-900 hover:border-stone-400 focus:border-blue-500 transition-colors"
        >
          {TEAMS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <GhostButton icon="refresh" label="Обновить" />
      </TopBar>

      <div className="p-8 bg-gray-50 min-h-[calc(100vh-100px)]">
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
        <div className="space-y-8">
          {/* Диагностика */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Диагностика по группам</h2>
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
            </div>
          </section>

          {/* Топ риска */}
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
        </div>
      </div>
    </div>
  )
}

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
      <p className={`text-4xl font-bold ${valueColor} mb-2`}>{value}</p>
      <p className="text-sm text-gray-600">{sub}</p>
    </div>
  )
}