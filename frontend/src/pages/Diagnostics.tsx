import { diagnosticGroups } from '../lib/derived'
import { avatarColor } from '../lib/utils'
import { Avatar } from '../components/Primitives'
import TopBar from '../components/TopBar'

const DOT: Record<string, string> = {
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  green: 'bg-emerald-500',
  blue: 'bg-blue-500',
  stone: 'bg-stone-400',
}
const BORDER: Record<string, string> = {
  red: 'border-l-red-500',
  amber: 'border-l-amber-500',
  green: 'border-l-emerald-500',
  blue: 'border-l-blue-500',
  stone: 'border-l-stone-400',
}

export default function Diagnostics({
  setRoute,
}: {
  setRoute: (r: string) => void
}) {
  const groups = diagnosticGroups()

  return (
    <div className="fade-in">
      <TopBar
        title="Диагностика актуальности"
        subtitle="Автоматическая группировка сотрудников по признакам неактуальности"
      />
      <div className="p-8">
        <div className="grid grid-cols-3 gap-4">
          {groups.map((g) => (
            <div
              key={g.id}
              className={`bg-white border border-stone-200 rounded-xl p-5 border-l-4 ${BORDER[g.color]}`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${DOT[g.color]}`} />
                  <h3 className="font-bold text-stone-900 text-sm">{g.title}</h3>
                </div>
                <span className="text-xl font-bold font-mono text-stone-900">
                  {g.employees.length}
                </span>
              </div>
              <p className="text-xs text-stone-500 mb-3">{g.desc}</p>
              <div className="space-y-1.5">
                {g.employees.length === 0 ? (
                  <p className="text-xs text-stone-400 italic py-2">
                    Нет сотрудников в группе
                  </p>
                ) : (
                  g.employees.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setRoute('emp/' + e.id)}
                      className="w-full flex items-center gap-2.5 hover:bg-stone-50 rounded-lg px-2 py-1.5 transition text-left"
                    >
                      <Avatar
                        initials={e.initials}
                        color={avatarColor(e.metrics.riskLevel)}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-900 truncate">
                          {e.name}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          {e.role} · {e.tzShort}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
