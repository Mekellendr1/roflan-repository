import { useMemo, useState } from 'react'
import { allConflicts } from '../lib/derived'
import type { Conflict } from '../lib/types'
import { Badge } from '../components/Primitives'
import TopBar from '../components/TopBar'

const SEV: Record<Conflict['severity'], { label: string; color: 'red' | 'amber' | 'stone' }> = {
  critical: { label: 'КРИТ', color: 'red' },
  warning: { label: 'СРЕД', color: 'amber' },
  low: { label: 'НИЗ', color: 'stone' },
}

const TYPE_LABEL: Record<string, string> = {
  out_of_hours: 'Вне рабочих часов',
  double_booking: 'Двойное бронирование',
  hr_mismatch: 'HR ≠ календарь',
  overload: 'Перегрузка',
  back_to_back: 'Без перерывов',
  timezone: 'Часовой пояс',
  stale_schedule: 'Устаревший график',
  exception_overlap: 'Период отсутствия',
}

export default function Conflicts({ setRoute }: { setRoute: (r: string) => void }) {
  const all = useMemo(() => allConflicts(), [])
  const [sev, setSev] = useState<Conflict['severity'] | 'all'>('all')
  const [type, setType] = useState<string>('all')

  const filtered = all.filter(
    (c) => (sev === 'all' || c.severity === sev) && (type === 'all' || c.type === type)
  )
  const types = [...new Set(all.map((c) => c.type))]

  return (
    <div className="fade-in">
      <TopBar
        title="Поиск конфликтов"
        subtitle={`Найдено ${all.length} · критических ${all.filter((c) => c.severity === 'critical').length}`}
      />
      <div className="p-8">
        <div className="flex items-center gap-2 mb-5 text-sm flex-wrap">
          <span className="text-stone-500">Серьёзность:</span>
          {(['all', 'critical', 'warning', 'low'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSev(s)}
              className={`px-3 py-1 rounded-md font-medium ${
                sev === s
                  ? 'bg-stone-900 text-white'
                  : 'bg-white border border-stone-200 text-stone-700'
              }`}
            >
              {s === 'all' ? 'Все' : SEV[s].label}
            </button>
          ))}
          <span className="text-stone-300 mx-1">·</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-2 py-1 border border-stone-200 rounded-md bg-white text-stone-700"
          >
            <option value="all">Все типы</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t] || t}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          {filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => setRoute('emp/' + c.empId)}
              className="bg-white border border-stone-200 hover:border-stone-300 rounded-xl px-5 py-4 flex items-center gap-4 cursor-pointer transition"
            >
              <Badge color={SEV[c.severity].color}>{SEV[c.severity].label}</Badge>
              <Badge color="stone">{TYPE_LABEL[c.type] || c.type}</Badge>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-stone-900">{c.title}</p>
                <p className="text-sm text-stone-500 mt-0.5">{c.desc}</p>
              </div>
              <button className="px-3 py-1.5 text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg">
                Решить
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
