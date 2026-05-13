import { useEffect, useState } from 'react'
import { getEmployees, suggestMeetingTime } from '../api/queries'
import type { Employee, MeetingSlot } from '../lib/types'
import Avatar from '../components/Avatar'
import Badge from '../components/Badge'
import Icon from '../components/Icon'
import TopBar from '../components/TopBar'

export default function MeetingFinder() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [duration, setDuration] = useState('60')
  const [slots, setSlots] = useState<MeetingSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  // Грузим список сотрудников один раз
  useEffect(() => {
    getEmployees().then((data) => {
      setEmployees(data)
      // По умолчанию — первые 4
      setSelected(data.slice(0, 4).map((e) => e.id))
    })
  }, [])

  const selectedEmps = employees.filter((e) => selected.includes(e.id))

  const toggle = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  const handleSearch = async () => {
    if (selected.length < 2) return
    setLoading(true)
    try {
      const result = await suggestMeetingTime({
        employee_ids: selected,
        duration_minutes: parseInt(duration),
        window_days: 7,
        priority: 'comfort',
      })
      setSlots(result)
      setSearched(true)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Подбор времени для встречи"
        subtitle="Найдите оптимальный слот с учётом всех ограничений"
      />

      <div className="p-8">
        <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
          <p className="text-sm font-semibold text-stone-700 mb-3">
            Участники ({selectedEmps.length})
          </p>
          <div className="flex flex-wrap gap-2 mb-5 min-h-[40px] p-2 border border-stone-200 rounded-lg bg-stone-50">
            {selectedEmps.map((emp) => (
              <button
                key={emp.id}
                onClick={() => toggle(emp.id)}
                className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-md border border-stone-200 text-sm font-medium hover:border-red-300 group"
              >
                <Avatar initials={emp.initials} color={emp.color} size="sm" />
                {emp.name}
                <Icon
                  name="x"
                  className="w-3.5 h-3.5 text-stone-400 group-hover:text-red-500"
                />
              </button>
            ))}
          </div>

          {/* Доступные для добавления */}
          {employees.filter((e) => !selected.includes(e.id)).length > 0 && (
            <div className="mb-5">
              <p className="text-xs text-stone-500 uppercase tracking-wide mb-1.5">Добавить:</p>
              <div className="flex flex-wrap gap-1.5">
                {employees
                  .filter((e) => !selected.includes(e.id))
                  .map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => toggle(emp.id)}
                      className="flex items-center gap-1 text-xs text-stone-600 px-2 py-1 hover:bg-stone-100 rounded-md border border-stone-200"
                    >
                      <Icon name="plus" className="w-3 h-3" />
                      {emp.name.split(' ')[0]} {emp.tzShort}
                    </button>
                  ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mb-5">
            <div>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                Длительность
              </p>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white text-sm"
              >
                <option value="30">30 минут</option>
                <option value="60">60 минут</option>
                <option value="90">90 минут</option>
              </select>
            </div>
            <div>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                Окно поиска
              </p>
              <select className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white text-sm">
                <option>Эта неделя</option>
              </select>
            </div>
            <div>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                Приоритет
              </p>
              <select className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white text-sm">
                <option>Комфорт всех</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading || selected.length < 2}
            className="px-5 py-2.5 bg-lime-500 text-stone-900 rounded-lg font-semibold hover:bg-lime-400 flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Icon name="search" className="w-4 h-4" />
            {loading ? 'Ищу...' : 'Найти оптимальное время'}
          </button>
        </div>

        {searched && (
          <>
            <p className="text-sm font-semibold text-stone-700 mb-3">
              {slots.length > 0
                ? `Топ-${slots.length} слотов, отсортированы по удобству`
                : 'Подходящих слотов не найдено'}
            </p>
            <div className="space-y-3">
              {slots.map((slot, i) => (
                <SlotCard key={i} slot={slot} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SlotCard({ slot }: { slot: MeetingSlot }) {
  const scoreColor =
    slot.score >= 80
      ? 'text-emerald-600'
      : slot.score >= 60
        ? 'text-amber-700'
        : 'text-red-600'
  return (
    <div
      className={`bg-white border rounded-xl p-5 ${
        slot.optimal ? 'border-lime-400 border-2 shadow-sm' : 'border-stone-200'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-stone-900">
              {slot.date} · <span className="font-mono">{slot.time}</span>
            </p>
            {slot.optimal && <Badge color="lime">★ оптимально</Badge>}
          </div>
          <p className="text-sm text-stone-500 font-mono">{slot.tzs}</p>
        </div>
        <div className="text-right">
          <p className={`text-3xl font-bold font-mono ${scoreColor}`}>{slot.score}</p>
          <p className="text-[10px] text-stone-400 uppercase tracking-wider">score</p>
        </div>
      </div>
      <p className="text-sm text-stone-600 mb-3">{slot.reason}</p>
      <div className="flex gap-2">
        <button
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${
            slot.optimal
              ? 'bg-stone-900 text-white hover:bg-stone-800'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          Создать встречу
        </button>
      </div>
    </div>
  )
}
