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
  currentProjectId?: string | null
  currentRole?: ProjectRole | null
  projects?: { id: string; name: string }[]
  onSelectProject?: (id: string) => void
  onRenameProject?: (id: string, name: string) => void
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
    label: 'Люди',
    items: [
      { id: 'employees', label: 'Команда', icon: 'users' },
      { id: 'diagnostics', label: 'Диагностика', icon: 'diagnostics' },
    ],
  },
  {
    label: 'График',
    items: [
      { id: 'map', label: 'Карта', icon: 'map' },
      { id: 'meeting', label: 'Время встреч', icon: 'meeting' },
      { id: 'conflicts', label: 'Конфликты', icon: 'conflicts' },
    ],
  },
  {
    label: 'Действия',
    items: [
      { id: 'recommendations', label: 'Советы', icon: 'bulb' },
      { id: 'roadmap', label: 'Карта', icon: 'road' },
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
  currentProjectId,
  currentRole,
  projects,
  onSelectProject,
  onRenameProject,
}: SidebarProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [renameMode, setRenameMode] = useState(false)
  const [newProjectName, setNewProjectName] = useState(currentProjectName || '')

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
    const roleKey = currentRole as keyof typeof ROLE_ACCESS
    const accessList = ROLE_ACCESS[roleKey] ?? []
    for (const item of accessList) {
      allowedRoutes.add(item)
    }
  }
  const compact = !currentProjectName

  const handleRename = () => {
    if (newProjectName.trim() && currentProjectId) {
      onRenameProject?.(currentProjectId, newProjectName.trim())
      setRenameMode(false)
    } else {
      setNewProjectName(currentProjectName || '')
      setRenameMode(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename()
    } else if (e.key === 'Escape') {
      setNewProjectName(currentProjectName || '')
      setRenameMode(false)
    }
  }

  return (
    <aside className="w-64 bg-white border-r border-stone-200 flex flex-col h-screen sticky top-0">
      {/* Project Header */}
      <div className="p-4 border-b border-stone-150 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg accent-bar flex items-center justify-center flex-shrink-0">
            <Icon name="clock" className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 flex items-center justify-between">
            {renameMode ? (
              <div className="flex-1 flex items-center gap-2 mr-2">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="flex-1 px-2 py-1 text-sm border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  onClick={handleRename}
                  className="p-1 text-green-600 hover:bg-green-50 rounded cursor-pointer transition-colors"
                  title="Сохранить"
                >
                  <Icon name="check" className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setOpen((s) => !s)}
                className="flex-1 flex items-center justify-between text-left hover:opacity-75 transition-opacity cursor-pointer group"
                aria-haspopup
                aria-expanded={open}
                title="Выбрать проект"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
                    {currentProjectName || 'WorkTime'}
                  </p>
                  <p className="text-xs text-gray-500 leading-tight">v1.0</p>
                </div>
                <div
                  className={`text-gray-400 group-hover:text-gray-600 transition-transform flex-shrink-0 ml-2 ${
                    open ? 'rotate-180' : ''
                  }`}
                >
                  <Icon name="chevron" className="w-4 h-4" />
                </div>
              </button>
            )}
            {!renameMode && (
              <button
                onClick={() => {
                  setRenameMode(true)
                  setNewProjectName(currentProjectName || '')
                }}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
                title="Переименовать"
              >
                <Icon name="edit" className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Project Dropdown */}
        {open && (
          <div className="absolute left-4 right-4 top-full mt-2 bg-white border border-stone-200 rounded-lg shadow-xl z-50 max-w-xs">
            <div className="p-2">
              <button
                onClick={() => {
                  setRoute('projects')
                  setOpen(false)
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-900 font-medium hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Все проекты
              </button>

              {projects && projects.length > 0 && (
                <>
                  <div className="border-t border-gray-100 my-1"></div>
                  <div className="max-h-48 overflow-y-auto">
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectProject?.(p.id)
                          setOpen(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                          p.id === currentProjectId
                            ? 'bg-blue-50 text-blue-900 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      {!compact ? (
        <nav className="p-3 flex-1 overflow-y-auto">
          {GROUPS.map((g) => (
            <div key={g.label} className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-1.5">
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
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all mb-0.5 font-medium cursor-pointer ${
                      active
                        ? 'bg-blue-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    title={item.label}
                  >
                    <Icon name={item.icon} className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
      ) : (
        <nav className="p-3 flex-1">
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-1.5">
              Управление
            </p>
            <button
              onClick={() => setRoute('projects')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 text-gray-700 hover:bg-gray-100 font-medium cursor-pointer"
              title="Проекты"
            >
              <Icon name="project" className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">Проекты</span>
            </button>
          </div>
        </nav>
      )}

      {/* Bottom Section */}
      <div className="p-3 border-t border-stone-150 space-y-3">
        <button
          onClick={onOpenAI}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-900 border border-blue-200 hover:border-blue-300 hover:shadow-md font-medium transition-all cursor-pointer"
          title="Помощник"
        >
          <Icon name="ai" className="w-4 h-4" />
          Помощник
        </button>

        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-gray-50 border border-gray-200">
          <div className="w-9 h-9 rounded-md bg-blue-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
            {initials(displayName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={onLogout}
            title="Выйти"
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            <Icon name="logout" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}