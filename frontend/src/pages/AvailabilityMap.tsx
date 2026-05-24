import { useState } from 'react'
import { COMPUTED } from '../lib/derived'
import { teamAvailability } from '../lib/metrics'
<<<<<<< HEAD
import { WEEKDAYS } from '../lib/mockData'
=======
import { TEAMS, WEEKDAYS } from '../lib/mockData'
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
import Icon from '../components/Icon'
import TopBar from '../components/TopBar'

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 8..20

export default function AvailabilityMap() {
<<<<<<< HEAD
  const teams = ['Все команды', ...new Set(COMPUTED.map((e) => e.team))]
  const [team, setTeam] = useState(() => {
    const t = new Set(COMPUTED.map((e) => e.team))
    return t.size > 0 ? [...t][0] : 'Все команды'
  })
=======
  const [team, setTeam] = useState('Backend')
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
  const [day, setDay] = useState(2) // среда

  const list =
    team === 'Все команды' ? COMPUTED : COMPUTED.filter((e) => e.team === team)
  const slots = teamAvailability(list, day)

  // лучшее окно: максимум свободных
  const best = slots.reduce((a, b) => (b.freeCount > a.freeCount ? b : a))
  const allFree = slots.filter((s) => s.freeCount === s.total && s.total > 0)

  function cellState(empId: string, hour: number): 'off' | 'free' | 'busy' {
    const e = list.find((x) => x.id === empId)!
    const inSchedule =
      e.schedule.days.includes(day) &&
      hour >= e.schedule.startHour &&
      hour < e.schedule.endHour
    if (!inSchedule) return 'off'
    const busy = e.events.some(
      (ev) => ev.day === day && hour >= ev.startHour && hour < ev.endHour
    )
    return busy ? 'busy' : 'free'
  }

  const cellClass = (s: string, isAllFree: boolean) => {
    if (isAllFree && s === 'free')
      return 'bg-sky-400 ring-2 ring-sky-700 ring-inset'
    if (s === 'off') return 'bg-stone-200'
    if (s === 'free') return 'bg-emerald-100 hover:bg-emerald-200'
    return 'bg-red-400 hover:bg-red-500'
  }

  return (
    <div className="fade-in">
      <TopBar
        title="Командная карта доступности"
        subtitle={`Tteam = W1 ∩ W2 ∩ … ∩ Wn · ${WEEKDAYS[day]}, показано в локальных поясах`}
      >
        <select
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white"
        >
<<<<<<< HEAD
          {teams.map((t) => (
=======
          {TEAMS.map((t) => (
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
            <option key={t}>{t}</option>
          ))}
        </select>
        <select
          value={day}
          onChange={(e) => setDay(Number(e.target.value))}
          className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white"
        >
          {WEEKDAYS.slice(0, 5).map((d, i) => (
            <option key={d} value={i}>
              {d}
            </option>
          ))}
        </select>
      </TopBar>

      <div className="p-8">
        <div className="bg-white border border-stone-200 rounded-xl p-6 mb-5">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: 720 }}>
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-stone-500 pb-3 pr-3 w-48">
                    Сотрудник
                  </th>
                  {HOURS.map((h) => (
                    <th
                        key={h}
                        className="text-center text-xs text-stone-500 pb-3 px-0.5"
                      >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e.id}>
                    <td className="py-1 pr-3">
                      <p className="text-sm font-medium text-stone-900 truncate">
                        {e.name}
                      </p>
                      <p className="text-[10px] text-stone-500">
                        {e.tzShort} · {e.schedule.startHour}–{e.schedule.endHour}
                      </p>
                    </td>
                    {HOURS.map((h) => {
                      const st = cellState(e.id, h)
                      const isAll = allFree.some((s) => s.hour === h)
                      return (
                        <td key={h} className="p-0.5">
                          <div
                            className={`h-7 rounded ${cellClass(st, isAll)} transition cursor-pointer`}
                            title={`${e.name} · ${h}:00 — ${st}`}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-stone-100 text-xs text-stone-600">
            <Lg c="bg-emerald-100" t="свободен" />
            <Lg c="bg-red-400" t="занят" />
            <Lg c="bg-stone-200" t="вне рабочих часов" />
            <Lg c="bg-sky-400 ring-2 ring-sky-700 ring-inset" t="вся команда свободна" />
          </div>
        </div>

        {/* Карта доступности по часам */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 mb-5">
          <h3 className="font-bold text-stone-900 mb-3 text-sm">
            Сколько человек доступно по часам ({WEEKDAYS[day]})
          </h3>
          <div className="flex gap-1 items-end h-24">
            {slots.map((s) => (
              <div key={s.hour} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t ${
                    s.freeCount === s.total && s.total > 0
                      ? 'bg-sky-500'
                      : s.freeCount >= s.total / 2
                        ? 'bg-emerald-400'
                        : 'bg-amber-300'
                  }`}
                  style={{ height: `${(s.freeCount / s.total) * 100}%` }}
                  title={`${s.hour}:00 — ${s.freeCount}/${s.total}`}
                />
                <span className="text-[10px] font-mono text-stone-400">{s.hour}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-200 flex items-center justify-center flex-shrink-0">
            <Icon name="bulb" className="w-5 h-5 text-sky-800" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sky-900 text-sm">Рекомендация</p>
            <p className="text-sm text-sky-800 mt-0.5">
              {WEEKDAYS[day]}, лучшее окно:{' '}
              <span className="font-bold">
                {best.hour}:00–{best.hour + 1}:00
              </span>{' '}
              — свободно {best.freeCount} из {best.total} участников.
              {allFree.length > 0
                ? ` Полное пересечение команды: ${allFree.map((s) => `${s.hour}:00`).join(', ')}.`
                : ' Полного пересечения нет — рассмотрите разбивку встречи.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Lg({ c, t }: { c: string; t: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block w-3 h-3 rounded ${c}`} />
      {t}
    </span>
  )
}
