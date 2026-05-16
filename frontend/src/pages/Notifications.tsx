import { useState } from 'react'
import { smartNotifications } from '../lib/derived'
import { Badge } from '../components/Primitives'
import Icon from '../components/Icon'
import TopBar from '../components/TopBar'

const CAT_LABEL: Record<string, string> = {
  risk: 'Риск',
  hr: 'HR',
  meeting: 'Встречи',
  schedule: 'График',
}

export default function Notifications({
  setRoute,
}: {
  setRoute: (r: string) => void
}) {
  const all = smartNotifications()
  const [filter, setFilter] = useState<'all' | 'urgent'>('all')
  const list = filter === 'urgent' ? all.filter((n) => n.urgent) : all

  return (
    <div className="fade-in">
      <TopBar
        title="Уведомления"
        subtitle={`ИИ выбирает адресата, момент и причину · срочных ${all.filter((n) => n.urgent).length}`}
      >
        <div className="flex gap-1 text-sm">
          {(['all', 'urgent'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md font-medium ${
                filter === f
                  ? 'bg-stone-900 text-white'
                  : 'bg-white border border-stone-200 text-stone-700'
              }`}
            >
              {f === 'all' ? 'Все' : 'Только срочные'}
            </button>
          ))}
        </div>
      </TopBar>

      <div className="p-8">
        <div className="space-y-2">
          {list.map((n) => (
            <div
              key={n.id}
              className={`bg-white border rounded-xl px-5 py-4 flex items-center gap-4 ${
                n.urgent ? 'border-red-200' : 'border-stone-200'
              }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  n.urgent ? 'bg-red-500' : 'bg-stone-300'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-stone-900">
                    <span className="font-semibold">{n.who}</span> — {n.text}
                  </p>
                  <Badge color="stone">{CAT_LABEL[n.category] || n.category}</Badge>
                  {n.urgent && <Badge color="red">срочно</Badge>}
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Причина: {n.reason}
                </p>
              </div>
              {n.empId && (
                <button
                  onClick={() => setRoute('emp/' + n.empId)}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg"
                >
                  {n.action}
                </button>
              )}
            </div>
          ))}
          {list.length === 0 && (
            <div className="text-center py-12 text-stone-500">
              Нет уведомлений в этой категории
            </div>
          )}
        </div>

        <div className="mt-6 bg-lime-50 border border-lime-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-lime-200 flex items-center justify-center flex-shrink-0">
            <Icon name="ai" className="w-5 h-5 text-lime-800" />
          </div>
          <div>
            <p className="font-semibold text-lime-900 text-sm">
              Как работают умные уведомления
            </p>
            <p className="text-sm text-lime-800 mt-0.5">
              Система не рассылает всем одинаковые напоминания. Для каждого
              сотрудника ИИ оценивает риск, выбирает причину (устаревший график,
              перегрузка, HR-расхождение) и формирует адресное действие только
              при необходимости.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
