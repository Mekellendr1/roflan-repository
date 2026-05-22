import { useState } from 'react'
import { actualizationRoadmap } from '../lib/derived'
import { avatarColor, riskColor } from '../lib/utils'
import { Avatar, Badge } from '../components/Primitives'
import TopBar from '../components/TopBar'

export default function Roadmap({ setRoute }: { setRoute: (r: string) => void }) {
  const road = actualizationRoadmap()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <div className="fade-in">
      <TopBar
        title="Дорожная карта актуализации"
        subtitle="Приоритет: кого просить обновить данные в первую очередь"
      />
      <div className="p-8">
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          {road.map((e, i) => {
            const m = e.metrics
            const rc = riskColor[m.riskLevel]
            const isHovered = hoveredId === e.id
            return (
              <div
                key={e.id}
                onMouseEnter={() => setHoveredId(e.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setRoute('emp/' + e.id)}
                className={`flex items-center gap-4 px-5 py-4 border-b border-stone-100 last:border-0 cursor-pointer transition-all ${
                  isHovered ? 'bg-blue-50' : 'hover:bg-stone-50'
                }`}
              >
                <span className={`text-lg font-bold font-mono w-7 transition-colors ${
                  isHovered ? 'text-blue-600' : 'text-stone-300'
                }`}>
                  {i + 1}
                </span>
                <Avatar
                  initials={e.initials}
                  color={avatarColor(m.riskLevel)}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold transition-colors ${
                    isHovered ? 'text-blue-900' : 'text-stone-900'
                  }`}>
                    {e.name}
                  </p>
                  <p className="text-xs text-stone-500 font-medium">
                    {e.role} · {e.team} · {m.daysSinceUpdate} дн. без обновления
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {m.actuality < 0.6 && <Badge color="amber">устарел</Badge>}
                  {m.workload > 0.8 && <Badge color="red">перегрузка</Badge>}
                  {m.hrMismatch === 1 && <Badge color="amber">HR ≠</Badge>}
                </div>
                {/* приоритетная полоса */}
                <div className="w-44">
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`text-stone-500 font-medium transition-colors ${
                      isHovered ? 'text-stone-600' : ''
                    }`}>
                      приоритет
                    </span>
                    <span className={`font-mono font-bold transition-colors ${rc.text}`}>
                      {m.actualizationPriority}
                    </span>
                  </div>
                  <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200 hover:border-stone-300 transition-colors">
                    <div
                      className={`h-full rounded-full transition-all ${
                        m.actualizationPriority >= 60
                          ? 'bg-red-500'
                          : m.actualizationPriority >= 35
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                      }`}
                      style={{ width: `${m.actualizationPriority}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}