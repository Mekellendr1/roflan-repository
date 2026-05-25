import { useState } from 'react'
import { allRecommendations, hydrateFromList } from '../lib/derived'
import { computeAll } from '../lib/metrics'
import { http } from '../lib/api'
import { Badge } from '../components/Primitives'
import Icon from '../components/Icon'
import TopBar from '../components/TopBar'
import type { Recommendation } from '../lib/types'

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

async function reloadCache() {
  const token = localStorage.getItem('wt_token')
  const lastProject = localStorage.getItem('wt_last_project')
  if (!token || !lastProject) return
  try {
    const res = await http.get(`/projects/${lastProject}/employees`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data: any[] = Array.isArray(res.data) ? res.data : []
    const filled = data
      .filter((e) => e.profile_filled !== false)
      .map(({ metrics: _m, profile_filled: _pf, ...rest }: any) => rest)
    hydrateFromList(computeAll(filled))
  } catch (err) {
    console.error('cache reload failed', err)
  }
}

function authHeader() {
  const token = localStorage.getItem('wt_token') || ''
  return { headers: { Authorization: `Bearer ${token}` } }
}

export default function Recommendations({
  setRoute,
}: {
  setRoute: (r: string) => void
}) {
  const all = allRecommendations()
  const [cat, setCat] = useState<string>('all')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [executing, setExecuting] = useState<string | null>(null)
  const [done, setDone] = useState<Set<string>>(new Set())
  const cats = [...new Set(all.map((r) => r.category))]
  const filtered = cat === 'all' ? all : all.filter((r) => r.category === cat)

  async function handleExecute(r: Recommendation) {
    if (r.category === 'schedule') {
      setExecuting(r.id)
      try {
        await http.post(`/employees/${r.empId}/confirm-actuality`, {}, authHeader())
        await reloadCache()
        setDone((prev) => new Set(prev).add(r.id))
      } catch (err) {
        console.error('Failed to execute recommendation', err)
      } finally {
        setExecuting(null)
      }
    } else {
      setRoute('emp/' + r.empId)
    }
  }

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
            const isDone = done.has(r.id)
            const isLoading = executing === r.id
            return (
              <div
                key={r.id}
                onMouseEnter={() => setHoveredId(r.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`bg-white border border-stone-200 rounded-xl px-5 py-4 flex items-center gap-4 transition-all ${
                  isHovered ? 'shadow-md border-stone-300' : ''
                } ${isDone ? 'opacity-60' : ''}`}
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
                  onClick={() => handleExecute(r)}
                  disabled={isLoading || isDone}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    isDone
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isLoading
                        ? 'bg-stone-100 text-stone-400 border border-stone-200'
                        : 'border border-stone-200 hover:bg-stone-50 hover:border-stone-300 bg-white text-stone-700'
                  }`}
                  title="Выполнить рекомендацию"
                >
                  {isDone ? '✓ Выполнено' : isLoading ? '...' : 'Выполнить'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
