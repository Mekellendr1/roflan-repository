import { useMemo, useState } from 'react'
import { COMPUTED } from '../lib/derived'
import { avatarColor, riskColor } from '../lib/utils'
import { Avatar, Badge } from '../components/Primitives'
import TopBar from '../components/TopBar'

export default function Employees({ setRoute, currentRole }: {
  setRoute: (r: string) => void
  currentRole?: import('../lib/authTypes').ProjectRole | null
}) {
  const [team, setTeam] = useState('Все команды')
  const [sort, setSort] = useState<'risk' | 'actuality' | 'name'>('risk')

  // COMPUTED читается при каждом рендере.
  // App.tsx гарантирует, что при смене проекта hydrateFromList уже вызван
  // и этот компонент перемонтирован (key=dataKey), так что данные всегда свежие.
  const list = useMemo(() => {
    const src = [...COMPUTED]
    let l = team === 'Все команды' ? src : src.filter((e) => e.team === team)
    if (sort === 'risk') l.sort((a, b) => b.metrics.integralRisk - a.metrics.integralRisk)
    if (sort === 'actuality') l.sort((a, b) => a.metrics.actuality - b.metrics.actuality)
    if (sort === 'name') l.sort((a, b) => a.name.localeCompare(b.name))
    return l
  }, [team, sort])

  const canViewProfile = currentRole !== undefined // все могут смотреть
  const subtitle = `${list.length} сотрудников${currentRole === 'Сотрудник' ? ' · только просмотр' : ''}`

  return (
    <div className="fade-in">
      <TopBar title="Профили сотрудников" subtitle={subtitle}>
        <select
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white"
        >
          {['Все команды', ...new Set(COMPUTED.map((e) => e.team))].map((t) => <option key={t}>{t}</option>)}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white"
        >
          <option value="risk">По риску</option>
          <option value="actuality">По актуальности</option>
          <option value="name">По имени</option>
        </select>
      </TopBar>

      <div className="p-8">
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-400">
              <p className="text-lg font-semibold mb-1">Нет сотрудников</p>
              <p className="text-sm">В этом проекте пока нет данных о сотрудниках</p>
            </div>
          ) : (
          <table className="w-full">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-stone-500 border-b border-stone-200 bg-stone-50">
                <th className="text-left px-5 py-3 font-semibold">Сотрудник</th>
                <th className="text-left px-4 py-3 font-semibold">Формат / Пояс</th>
                <th className="text-right px-4 py-3 font-semibold">Актуальность</th>
                <th className="text-right px-4 py-3 font-semibold">Загрузка</th>
                <th className="text-right px-4 py-3 font-semibold">Конфликты</th>
                <th className="text-right px-5 py-3 font-semibold">Риск Ri</th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => {
                const m = e.metrics
                const rc = riskColor[m.riskLevel]
                return (
                  <tr
                    key={e.id}
                    onClick={() => setRoute('emp/' + e.id)}
                    className="border-b border-stone-100 hover:bg-stone-50 cursor-pointer transition"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar initials={e.initials} color={avatarColor(m.riskLevel)} size="sm" />
                        <div>
                          <p className="font-semibold text-stone-900 text-sm">{e.name}</p>
                          <p className="text-xs text-stone-500">{e.role} · {e.team}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-stone-700">{e.format}</p>
                      <p className="text-xs text-stone-500 font-mono">
                        {e.tzShort} · UTC{e.tzOffset >= 0 ? '+' + e.tzOffset : e.tzOffset}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-mono text-sm font-semibold ${m.actuality < 0.6 ? 'text-red-600' : 'text-stone-700'}`}>
                        {Math.round(m.actuality * 100)}%
                      </span>
                      <p className="text-[10px] text-stone-400">{m.daysSinceUpdate} дн.</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-mono text-sm ${m.workload > 1 ? 'text-red-600' : m.workload > 0.8 ? 'text-amber-600' : 'text-stone-600'}`}>
                        {Math.round(m.workload * 100)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-mono text-sm ${m.conflictCount > 2 ? 'text-red-600' : m.conflictCount > 0 ? 'text-amber-600' : 'text-stone-400'}`}>
                        {m.conflictCount || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Badge color={m.riskLevel === 'critical' || m.riskLevel === 'high' ? 'red' : m.riskLevel === 'medium' ? 'amber' : 'green'}>
                          {rc.label}
                        </Badge>
                        <span className={`font-mono text-base font-bold ${rc.text}`}>
                          {Math.round(m.integralRisk * 100)}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          )}
        </div>
      </div>
    </div>
  )
}
