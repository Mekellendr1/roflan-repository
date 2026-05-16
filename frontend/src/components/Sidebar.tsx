import Icon from './Icon'

interface SidebarProps {
  route: string
  setRoute: (r: string) => void
  onOpenAI: () => void
}

const GROUPS: { label: string; items: { id: string; label: string; icon: string; badge?: number }[] }[] = [
  {
    label: 'Обзор',
    items: [
      { id: 'dashboard', label: 'Дашборд', icon: 'dashboard' },
      { id: 'analytics', label: 'Аналитика', icon: 'chart' },
    ],
  },
  {
    label: 'Сотрудники',
    items: [
      { id: 'employees', label: 'Профили', icon: 'users' },
      { id: 'diagnostics', label: 'Диагностика', icon: 'diagnostics' },
    ],
  },
  {
    label: 'Планирование',
    items: [
      { id: 'map', label: 'Карта доступности', icon: 'map' },
      { id: 'meeting', label: 'Подбор времени', icon: 'meeting' },
      { id: 'conflicts', label: 'Конфликты', icon: 'conflicts' },
    ],
  },
  {
    label: 'Действия',
    items: [
      { id: 'recommendations', label: 'Рекомендации', icon: 'bulb' },
      { id: 'roadmap', label: 'Дорожная карта', icon: 'road' },
      { id: 'notifications', label: 'Уведомления', icon: 'bell' },
    ],
  },
  {
    label: 'Данные',
    items: [{ id: 'sources', label: 'Источники', icon: 'sources' }],
  },
]

export default function Sidebar({ route, setRoute, onOpenAI }: SidebarProps) {
  return (
    <aside className="w-60 bg-white border-r border-stone-200 flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-stone-200 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg accent-bar flex items-center justify-center">
          <Icon name="clock" className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-stone-900 leading-tight">WorkTime</p>
          <p className="text-xs text-stone-500 leading-tight">Sync · v1.0</p>
        </div>
      </div>

      <nav className="p-3 flex-1 overflow-y-auto">
        {GROUPS.map((g) => (
          <div key={g.label} className="mb-3">
            <p className="text-[10px] uppercase tracking-wider text-stone-400 px-3 py-1.5 font-semibold">
              {g.label}
            </p>
            {g.items.map((item) => {
              const active =
                route === item.id ||
                (item.id === 'employees' && route.startsWith('emp/'))
              return (
                <button
                  key={item.id}
                  onClick={() => setRoute(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 ${
                    active
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Icon name={item.icon} className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-stone-200">
        <button
          onClick={onOpenAI}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm bg-lime-50 text-lime-800 border border-lime-200 hover:bg-lime-100 font-medium mb-3"
        >
          <Icon name="ai" className="w-4 h-4" />
          AI-ассистент
        </button>
        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center">
            МВ
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-900 truncate">Михаил Власов</p>
            <p className="text-xs text-stone-500 truncate">HR-руководитель</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
