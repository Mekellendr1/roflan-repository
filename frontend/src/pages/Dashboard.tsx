import { useMemo, useState } from 'react'
import { conflicts, employees } from '../lib/mockData'
import { colorClasses } from '../lib/utils'
import type { Employee } from '../lib/types'
import Avatar from '../components/Avatar'
import Badge from '../components/Badge'
import Icon from '../components/Icon'
import RiskScore from '../components/RiskScore'
import TopBar from '../components/TopBar'

interface DashboardProps {
  setRoute: (route: string) => void
}

export default function Dashboard({ setRoute }: DashboardProps) {
  const [tzFilter, setTzFilter] = useState<string>('all')

  const sorted = useMemo(() => {
    let list = [...employees]
    if (tzFilter !== 'all') list = list.filter((e) => e.tzShort === tzFilter)
    list.sort((a, b) => b.riskScore - a.riskScore)
    return list
  }, [tzFilter])

  const stats = {
    conflicts: conflicts.length,
    atRisk: employees.filter((e) => e.riskScore >= 70).length,
    avgLoad: Math.round(employees.reduce((s, e) => s + e.workload, 0) / employees.length),
    stale: employees.filter((e) => e.scheduleUpdated > 14).length,
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Дашборд команды"
        subtitle="Backend · 42 сотрудника · 5 часовых поясов"
      >
        <select className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white">
          <option>Все команды</option>
          <option>Backend</option>
          <option>Frontend</option>
          <option>QA</option>
        </select>
      </TopBar>

      <div className="p-8">
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard label="Активные конфликты" value={stats.conflicts} icon="conflicts" trend="+3 за неделю" />
          <StatCard label="В зоне риска" value={stats.atRisk} icon="users" color="red" trend="критический" />
          <StatCard label="Средняя загрузка" value={`${stats.avgLoad}%`} icon="clock" trend="норма 80%" />
          <StatCard label="Графиков устарело" value={stats.stale} icon="calendar" color="amber" trend="старше 14 дн" />
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-stone-900">Сотрудники</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-stone-500">Фильтр:</span>
            {['all', 'МСК', 'LIS', 'НСК'].map((tz) => (
              <button
                key={tz}
                onClick={() => setTzFilter(tz)}
                className={`px-3 py-1 rounded-md font-medium ${
                  tzFilter === tz
                    ? 'bg-stone-900 text-white'
                    : 'bg-white border border-stone-200 text-stone-700'
                }`}
              >
                {tz === 'all' ? 'Все' : tz}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {sorted.map((emp) => (
            <EmployeeCard
              key={emp.id}
              emp={emp}
              onClick={() => setRoute('emp/' + emp.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  icon: string
  color?: 'red' | 'amber' | 'stone'
  trend?: string
}

function StatCard({ label, value, icon, color = 'stone', trend }: StatCardProps) {
  const colorClass =
    color === 'red' ? 'text-red-600' : color === 'amber' ? 'text-amber-700' : 'text-stone-900'
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5 hover:border-stone-300 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-stone-500 font-medium uppercase tracking-wide">{label}</p>
        <Icon name={icon} className="w-4 h-4 text-stone-400" />
      </div>
      <p className={`text-3xl font-bold ${colorClass} mb-1`}>{value}</p>
      <p className="text-xs text-stone-500">{trend}</p>
    </div>
  )
}

function EmployeeCard({ emp, onClick }: { emp: Employee; onClick: () => void }) {
  const c = colorClasses[emp.color]
  return (
    <button
      onClick={onClick}
      className={`bg-white border border-stone-200 hover:border-stone-300 hover:shadow-sm transition-all rounded-xl p-4 text-left border-l-4 ${c.border}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <Avatar initials={emp.initials} color={emp.color} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-stone-900 truncate">{emp.name}</p>
          <p className="text-xs text-stone-500 truncate">
            {emp.role} · {emp.tzShort} (UTC{emp.tzOffset >= 0 ? '+' + emp.tzOffset : emp.tzOffset})
          </p>
        </div>
        <div className="text-right">
          <RiskScore score={emp.riskScore} size="sm" />
          <p className="text-[10px] text-stone-400 uppercase tracking-wider">риск</p>
        </div>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {emp.tags.map((tag, i) => (
          <Badge key={i} color={i === 0 ? emp.color : 'stone'}>
            {tag}
          </Badge>
        ))}
      </div>
    </button>
  )
}
