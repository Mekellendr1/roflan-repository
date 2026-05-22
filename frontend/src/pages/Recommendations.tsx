import { useState } from 'react'
import { allRecommendations } from '../lib/derived'
import { Badge } from '../components/Primitives'
import Icon from '../components/Icon'
import TopBar from '../components/TopBar'

const CAT_LABEL: Record<string, string> = {
  schedule: 'График',
  meeting: 'Встречи',
  workload: 'Нагрузка',
  timezone: 'Часовой пояс',
  hr: 'HR-данные',
}
const CAT_ICON: Record<string, string> = {
  schedule: 'calendar',
  meeting: 'meeting',
  workload: 'warning',
  timezone: 'pin',
  hr: 'users',
}

export default function Recommendations({
  setRoute,
}: {
  setRoute: (r: string) => void
}) {
  const all = allRecommendations()
  const [cat, setCat] = useState<string>('all')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const cats = [...new Set(all.map((r) => r.category))]
  const filtered = cat === 'all' ? all : all.filter((r) => r.category === cat)

  return (
    <div className="fade-in">
      <TopBar
        title="Рекомендации"
        subtitle={`${all.length} объяснимых рекомендаций по актуализации`}
      />
      <div className="p-8">
        <div className="flex items-center gap-2 mb-6 text-sm flex-wrap bg-white p-4 rounded-lg border border-stone-200">
          <button
            onClick={() => setCat('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              cat === 'all'
                ? 'bg-stone-900 text-white shadow-md'
                : 'bg-stone-50 border border-stone-200 text-stone-700 hover:border-stone-300 hover:bg-stone-100'
            }`}
            title="Все рекомендации"
          >
            Все
          </button>
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                cat === c
                  ? 'bg-stone-900 text-white shadow-md'
                  : 'bg-stone-50 border border-stone-200 text-stone-700 hover:border-stone-300 hover:bg-stone-100'
              }`}
              title={`Фильтр: ${CAT_LABEL[c]}`}
            >
              {CAT_LABEL[c] || c}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((r) => {
            const isHovered = hoveredId === r.id
            return (
              <div
                key={r.id}
                onMouseEnter={() => setHoveredId(r.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`bg-white border border-stone-200 rounded-xl px-5 py-4 flex items-center gap-4 transition-all ${
                  isHovered ? 'shadow-md border-stone-300' : ''
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  isHovered ? 'bg-blue-100' : 'bg-sky-50'
                }`}>
                  <Icon name={CAT_ICON[r.category]} className={`w-4 h-4 transition-colors ${
                    isHovered ? 'text-blue-700' : 'text-sky-700'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-semibold transition-colors ${
                      isHovered ? 'text-stone-900' : 'text-stone-900'
                    }`}>
                      {r.action}
                    </p>
                    <Badge
                      color={
                        r.priority === 'high'
                          ? 'red'
                          : r.priority === 'medium'
                            ? 'amber'
                            : 'stone'
                      }
                    >
                      {r.priority === 'high' ? 'высокий' : r.priority === 'medium' ? 'средний' : 'низкий'}
                    </Badge>
                  </div>
                  <p className="text-sm text-stone-500 mt-0.5">
                    <button
                      onClick={() => setRoute('emp/' + r.empId)}
                      className="text-blue-700 font-medium hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                      title="Перейти к сотруднику"
                    >
                      {r.empName}
                    </button>
                    {' '} · {r.reason}
                  </p>
                </div>
                <button
                  className="px-3 py-1.5 text-sm font-medium border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors cursor-pointer hover:border-stone-300 whitespace-nowrap"
                  title="Выполнить рекомендацию"
                >
                  Выполнить
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}