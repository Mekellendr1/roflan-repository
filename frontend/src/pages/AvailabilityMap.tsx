import { employees } from '../lib/mockData'
import Avatar from '../components/Avatar'
import Icon from '../components/Icon'
import TopBar from '../components/TopBar'

type CellState = 'off' | 'free' | 'busy' | 'all'

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

// Demo grid (later: from /availability API)
const GRID: Record<string, Record<number, CellState>> = {
  e1: { 8: 'off', 9: 'free', 10: 'busy', 11: 'busy', 12: 'free', 13: 'busy', 14: 'busy', 15: 'free', 16: 'busy', 17: 'free', 18: 'off', 19: 'off', 20: 'off' },
  e2: { 8: 'off', 9: 'off', 10: 'off', 11: 'free', 12: 'free', 13: 'busy', 14: 'free', 15: 'free', 16: 'busy', 17: 'busy', 18: 'free', 19: 'free', 20: 'free' },
  e3: { 8: 'free', 9: 'free', 10: 'busy', 11: 'free', 12: 'free', 13: 'busy', 14: 'off', 15: 'off', 16: 'off', 17: 'off', 18: 'off', 19: 'off', 20: 'off' },
  e4: { 8: 'off', 9: 'free', 10: 'free', 11: 'all', 12: 'all', 13: 'busy', 14: 'free', 15: 'busy', 16: 'free', 17: 'free', 18: 'off', 19: 'off', 20: 'off' },
  e6: { 8: 'off', 9: 'free', 10: 'free', 11: 'free', 12: 'free', 13: 'busy', 14: 'busy', 15: 'free', 16: 'free', 17: 'free', 18: 'off', 19: 'off', 20: 'off' },
}

function cellColor(state: CellState): string {
  if (state === 'off') return 'bg-stone-200'
  if (state === 'free') return 'bg-emerald-100 hover:bg-emerald-200'
  if (state === 'busy') return 'bg-red-400 hover:bg-red-500'
  if (state === 'all') return 'bg-lime-400 ring-2 ring-lime-700 ring-inset'
  return 'bg-stone-100'
}

export default function AvailabilityMap() {
  const teamEmps = employees.filter((e) =>
    ['e1', 'e2', 'e3', 'e4', 'e6'].includes(e.id)
  )

  return (
    <div className="animate-fade-in">
      <TopBar title="Карта доступности" subtitle="Среда, 13 мая · показано в моём поясе (UTC+3)">
        <select className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white">
          <option>Backend team</option>
        </select>
        <select className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white">
          <option>Мой пояс (МСК)</option>
          <option>UTC</option>
        </select>
      </TopBar>

      <div className="p-8">
        <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: '700px' }}>
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-stone-500 pb-3 pr-3 w-44">
                    Сотрудник
                  </th>
                  {HOURS.map((h) => (
                    <th key={h} className="text-center text-xs font-mono text-stone-500 pb-3 px-0.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teamEmps.map((emp) => (
                  <tr key={emp.id}>
                    <td className="py-1 pr-3">
                      <div className="flex items-center gap-2">
                        <Avatar initials={emp.initials} color={emp.color} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-stone-900 truncate">
                            {emp.name.split(' ')[0]} {emp.name.split(' ')[1][0]}.
                          </p>
                          <p className="text-[10px] text-stone-500 font-mono">{emp.tzShort}</p>
                        </div>
                      </div>
                    </td>
                    {HOURS.map((h) => (
                      <td key={h} className="p-0.5">
                        <div
                          className={`h-7 rounded ${cellColor(GRID[emp.id][h])} cursor-pointer transition-colors`}
                          title={`${h}:00 — ${GRID[emp.id][h]}`}
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
            <Legend className="bg-lime-400 ring-2 ring-lime-700 ring-inset" label="все свободны" />
          </div>
        </div>

        <div className="bg-lime-50 border border-lime-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-lime-200 flex items-center justify-center flex-shrink-0">
            <Icon name="bulb" className="w-5 h-5 text-lime-800" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-lime-900 text-sm">Рекомендация системы</p>
            <p className="text-sm text-lime-800 mt-0.5">
              Лучший слот для встречи команды:{' '}
              <span className="font-mono font-bold">11:00–12:00 МСК</span> — все 5 свободны и в рабочих часах. Score: 94/100.
            </p>
          </div>
          <button className="px-3 py-1.5 bg-lime-700 text-white text-sm rounded-lg font-medium hover:bg-lime-800">
            Создать
          </button>
        </div>
      </div>
    </div>
  )
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block w-3 h-3 rounded ${className}`} />
      {label}
    </span>
  )
}
