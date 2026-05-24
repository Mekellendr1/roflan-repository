import { COMPUTED, dashboardStats } from '../lib/derived'
import { riskColor } from '../lib/utils'
import TopBar from '../components/TopBar'

export default function Analytics() {
  const s = dashboardStats()

  // распределение по уровням риска
  const levels = ['low', 'medium', 'high', 'critical'] as const
  const dist = levels.map((l) => ({
    level: l,
    count: COMPUTED.filter((e) => e.metrics.riskLevel === l).length,
  }))
  const maxDist = Math.max(...dist.map((d) => d.count), 1)

  // загрузка по сотрудникам
  const loads = [...COMPUTED].sort((a, b) => b.metrics.workload - a.metrics.workload)
  const maxLoad = Math.max(...loads.map((e) => e.metrics.workload), 1)

  // актуальность по командам
  const teams = [...new Set(COMPUTED.map((e) => e.team))]
  const teamStats = teams.map((t) => {
    const list = COMPUTED.filter((e) => e.team === t)
    return {
      team: t,
      actuality: Math.round(
        (list.reduce((a, e) => a + e.metrics.actuality, 0) / list.length) * 100
      ),
      count: list.length,
    }
  })

  return (
    <div className="fade-in">
      <TopBar
        title="Аналитика"
        subtitle="Сводная статистика по рабочему времени и актуальности"
      />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <Stat label="Средняя актуальность" value={`${s.avgActuality}%`} />
          <Stat label="Средняя загрузка" value={`${s.avgWorkload}%`} />
          <Stat label="Сотрудников с риском" value={s.critical} />
          <Stat label="Устаревших графиков" value={s.stale} />
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* распределение риска */}
          <div className="bg-white border border-stone-200 rounded-xl p-6">
            <h3 className="font-bold text-stone-900 mb-4">
              Распределение по уровню риска
            </h3>
            <div className="space-y-3">
              {dist.map((d) => {
                const rc = riskColor[d.level]
                return (
                  <div key={d.level}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-stone-600">{rc.label}</span>
                      <span className="font-mono font-semibold text-stone-900">
                        {d.count}
                      </span>
                    </div>
                    <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${rc.dot}`}
                        style={{ width: `${(d.count / maxDist) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* актуальность по командам */}
          <div className="bg-white border border-stone-200 rounded-xl p-6">
            <h3 className="font-bold text-stone-900 mb-4">
              Актуальность по командам
            </h3>
            <div className="space-y-3">
              {teamStats.map((t) => (
                <div key={t.team}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-stone-600">
                      {t.team}{' '}
                      <span className="text-stone-400">({t.count})</span>
                    </span>
                    <span className="font-mono font-semibold text-stone-900">
                      {t.actuality}%
                    </span>
                  </div>
                  <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        t.actuality < 60
                          ? 'bg-red-500'
                          : t.actuality < 80
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                      }`}
                      style={{ width: `${t.actuality}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* загрузка сотрудников */}
        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <h3 className="font-bold text-stone-900 mb-4">
            Загрузка сотрудников (Li)
          </h3>
          <div className="space-y-2.5">
            {loads.map((e) => (
              <div key={e.id} className="flex items-center gap-3">
                <span className="text-sm text-stone-600 w-40 truncate">
                  {e.name}
                </span>
                <div className="flex-1 h-4 bg-stone-100 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full ${
                      e.metrics.workload > 1
                        ? 'bg-red-500'
                        : e.metrics.workload > 0.8
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min((e.metrics.workload / maxLoad) * 100, 100)}%`,
                    }}
                  />
                  {/* порог 80% */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-stone-400"
                    style={{ left: `${(0.8 / maxLoad) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-mono font-semibold text-stone-900 w-12 text-right">
                  {Math.round(e.metrics.workload * 100)}%
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-stone-400 mt-3">
            Вертикальная линия — порог перегрузки 80%
          </p>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <p className="text-xs text-stone-500 uppercase tracking-wide mb-2">
        {label}
      </p>
      <p className="text-3xl font-bold text-stone-900">{value}</p>
    </div>
  )
}
