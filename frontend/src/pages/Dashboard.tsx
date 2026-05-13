import { useEffect, useState } from 'react'
import { getEmployees, getStats, recalculate, type DashboardStats } from '../api/queries'
import type { Employee } from '../lib/types'
import { colorClasses } from '../lib/utils'
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
  const [employees, setEmployees] = useState<Employee[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)

  // Загружаем данные при монтировании и при смене фильтра
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([getEmployees({ tz: tzFilter }), getStats()])
      .then(([emps, st]) => {
        if (cancelled) return
        const sorted = [...emps].sort((a, b) => b.riskScore - a.riskScore)
        setEmployees(sorted)
        setStats(st)
      })
      .catch((err) => console.error('Failed to load dashboard:', err))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tzFilter])

  const handleRecalculate = async () => {
    setRecalculating(true)
    try {
      await recalculate()
      // Перезагружаем данные после пересчёта
      const [emps, st] = await Promise.all([getEmployees({ tz: tzFilter }), getStats()])
      setEmployees([...emps].sort((a, b) => b.riskScore - a.riskScore))
      setStats(st)
    } catch (err) {
      console.error('Recalculate failed:', err)
    } finally {
      setRecalculating(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Дашборд команды"
        subtitle={`${employees.length} сотрудников · 5 часовых поясов`}
        onRecalculate={handleRecalculate}
        recalculating={recalculating}
      >
        <select className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white">
          <option>Все команды</option>
        </select>
      </TopBar>

      <div className="p-8">
        {/* Метрики сверху */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Активные конфликты"
            value={stats?.conflicts ?? '—'}
            icon="conflicts"
            trend="за последние 7 дней"
          />
          <StatCard
            label="В зоне риска"
            value={stats?.at_risk ?? '—'}
            icon="users"
            color="red"
            trend="risk ≥ 70"
          />
          <StatCard
            label="Средняя загрузка"
            value={stats ? `${stats.avg_load}%` : '—'}
            icon="clock"
            trend="норма 80%"
          />
          <StatCard
            label="Графиков устарело"
            value={stats?.stale ?? '—'}
            icon="calendar"
            color="amber"
            trend="старше 14 дн"
          />
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

        {loading && employees.length === 0 ? (
          <div className="text-center py-12 text-stone-500">Загрузка...</div>
        ) : employees.length === 0 ? (
          <div className="text-center py-12 text-stone-500">
            Сотрудников не найдено. Проверь что бэк запущен и БД заполнена через seed.py
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {employees.map((emp) => (
              <EmployeeCard
                key={emp.id}
                emp={emp}
                onClick={() => setRoute('emp/' + emp.id)}
              />
            ))}
          </div>
        )}
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
            {emp.role} · {emp.tzShort} (UTC
            {emp.tzOffset >= 0 ? '+' + emp.tzOffset : emp.tzOffset})
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
