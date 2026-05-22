import { diagnosticGroups } from '../lib/derived'
import { avatarColor } from '../lib/utils'
import { Avatar } from '../components/Primitives'
import TopBar from '../components/TopBar'

const GRADIENT: Record<string, string> = {
  red: 'from-red-50 to-red-100 border-red-200',
  amber: 'from-amber-50 to-amber-100 border-amber-200',
  green: 'from-emerald-50 to-emerald-100 border-emerald-200',
  blue: 'from-blue-50 to-blue-100 border-blue-200',
  stone: 'from-stone-50 to-stone-100 border-stone-200',
}
const BADGE: Record<string, string> = {
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  green: 'bg-emerald-500',
  blue: 'bg-blue-500',
  stone: 'bg-stone-400',
}

export default function Diagnostics({
  setRoute,
}: {
  setRoute: (r: string) => void
}) {
  const groups = diagnosticGroups()

  return (
    <div className="fade-in min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      <TopBar
        title="Диагностика актуальности"
        subtitle="Автоматическая группировка сотрудников по признакам неактуальности"
      />
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((g) => (
            <div
              key={g.id}
              className={`bg-gradient-to-br ${GRADIENT[g.color]} border rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${BADGE[g.color]} ring-2 ring-white`} />
                    <h3 className="font-semibold text-stone-800 text-base tracking-tight">{g.title}</h3>
                  </div>
                  <span className="text-2xl font-bold font-mono text-stone-800 bg-white/60 px-2 py-0.5 rounded-full">
                    {g.employees.length}
                  </span>
                </div>
                <p className="text-xs text-stone-600 mb-4">{g.desc}</p>
                <div className="space-y-2">
                  {g.employees.length === 0 ? (
                    <p className="text-xs text-stone-400 italic py-3 text-center">
                      Нет сотрудников в группе
                    </p>
                  ) : (
                    g.employees.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => setRoute('emp/' + e.id)}
                        className="w-full flex items-center gap-3 bg-white/60 hover:bg-white/90 rounded-xl px-3 py-2 transition-all duration-150 text-left shadow-sm hover:shadow"
                      >
                        <Avatar
                          initials={e.initials}
                          color={avatarColor(e.metrics.riskLevel)}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-800 truncate">
                            {e.name}
                          </p>
                          <p className="text-xs text-stone-500">
                            {e.role} · {e.tzShort}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}