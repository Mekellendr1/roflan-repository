import Icon from './Icon'
import { useAuth } from '../lib/authContext'
import { ROLE_ACCESS } from '../lib/roles'
import type { ProjectRole } from '../lib/authTypes'
import { useState } from 'react'

interface SidebarProps {
  route: string
  setRoute: (r: string) => void
  onOpenAI: () => void
  onLogout: () => void
  currentProjectName?: string | null
  currentRole?: ProjectRole | null
  projects?: { id: string; name: string }[]
  onSelectProject?: (id: string) => void
}

const GROUPS: {
  label: string
  items: { id: string; label: string; icon: string }[]
}[] = [
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
  {
    label: 'Управление',
    items: [{ id: 'projects', label: 'Проекты', icon: 'project' }],
  },
]

export default function Sidebar({
  route,
  setRoute,
  onOpenAI,
  onLogout,
  currentProjectName,
  currentRole,
  projects,
  onSelectProject,
}: SidebarProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  function initials(name: string) {
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
  }

  const displayName = user?.full_name || user?.username || 'Пользователь'
  const allowedRoutes = new Set<string>(['projects'])
  if (currentRole) {
    for (const item of ROLE_ACCESS[currentRole] ?? []) {
      allowedRoutes.add(item)
    }
  }
  const compact = !currentProjectName

  return (
    <aside className="w-60 bg-white border-r border-stone-200 flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-stone-200 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg accent-bar flex items-center justify-center">
          <Icon name="clock" className="w-5 h-5 text-white" />
        </div>
        <div className="relative">
          <button
            onClick={() => setOpen((s) => !s)}
            className="flex items-center gap-2"
            aria-haspopup
            aria-expanded={open}
          >
            <p className="font-bold text-stone-900 leading-tight">{currentProjectName || 'WorkTime'}</p>
            <p className="text-xs text-stone-500 leading-tight">Sync · v1.0</p>
          </button>
          {open && (
            <div className="absolute left-0 mt-2 w-56 bg-white border border-stone-200 rounded-lg shadow-lg z-50">
              <div className="p-2">
                <button
                  onClick={() => { setRoute('projects'); setOpen(false) }}
                  className="w-full text-left px-3 py-2 rounded hover:bg-stone-50"
                >
                  Открыть все проекты
                </button>
                {projects && projects.length > 0 && (
                  <div className="mt-1 max-h-48 overflow-auto">
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { onSelectProject?.(p.id); setOpen(false) }}
                        className="w-full text-left px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
                <div className="border-t border-stone-100 mt-2 pt-2">
                  <button
                    onClick={() => { setRoute('projects'); setOpen(false) }}
                    className="w-full text-left px-3 py-2 font-semibold text-stone-900 hover:bg-stone-50 rounded"
                  >
                    Создать проект
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {!compact ? (
        <nav className="p-3 flex-1 overflow-y-auto">
          {GROUPS.map((g) => (
            <div key={g.label} className="mb-3">
              <p className="text-[10px] uppercase tracking-wider text-stone-400 px-3 py-1.5 font-semibold">
                {g.label}
              </p>
              {g.items.map((item) => {
                if (!allowedRoutes.has(item.id)) return null
                const active =
                  route === item.id ||
                  (item.id === 'employees' && route.startsWith('emp/')) ||
                  (item.id === 'projects' && route.startsWith('project/'))
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
                    <span className="flex-1 text-left font-medium">
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
      ) : (
        <nav className="p-3 flex-1">
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-wider text-stone-400 px-3 py-1.5 font-semibold">Управление</p>
            <button
              onClick={() => setRoute('projects')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 text-stone-600 hover:bg-stone-100`}>
              <Icon name="project" className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left font-medium">Проекты</span>
            </button>
          </div>
        </nav>
      )}

      <div className="p-3 border-t border-stone-200">
        <button
          onClick={onOpenAI}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm bg-lime-50 text-lime-800 border border-lime-200 hover:bg-lime-100 font-medium mb-3"
        >
          <Icon name="ai" className="w-4 h-4" />
          AI-ассистент
        </button>

        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
            {initials(displayName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-900 truncate">
              {displayName}
            </p>
            <p className="text-xs text-stone-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={onLogout}
            title="Выйти"
            className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
          >
            <Icon name="logout" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
