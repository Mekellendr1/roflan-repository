import { useMemo, useState } from 'react'
import { COMPUTED } from '../lib/derived'
import { WEEKDAYS } from '../lib/mockData'
import type { MeetingSlot } from '../lib/types'
import { Avatar, Badge } from '../components/Primitives'
import { avatarColor } from '../lib/utils'
import Icon from '../components/Icon'
import TopBar from '../components/TopBar'

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8) // 8..19

// Подбор лучших окон: перебираем дни и часы, считаем сколько участников
// свободны (в рабочем окне и без событий), ранжируем.
function findSlots(empIds: string[], duration: number): MeetingSlot[] {
  const emps = COMPUTED.filter((e) => empIds.includes(e.id))
  if (emps.length < 2) return []
  const out: MeetingSlot[] = []

  for (let day = 0; day < 5; day++) {
    for (const start of HOURS) {
      const end = start + duration
      if (end > 20) continue
      let available = 0
      const warnings: string[] = []
      for (const e of emps) {
        const inSchedule =
          e.schedule.days.includes(day) &&
          start >= e.schedule.startHour &&
          end <= e.schedule.endHour
        const busy = e.events.some(
          (ev) => ev.day === day && start < ev.endHour && ev.startHour < end
        )
        if (inSchedule && !busy) {
          available++
          // комфорт: близость к середине дня
          const mid = (e.schedule.startHour + e.schedule.endHour) / 2
          if (Math.abs(start - mid) > 4)
            warnings.push(`неудобно для ${e.name.split(' ')[0]} (${e.tzShort})`)
        }
      }
      if (available === 0) continue
      const ratio = available / emps.length
      const score = Math.round(ratio * 85 + (warnings.length === 0 ? 15 : 5))
      const tzs = emps
        .map((e) => `${start}:00 ${e.tzShort}`)
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(' · ')
      out.push({
        score,
        optimal: false,
        day: WEEKDAYS[day],
        time: `${start}:00–${end}:00`,
        tzs,
        availableCount: available,
        totalCount: emps.length,
        reason:
          warnings.length === 0
            ? 'Все участники свободны и в рабочих часах'
            : [...new Set(warnings)].slice(0, 2).join(' · '),
      })
    }
  }

  out.sort((a, b) => b.score - a.score)
  const seen = new Set<string>()
  const uniq = out.filter((s) => {
    if (seen.has(s.day)) return false
    seen.add(s.day)
    return true
  })
  if (uniq[0]) uniq[0].optimal = true
  return uniq.slice(0, 4)
}

export default function MeetingFinder() {
  const [selected, setSelected] = useState<string[]>(['e1', 'e4', 'e6', 'e7'])
  const [duration, setDuration] = useState(1)
  const [results, setResults] = useState<MeetingSlot[] | null>(null)

  const selEmps = COMPUTED.filter((e) => selected.includes(e.id))
  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const slots = useMemo(
    () => (results ? results : null),
    [results]
  )

  return (
    <div className="fade-in">
      <TopBar
        title="Подбор времени для встречи"
        subtitle="Учитывает рабочие окна, часовые пояса, занятость и перегрузку"
      />
      <div className="p-8">
        <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
          <p className="text-sm font-semibold text-stone-700 mb-2">
            Участники ({selEmps.length})
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {COMPUTED.map((e) => {
              const on = selected.includes(e.id)
              return (
                <button
                  key={e.id}
                  onClick={() => toggle(e.id)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-sm transition ${
                    on
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <span className="font-medium">{e.name.split(' ')[0]}</span>
                  <span className="text-xs opacity-70 font-mono">{e.tzShort}</span>
                </button>
              )
            })}
          </div>

          <div className="flex items-end gap-4">
            <div>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                Длительность
              </p>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="px-3 py-2 border border-stone-200 rounded-lg bg-white text-sm"
              >
                <option value={0.5}>30 минут</option>
                <option value={1}>60 минут</option>
                <option value={2}>120 минут</option>
              </select>
            </div>
            <button
              onClick={() => setResults(findSlots(selected, duration))}
              disabled={selected.length < 2}
              className="px-5 py-2.5 bg-lime-500 text-stone-900 rounded-lg font-semibold hover:bg-lime-400 flex items-center gap-2 disabled:opacity-50"
            >
              <Icon name="search" className="w-4 h-4" />
              Найти оптимальное время
            </button>
          </div>
        </div>

        {slots && (
          <>
            <p className="text-sm font-semibold text-stone-700 mb-3">
              {slots.length > 0
                ? `Лучшие окна (${slots.length})`
                : 'Подходящих окон не найдено — выберите других участников или день'}
            </p>
            <div className="space-y-3">
              {slots.map((s, i) => (
                <div
                  key={i}
                  className={`bg-white border rounded-xl p-5 ${
                    s.optimal ? 'border-lime-400 border-2' : 'border-stone-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-stone-900">
                          {s.day} · <span className="font-mono">{s.time}</span>
                        </p>
                        {s.optimal && <Badge color="lime">★ оптимально</Badge>}
                      </div>
                      <p className="text-sm text-stone-500 font-mono mt-0.5">{s.tzs}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-3xl font-bold font-mono ${
                          s.score >= 80
                            ? 'text-emerald-600'
                            : s.score >= 60
                              ? 'text-amber-600'
                              : 'text-red-600'
                        }`}
                      >
                        {s.score}
                      </p>
                      <p className="text-[10px] text-stone-400 uppercase">score</p>
                    </div>
                  </div>
                  <p className="text-sm text-stone-600 mb-2">
                    Доступно {s.availableCount} из {s.totalCount} · {s.reason}
                  </p>
                  <button className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-stone-900 text-white hover:bg-stone-800">
                    Создать встречу
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
