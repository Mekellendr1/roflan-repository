import { useEffect, useState } from 'react'
import { http } from '../lib/api'
import { Badge } from '../components/Primitives'
import Icon from '../components/Icon'
import TopBar from '../components/TopBar'

const TYPE_LABEL: Record<string, string> = {
  calendar: 'Календарь',
  hr: 'HR-система',
  tasks: 'Таск-трекер',
  timesheet: 'Табель',
  manual: 'Ручной ввод',
}

const STATUS: Record<string, { label: string; color: 'green' | 'amber' | 'red'; dot: string }> = {
  active: { label: 'активен', color: 'green', dot: 'bg-emerald-500' },
  stale: { label: 'устарел', color: 'amber', dot: 'bg-amber-500' },
  error: { label: 'нет связи', color: 'red', dot: 'bg-red-500' },
}

export default function Sources() {
  const [sources, setSources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    http.get('/sources')
      .then((res) => setSources(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSources([]))
      .finally(() => setLoading(false))
  }, [])

  const total = sources.reduce((s, d) => s + (d.records || 0), 0)
  const activeCount = sources.filter((d) => d.status === 'active').length
  const problemCount = sources.filter((d) => d.status !== 'active').length

  return (
    <div className="fade-in">
      <TopBar
        title="Загрузка данных"
        subtitle="Источники, из которых система собирает данные о рабочем времени"
      />

      <div className="p-8">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-stone-400 text-sm">Загрузка...</div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <StatCard label="Источников" value={sources.length} />
              <StatCard label="Активных" value={activeCount} color="text-emerald-600" />
              <StatCard label="Требуют внимания" value={problemCount} color="text-amber-600" />
              <StatCard label="Всего записей" value={total.toLocaleString('ru')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {sources.map((s) => {
                const st = STATUS[s.status] ?? STATUS['stale']
                return (
                  <div key={s.id} className="bg-white border border-stone-200 rounded-xl p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${
                          s.status === 'active' ? 'bg-emerald-100 text-emerald-700'
                            : s.status === 'stale' ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          <Icon name={s.icon} className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-stone-900">{s.name}</p>
                          <p className="text-xs text-stone-500">{TYPE_LABEL[s.type] ?? s.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                        <Badge color={st.color}>{st.label}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-stone-500 uppercase tracking-wide mb-1">Записей</p>
                        <p className="font-mono font-bold text-stone-900">{(s.records ?? 0).toLocaleString('ru')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-500 uppercase tracking-wide mb-1">Синхронизация</p>
                        <p className="font-medium text-stone-700">{s.lastSync ?? s.last_sync ?? '—'}</p>
                      </div>
                    </div>

                    {s.status !== 'active' && (
                      <button className="mt-4 w-full py-2 text-sm font-medium border border-stone-200 rounded-lg hover:bg-stone-50 flex items-center justify-center gap-2 cursor-pointer transition-colors">
                        <Icon name="refresh" className="w-4 h-4" />
                        Переподключить
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mt-6 bg-stone-50 border border-stone-200 rounded-xl p-5">
              <p className="text-sm font-semibold text-stone-700 mb-2">Имитация данных (MVP)</p>
              <p className="text-sm text-stone-500">
                Для демонстрации система работает на синтетических данных: события календаря,
                исключения из HR, задачи из таск-трекера генерируются автоматически при
                заполнении профиля. В продакшене подключаются реальные коннекторы
                Google Calendar / БОСС-Кадровик / Jira.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color = 'text-stone-900' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <p className="text-xs text-stone-500 uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
