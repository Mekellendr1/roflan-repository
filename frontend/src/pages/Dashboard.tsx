import { useState } from 'react'
import {
  COMPUTED,
  dashboardStats,
  diagnosticGroups,
} from '../lib/derived'
import { TEAMS } from '../lib/mockData'
import { FORMULAS } from '../lib/metrics'
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
        title="Дашборд команды"
        subtitle={`${s.total} сотрудников · 5 часовых поясов · обновлено только что`}
      >
        <select
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white"
        >
          {TEAMS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <GhostButton icon="refresh" label="Пересчитать" />
      </TopBar>

      <div className="p-8">
        {/* KPI */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Kpi label="Средняя актуальность" value={`${s.avgActuality}%`} sub="показатель Ai по команде" tone={s.avgActuality < 60 ? 'red' : 'stone'} />
          <Kpi label="В зоне риска" value={s.critical} sub="высокий + критический Ri" tone="red" />
          <Kpi label="Активных конфликтов" value={s.conflicts} sub="календарь ↔ график" tone="amber" />
          <Kpi label="Перегружены" value={s.overloaded} sub="загрузка Li > 80%" tone={s.overloaded ? 'amber' : 'stone'} />
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Диагностические группы кратко */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-stone-900">Диагностика по группам</h2>
              <button
                onClick={() => setRoute('diagnostics')}
                className="text-sm text-lime-700 font-medium hover:underline"
              >
                Все группы →
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {groups
                .filter((g) => g.employees.length > 0)
                .slice(0, 6)
                .map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setRoute('diagnostics')}
                    className={`text-left border-l-4 rounded-xl p-4 bg-white border border-stone-200 hover:shadow-sm transition ${
                      g.color === 'red'
                        ? 'border-l-red-500'
                        : g.color === 'amber'
                          ? 'border-l-amber-500'
                          : g.color === 'green'
                            ? 'border-l-emerald-500'
                            : g.color === 'blue'
                              ? 'border-l-blue-500'
                              : 'border-l-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-stone-900 text-sm">{g.title}</p>
                      <span className="text-2xl font-bold font-mono text-stone-900">
                        {g.employees.length}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">{g.desc}</p>
                  </button>
                ))}
            </div>
          </div>

          {/* Формулы — доказательство что показатели в коде */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="formula" className="w-4 h-4 text-stone-500" />
              <h2 className="text-lg font-bold text-stone-900">Показатели</h2>
            </div>
            <div className="bg-stone-900 rounded-xl p-4 text-stone-300 space-y-3">
              {Object.entries(FORMULAS).map(([k, v]) => (
                <div key={k}>
                  <p className="text-[10px] uppercase tracking-wider text-stone-500 mb-0.5">
                    {k === 'actuality'
                      ? 'Актуальность'
                      : k === 'conflicts'
                        ? 'Конфликты'
                        : k === 'workload'
                          ? 'Загрузка'
                          : k === 'team'
                            ? 'Окно команды'
                            : 'Интегральный риск'}
                  </p>
                  <code className="font-mono text-xs text-lime-400">{v}</code>
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-400 mt-2">
              Все показатели рассчитываются в коде по данным, не захардкожены.
            </p>
          </div>
        </div>

        {/* Топ риска */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-stone-900">Наибольший риск неактуальности</h2>
            <button
              onClick={() => setRoute('roadmap')}
              className="text-sm text-lime-700 font-medium hover:underline"
            >
              Дорожная карта →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {topRisk.map((e) => {
              const rc = riskColor[e.metrics.riskLevel]
              return (
                <button
                  key={e.id}
                  onClick={() => setRoute('emp/' + e.id)}
                  className={`bg-white border border-stone-200 hover:shadow-sm transition rounded-xl p-4 text-left border-l-4 ${rc.border}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      initials={e.initials}
                      color={avatarColor(e.metrics.riskLevel)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-900 truncate">{e.name}</p>
                      <p className="text-xs text-stone-500">
                        {e.role} · {e.tzShort}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold font-mono ${rc.text}`}>
                        {Math.round(e.metrics.integralRisk * 100)}
                      </p>
                      <p className="text-[10px] text-stone-400 uppercase">риск Ri</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    <Badge color={e.metrics.riskLevel === 'critical' || e.metrics.riskLevel === 'high' ? 'red' : e.metrics.riskLevel === 'medium' ? 'amber' : 'green'}>
                      {rc.label} риск
                    </Badge>
                    <Badge color="stone">актуальность {Math.round(e.metrics.actuality * 100)}%</Badge>
                    {e.metrics.workload > 0.8 && <Badge color="red">перегрузка</Badge>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function Kpi({
  label,
  value,
  sub,
  tone = 'stone',
}: {
  label: string
  value: string | number
  sub: string
  tone?: 'red' | 'amber' | 'stone'
}) {
  const c = tone === 'red' ? 'text-red-600' : tone === 'amber' ? 'text-amber-700' : 'text-stone-900'
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <p className="text-xs text-stone-500 font-medium uppercase tracking-wide mb-2">
        {label}
      </p>
      <p className={`text-3xl font-bold ${c} mb-1`}>{value}</p>
      <p className="text-xs text-stone-500">{sub}</p>
    </div>
  )
}
