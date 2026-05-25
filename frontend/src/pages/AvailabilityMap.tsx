import { useState, useCallback } from 'react'
import { COMPUTED, useCacheVersion, hydrateFromList } from '../lib/derived'
import { teamAvailability } from '../lib/metrics'
import { computeAll } from '../lib/metrics'
import { WEEKDAYS } from '../lib/mockData'
import Icon from '../components/Icon'
import TopBar from '../components/TopBar'
import { apiDeleteEvent, apiUpdateEvent, http } from '../lib/api'

const HOURS = Array.from({ length: 24 }, (_, i) => i + 1)
const EVENT_TYPES = ['meeting', 'focus', 'task', 'recurring']
const TYPE_LABEL: Record<string, string> = {
  meeting: 'Встреча', focus: 'Фокус', task: 'Задача', recurring: 'Повтор',
}

export default function AvailabilityMap({
  setRoute,
}: {
  setRoute?: (r: string) => void
}) {
  useCacheVersion()
  const teams = ['Все команды', ...new Set(COMPUTED.map((e) => e.team))]
  const [team, setTeam] = useState('Все команды')
  const [day, setDay] = useState(2)
  const [selected, setSelected] = useState<{ emp: any; hour: number } | null>(null)
  const [editingEvent, setEditingEvent] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({ title: '', day: 0, start_hour: 0, end_hour: 0, event_type: '' })
  const [tick, setTick] = useState(0)
  const forceUpdate = useCallback(() => setTick((t) => t + 1), [])

  const reloadCache = useCallback(async () => {
    try {
      const token = localStorage.getItem('wt_token')
      const lastProject = localStorage.getItem('wt_last_project')
      if (!token || !lastProject) return
      const res = await http.get(`/projects/${lastProject}/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data: any[] = Array.isArray(res.data) ? res.data : []
      const filled = data
        .filter((e: any) => e.profile_filled !== false)
        .map(({ metrics: _m, profile_filled: _pf, ...rest }: any) => rest)
      hydrateFromList(computeAll(filled))
    } catch (err) {
      console.error('reload failed', err)
    }
  }, [])

  const remove = async (id: string) => {
    if (!confirm('Удалить событие?')) return
    try { await apiDeleteEvent(id); await reloadCache(); setTick((t) => t + 1) } catch (err) { console.error(err) }
  }

  const list =
    team === 'Все команды' ? COMPUTED : COMPUTED.filter((e) => e.team === team)
  const slots = teamAvailability(list, day)

  const best = slots.reduce((a, b) => (b.freeCount > a.freeCount ? b : a))
  const allFree = slots.filter((s) => s.freeCount === s.total && s.total > 0)

  function cellEvents(emp: any, hour: number) {
    return emp.events.filter((ev: any) => ev.day === day && hour >= ev.startHour && hour < ev.endHour)
  }

  function cellState(emp: any, hour: number): 'off' | 'free' | 'busy' {
    if (cellEvents(emp, hour).length > 0) return 'busy'
    const inSchedule =
      emp.schedule.days.includes(day) &&
      hour >= emp.schedule.startHour &&
      hour < emp.schedule.endHour
    return inSchedule ? 'free' : 'off'
  }

  const cellClass = (s: string, isAllFree: boolean) => {
    if (isAllFree && s === 'free') return 'bg-sky-400 ring-2 ring-sky-700 ring-inset'
    if (s === 'off') return 'bg-stone-200'
    if (s === 'free') return 'bg-emerald-100 hover:bg-emerald-200'
    return 'bg-red-400 hover:bg-red-500'
  }

  return (
    <div className="fade-in">
      <TopBar
        title="Командная карта доступности"
        subtitle={`${WEEKDAYS[day]}, показано в локальных поясах`}
      >
        <select value={team} onChange={(e) => setTeam(e.target.value)}
          className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white">
          {teams.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select value={day} onChange={(e) => setDay(Number(e.target.value))}
          className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white">
          {WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
        </select>
      </TopBar>

      <div className="p-8">
        <div className="bg-white border border-stone-200 rounded-xl p-6 mb-5">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: 720 }}>
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-stone-500 pb-3 pr-3 w-48">Сотрудник</th>
                  {HOURS.map((h) => (
                    <th key={h} className="text-center text-xs text-stone-500 pb-3 px-0.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e.id}>
                    <td className="py-1 pr-3">
                      <p className="text-sm font-medium text-stone-900 truncate">{e.name}</p>
                      <p className="text-[10px] text-stone-500">{e.tzShort} · {e.schedule.startHour}–{e.schedule.endHour}</p>
                    </td>
                    {HOURS.map((h) => {
                      const st = cellState(e, h)
                      const evs = cellEvents(e, h)
                      const isAll = allFree.some((s) => s.hour === h)
                      return (
                        <td key={h} className="p-0.5 relative">
                          <div
                            className={`h-7 rounded ${cellClass(st, isAll)} transition cursor-pointer flex items-center justify-center relative`}
                            title={st === 'busy' ? `${evs.length} событий` : `${st}`}
                            onClick={st === 'busy' ? () => setSelected({ emp: e, hour: h }) : undefined}
                          >
                            {st === 'busy' && evs.length > 0 && (
                              <span className="text-[9px] font-bold text-white drop-shadow-sm">{evs.length}</span>
                            )}
                          </div>
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

        {/* Карта доступности */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 mb-5">
          <h3 className="font-bold text-stone-900 mb-3 text-sm">Сколько человек доступно по часам ({WEEKDAYS[day]})</h3>
          <div className="flex gap-1 items-end h-24">
            {slots.map((s) => (
              <div key={s.hour} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t ${s.freeCount === s.total && s.total > 0 ? 'bg-sky-500' : s.freeCount >= s.total / 2 ? 'bg-emerald-400' : 'bg-amber-300'}`}
                  style={{ height: `${(s.freeCount / s.total) * 100}%` }}
                  title={`${s.hour}:00 — ${s.freeCount}/${s.total}`}
                />
                <span className="text-[10px] font-mono text-stone-400">{s.hour}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Рекомендация */}
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-200 flex items-center justify-center flex-shrink-0">
            <Icon name="bulb" className="w-5 h-5 text-sky-800" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sky-900 text-sm">Рекомендация</p>
            <p className="text-sm text-sky-800 mt-0.5">
              {WEEKDAYS[day]}, лучшее окно:{' '}
              <span className="font-bold">{best.hour}:00–{best.hour + 1}:00</span>
              {' '}— свободно {best.freeCount} из {best.total} участников.
              {allFree.length > 0
                ? ` Полное пересечение команды: ${allFree.map((s) => `${s.hour}:00`).join(', ')}.`
                : ' Полного пересечения нет — рассмотрите разбивку встречи.'}
            </p>
          </div>
        </div>

        {/* Поповер событий */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setSelected(null)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 pt-6 pb-3">
                <h3 className="font-bold text-stone-900 text-lg">
                  {selected.emp.name} · {WEEKDAYS[day]} {selected.hour}:00
                </h3>
                <button onClick={() => setSelected(null)} className="text-stone-400 hover:text-stone-600 cursor-pointer">
                  <Icon name="x" className="w-5 h-5" />
                </button>
              </div>
              <div className="px-6 pb-6">
                {(() => {
                  const evs = cellEvents(selected.emp, selected.hour)
                  if (evs.length === 0) return <p className="text-sm text-stone-500">Нет событий</p>
                  return (
                    <div className="space-y-2">
                      {evs.map((ev: any) => (
                        <div key={ev.id} className="flex items-center gap-2 rounded-lg px-3 py-2.5 border border-stone-200 bg-stone-50 text-sm group">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-stone-800 truncate">{ev.title}</p>
                            <p className="text-xs text-stone-400">
                              {Math.floor(ev.startHour)}:{String(Math.round((ev.startHour % 1) * 60)).padStart(2, '0')}–{Math.floor(ev.endHour)}:{String(Math.round((ev.endHour % 1) * 60)).padStart(2, '0')}
                              {' · '}
                              <span className="bg-stone-200 rounded px-1 py-0.5">{ev.type}</span>
                            </p>
                          </div>
                          <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button onClick={() => {
                              setEditingEvent(ev)
                              setEditForm({ title: ev.title, day: ev.day, start_hour: ev.startHour, end_hour: ev.endHour, event_type: ev.type || 'meeting' })
                            }}
                              className="p-1.5 text-stone-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 cursor-pointer"
                              title="Редактировать">
                              <Icon name="edit" className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => remove(ev.id)}
                              className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50 cursor-pointer"
                              title="Удалить">
                              <Icon name="trash" className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Редактирование события */}
        {editingEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setEditingEvent(null)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 pt-6 pb-3">
                <h3 className="font-bold text-stone-900 text-lg">Редактировать событие</h3>
                <button onClick={() => setEditingEvent(null)} className="text-stone-400 hover:text-stone-600 cursor-pointer">
                  <Icon name="x" className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4 px-6 pb-6">
                <div>
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1 block">Название</label>
                  <input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <select value={editForm.day} onChange={(e) => setEditForm((f) => ({ ...f, day: Number(e.target.value) }))}
                    className="border border-stone-200 rounded-lg px-3 py-2.5 text-sm bg-white flex-1">
                    {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                  <span className="text-stone-300">·</span>
                  <input type="number" min={1} max={24} value={editForm.start_hour}
                    onChange={(e) => setEditForm((f) => ({ ...f, start_hour: Number(e.target.value) }))}
                    className="w-20 border border-stone-200 rounded-lg px-3 py-2.5 text-sm" />
                  <span className="text-stone-400">–</span>
                  <input type="number" min={1} max={24} value={editForm.end_hour}
                    onChange={(e) => setEditForm((f) => ({ ...f, end_hour: Number(e.target.value) }))}
                    className="w-20 border border-stone-200 rounded-lg px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1 block">Тип</label>
                  <select value={editForm.event_type} onChange={(e) => setEditForm((f) => ({ ...f, event_type: e.target.value }))}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm bg-white">
                    {EVENT_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button onClick={async () => {
                    try {
                      await apiUpdateEvent(editingEvent.id, {
                        title: editForm.title,
                        day: editForm.day,
                        start_hour: editForm.start_hour,
                        end_hour: editForm.end_hour,
                        event_type: editForm.event_type,
                      })
                      setEditingEvent(null)
                      await reloadCache()
                      setTick((t) => t + 1)
                    } catch (err) { console.error(err) }
                  }}
                    className="flex-1 px-4 py-2.5 bg-stone-900 text-white rounded-lg text-sm font-semibold hover:bg-stone-800 cursor-pointer">
                    Сохранить
                  </button>
                  <button onClick={() => setEditingEvent(null)}
                    className="px-4 py-2.5 text-sm text-stone-600 hover:text-stone-900 cursor-pointer">
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
