import Icon from './Icon'

interface SidebarProps {
  route: string
  setRoute: (route: string) => void
}

interface MenuItem {
  id: string
  label: string
  icon: string
  badge?: number
}

const ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Дашборд', icon: 'dashboard' },
  { id: 'map', label: 'Карта доступности', icon: 'map' },
  { id: 'conflicts', label: 'Конфликты', icon: 'conflicts', badge: 23 },
  { id: 'meeting', label: 'Подбор времени', icon: 'meeting' },
  { id: 'sources', label: 'Источники', icon: 'sources' },
]

export default function Sidebar({ route, setRoute }: SidebarProps) {
  return (
    <aside className="w-60 bg-white border-r border-stone-200 flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-stone-200 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg accent-bar flex items-center justify-center">
          <Icon name="clock" className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-stone-900 leading-tight">WorkTime</p>
          <p className="text-xs text-stone-500 leading-tight">Sync</p>
        </div>
      </div>

      <nav className="p-3 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-stone-400 px-3 py-2 font-semibold">
          Меню
        </p>
        {ITEMS.map((item) => {
          const active =
            route === item.id ||
            (item.id === 'dashboard' && route.startsWith('emp/'))
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
              {item.badge && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${
                    active ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center">
            МВ
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-900 truncate">Михаил Власов</p>
            <p className="text-xs text-stone-500 truncate">HR Manager</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
