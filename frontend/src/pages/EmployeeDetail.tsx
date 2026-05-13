import { useEffect, useState } from 'react'
import { getEmployeeDetail, type EmployeeDetail } from '../api/queries'
import { colorClasses, severityMap } from '../lib/utils'
import Avatar from '../components/Avatar'
import Badge from '../components/Badge'
import Icon from '../components/Icon'
import RiskScore from '../components/RiskScore'
import TopBar from '../components/TopBar'

interface EmployeeDetailPageProps {
  empId: string
  setRoute: (route: string) => void
}

export default function EmployeeDetailPage({ empId, setRoute }: EmployeeDetailPageProps) {
  const [emp, setEmp] = useState<EmployeeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getEmployeeDetail(empId)
      .then((data) => {
        if (!cancelled) setEmp(data)
      })
      .catch((err) => {
        console.error(err)
        if (!cancelled) setError('Не удалось загрузить данные сотрудника')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [empId])

  if (loading) {
    return (
      <div className="p-8">
        <TopBar title="Загрузка..." />
        <div className="text-center py-12 text-stone-500">Загрузка...</div>
      </div>
    )
  }

  if (error || !emp) {
    return (
      <div className="p-8">
        <TopBar title="Ошибка">
          <button
            onClick={() => setRoute('dashboard')}
            className="px-3 py-2 text-sm border border-stone-200 rounded-lg hover:bg-stone-50"
          >
            ← Назад
          </button>
        </TopBar>
        <p className="text-stone-500">{error || 'Сотрудник не найден'}</p>
      </div>
    )
  }

  const riskHistory = emp.risk_history || []
  const w = 700
  const h = 120
  const lastScore = riskHistory[riskHistory.length - 1] || emp.riskScore
  const points = riskHistory
    .map((v, i) => `${(i / Math.max(riskHistory.length - 1, 1)) * w},${h - (v / 100) * h}`)
    .join(' ')

  return (
    <div className="animate-fade-in">
      <TopBar title={emp.name} subtitle={`${emp.role} · ${emp.team}`}>
        <button
          onClick={() => setRoute('dashboard')}
          className="px-3 py-2 text-sm border border-stone-200 rounded-lg hover:bg-stone-50 flex items-center gap-2 font-medium text-stone-700"
        >
          <Icon name="back" className="w-4 h-4" />
          К дашборду
        </button>
      </TopBar>

      <div className="p-8">
        <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-5 mb-5">
            <Avatar initials={emp.initials} color={emp.color} size="lg" />
            <div className="flex-1">
              <p className="text-xl font-bold text-stone-900">{emp.name}</p>
              <div className="flex items-center gap-4 mt-1 text-sm text-stone-500">
                <span className="flex items-center gap-1">
                  <Icon name="pin" className="w-3.5 h-3.5" />
                  {emp.tz.split('/')[1]} (UTC
                  {emp.tzOffset >= 0 ? '+' + emp.tzOffset : emp.tzOffset})
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="clock" className="w-3.5 h-3.5" /> {emp.schedule}
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="building" className="w-3.5 h-3.5" /> {emp.format}
                </span>
              </div>
            </div>
            <div className="text-center pl-6 border-l border-stone-200">
              <RiskScore score={emp.riskScore} size="lg" />
              <p className="text-xs text-stone-500 uppercase tracking-wider mt-1">риск-скор</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <MiniStat label="Загрузка" value={`${emp.workload}%`} highlight={emp.workload > 100} />
            <MiniStat label="Переработки" value={`${emp.overtime}ч`} highlight={emp.overtime > 5} />
            <MiniStat label="Конфликты" value={emp.conflicts} highlight={emp.conflicts > 2} />
            <MiniStat
              label="График обновлён"
              value={`${emp.scheduleUpdated} дн назад`}
              highlight={emp.scheduleUpdated > 14}
            />
          </div>
        </div>

        {riskHistory.length > 0 && (
          <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-stone-900">
                Риск-скор за {riskHistory.length} дней
              </h2>
              <p className="text-xs text-stone-500">обновлено только что</p>
            </div>
            <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full" style={{ height: '140px' }}>
              <line x1="0" y1={h * 0.3} x2={w} y2={h * 0.3} stroke="#f5f5f4" strokeWidth="1" />
              <line x1="0" y1={h * 0.7} x2={w} y2={h * 0.7} stroke="#f5f5f4" strokeWidth="1" />
              <text x="0" y={h * 0.3 - 2} fontSize="10" fill="#a8a29e">
                70 — высокий
              </text>
              <text x="0" y={h * 0.7 - 2} fontSize="10" fill="#a8a29e">
                30 — средний
              </text>
              <polyline
                points={points}
                fill="none"
                stroke="#dc2626"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <circle cx={w} cy={h - (lastScore / 100) * h} r="5" fill="#dc2626" />
            </svg>
          </div>
        )}

        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <h2 className="text-base font-bold text-stone-900 mb-4">
            Активные конфликты ({emp.active_conflicts.length})
          </h2>
          <div className="space-y-2">
            {emp.active_conflicts.length === 0 ? (
              <p className="text-stone-500 text-sm">Нет активных конфликтов 🎉</p>
            ) : (
              emp.active_conflicts.map((c) => {
                const sev = severityMap[c.severity]
                const borderColor =
                  sev.color === 'stone'
                    ? 'border-stone-300'
                    : colorClasses[sev.color as 'red' | 'amber' | 'green']?.border ||
                      'border-stone-300'
                return (
                  <div
                    key={c.id}
                    className={`border-l-4 ${borderColor} bg-stone-50 rounded-lg px-4 py-3`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge color={sev.color}>{sev.label}</Badge>
                      <p className="text-sm font-medium text-stone-900 flex-1">
                        {c.title.replace(emp.name + ' — ', '')}
                      </p>
                    </div>
                    <p className="text-xs text-stone-500 mt-1 ml-12">{c.desc}</p>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniStat({
  label,
  value,
  highlight,
}: {
  label: string
  value: string | number
  highlight: boolean
}) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? 'bg-red-50' : 'bg-stone-50'}`}>
      <p className="text-xs text-stone-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-lg font-bold font-mono ${highlight ? 'text-red-700' : 'text-stone-900'}`}>
        {value}
      </p>
    </div>
  )
}
