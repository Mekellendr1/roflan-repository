import { useEffect, useState } from 'react'
import { getConflicts } from '../api/queries'
import type { Conflict, ConflictSeverity, ConflictType } from '../lib/types'
import { severityMap } from '../lib/utils'
import Badge from '../components/Badge'
import TopBar from '../components/TopBar'

export default function Conflicts() {
  const [severity, setSeverity] = useState<ConflictSeverity | 'all'>('all')
  const [type, setType] = useState<ConflictType | 'all'>('all')
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getConflicts({ severity, type })
      .then((data) => {
        if (!cancelled) setConflicts(data)
      })
      .catch((err) => console.error('Failed to load conflicts:', err))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [severity, type])

  const activeCount = conflicts.filter((c) => c.severity !== 'low').length

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Конфликты"
        subtitle={`Найдено: ${conflicts.length} · Активных: ${activeCount}`}
      />

      <div className="p-8">
        <div className="flex items-center gap-2 mb-5 text-sm flex-wrap">
          <span className="text-stone-500">Серьёзность:</span>
          {(['all', 'critical', 'warning', 'low'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSeverity(s)}
              className={`px-3 py-1 rounded-md font-medium ${
                severity === s
                  ? 'bg-stone-900 text-white'
                  : 'bg-white border border-stone-200 text-stone-700'
              }`}
            >
              {s === 'all' ? 'Все' : severityMap[s].label}
            </button>
          ))}
          <span className="text-stone-300 mx-1">·</span>
          <span className="text-stone-500">Тип:</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ConflictType | 'all')}
            className="px-2 py-1 border border-stone-200 rounded-md bg-white text-stone-700"
          >
            <option value="all">Все типы</option>
            <option value="overload">Перегрузка</option>
            <option value="out_of_hours">Вне рабочих часов</option>
            <option value="hr_mismatch">HR ≠ календарь</option>
            <option value="double_booking">Двойное бронирование</option>
            <option value="back_to_back">Back-to-back</option>
            <option value="stale_schedule">Устаревший график</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-stone-500">Загрузка...</div>
        ) : conflicts.length === 0 ? (
          <div className="text-center py-12 text-stone-500">
            Конфликтов не найдено. Если только что запустил сервер — нажми "Пересчитать" на дашборде.
          </div>
        ) : (
          <div className="space-y-2">
            {conflicts.map((c) => {
              const sev = severityMap[c.severity]
              return (
                <div
                  key={c.id}
                  className="bg-white border border-stone-200 hover:border-stone-300 rounded-xl px-5 py-4 flex items-center gap-4 transition-colors"
                >
                  <Badge color={sev.color}>{sev.label}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-900">{c.title}</p>
                    <p className="text-sm text-stone-500 mt-0.5">{c.desc}</p>
                  </div>
                  <button className="px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-lg border border-stone-200">
                    Детали
                  </button>
                  <button className="px-3 py-1.5 text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg">
                    Решить
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
