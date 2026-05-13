import { useEffect, useState } from 'react'
import { getAvailability, type AvailabilityResponse } from '../api/queries'
import Icon from '../components/Icon'
import TopBar from '../components/TopBar'

// Сотрудники, которых показываем на карте по умолчанию
const DEFAULT_TEAM = ['e1', 'e2', 'e3', 'e4', 'e6']

export default function AvailabilityMap() {
  const [data, setData] = useState<AvailabilityResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getAvailability(DEFAULT_TEAM)
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((err) => console.error('Failed to load availability:', err))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Карта доступности"
        subtitle={data ? `${data.date} · показано в моём поясе (UTC+3)` : 'Загрузка...'}
      >
        <select className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white">
          <option>Backend team</option>
        </select>
        <select className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white">
          <option>Мой пояс (МСК)</option>
        </select>
      </TopBar>

      <div className="p-8">
        {loading || !data ? (
          <div className="text-center py-12 text-stone-500">Загрузка карты...</div>
        ) : (
          <>
            <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
              <div className="overflow-x-auto">
                <table className="w-full" style={{ minWidth: '700px' }}>
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-medium text-stone-500 pb-3 pr-3 w-44">
                        Сотрудник
                      </th>
                      {data.hours.map((h) => (
                        <th
                          key={h}
                          className="text-center text-xs font-mono text-stone-500 pb-3 px-0.5"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row) => (
                      <tr key={row.employee_id}>
                        <td className="py-1 pr-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-stone-900 truncate">
                              {row.employee_name}
                            </p>
                            <p className="text-[10px] text-stone-500 font-mono">{row.tz_short}</p>
                          </div>
                        </td>
                        {row.cells.map((cell) => (
                          <td key={cell.hour} className="p-0.5">
                            <div
                              className={`h-7 rounded ${cellColor(cell.state)} cursor-pointer transition-colors`}
                              title={`${cell.hour}:00 — ${cell.state}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap gap-4 mt-5 text-xs text-stone-600 border-t border-stone-100 pt-4">
                <Legend className="bg-emerald-100" label="свободен" />
                <Legend className="bg-red-400" label="занят" />
                <Legend className="bg-stone-200" label="вне рабочих часов" />
                <Legend
                  className="bg-lime-400 ring-2 ring-lime-700 ring-inset"
                  label="все свободны"
                />
              </div>
            </div>

            {data.recommendation && (
              <div className="bg-lime-50 border border-lime-200 rounded-xl p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-lime-200 flex items-center justify-center flex-shrink-0">
                  <Icon name="bulb" className="w-5 h-5 text-lime-800" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-lime-900 text-sm">Рекомендация системы</p>
                  <p className="text-sm text-lime-800 mt-0.5">
                    Лучший слот для встречи команды:{' '}
                    <span className="font-mono font-bold">{data.recommendation.time} МСК</span> —{' '}
                    {data.recommendation.reason}. Score: {data.recommendation.score}/100.
                  </p>
                </div>
                <button className="px-3 py-1.5 bg-lime-700 text-white text-sm rounded-lg font-medium hover:bg-lime-800">
                  Создать
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function cellColor(state: string): string {
  if (state === 'off') return 'bg-stone-200'
  if (state === 'free') return 'bg-emerald-100 hover:bg-emerald-200'
  if (state === 'busy') return 'bg-red-400 hover:bg-red-500'
  if (state === 'all') return 'bg-lime-400 ring-2 ring-lime-700 ring-inset'
  return 'bg-stone-100'
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block w-3 h-3 rounded ${className}`} />
      {label}
    </span>
  )
}
