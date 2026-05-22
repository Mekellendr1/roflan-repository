import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import Icon from './components/Icon'
import AIAssistant from './components/AIAssistant'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Employees from './pages/Employees'
import EmployeeDetail from './pages/EmployeeDetail'
import Diagnostics from './pages/Diagnostics'
import AvailabilityMap from './pages/AvailabilityMap'
import MeetingFinder from './pages/MeetingFinder'
import Conflicts from './pages/Conflicts'
import Recommendations from './pages/Recommendations'
import Roadmap from './pages/Roadmap'
import Notifications from './pages/Notifications'
import Sources from './pages/Sources'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetail from './pages/ProjectDetail'
import AuthPage from './pages/AuthPage'
import { hydrateFromList } from './lib/derived'
import { StoreProvider, useStore } from './lib/store'
import { AuthProvider, useAuth } from './lib/authContext'
import type { ProjectRole } from './lib/authTypes'

function AppShell() {
  const [route, setRoute] = useState('projects')
  const [history, setHistory] = useState<string[]>(['projects'])
  const [aiOpen, setAiOpen] = useState(false)
  const [activeProjectName, setActiveProjectName] = useState<string | null>(null)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activeProjectRole, setActiveProjectRole] = useState<ProjectRole | null>(null)
  const [renameMode, setRenameMode] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [projects, setProjects] = useState<any[]>([])
  const { employees } = useStore()
  const { user, loading: authLoading, logout } = useAuth()

  useEffect(() => {
    hydrateFromList(employees)
  }, [employees])

  // Load projects for the current user and restore last opened
  useEffect(() => {
    if (!user) return
    const token = localStorage.getItem('wt_token')
    if (!token) return
    let mounted = true
    import('./lib/authApi').then(({ apiGetProjects }) => {
      apiGetProjects(token)
        .then((list) => {
          if (!mounted) return
          setProjects(list)
          const last = localStorage.getItem('wt_last_project')
          if (last && list.find((p: any) => p.id === last)) {
            updateRoute(`project/${last}`)
          }
        })
        .catch(() => {
          // ignore
        })
    })
    return () => {
      mounted = false
    }
  }, [user])

  // Syncs route with browser history
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.slice(1) || 'projects'
      setRoute(path)
      setHistory((h) => h.slice(0, -1))
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Navigate back
  const goBack = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1)
      setHistory(newHistory)
      setRoute(newHistory[newHistory.length - 1])
      window.history.back()
    }
  }

  // Updates browser URL when route changes
  const updateRoute = (newRoute: string) => {
    setRoute(newRoute)
    setHistory((h) => [...h, newRoute])
    window.history.pushState(null, '', `/${newRoute}`)
  }

  const handleRenameProject = async (projectId: string, newName: string) => {
    if (newName.trim() && projectId === activeProjectId) {
      // Here you would call your API to update the project name
      // apiUpdateProjectName(projectId, newName)
      setActiveProjectName(newName)
      setProjects((p) =>
        p.map((proj) =>
          proj.id === projectId ? { ...proj, name: newName } : proj
        )
      )
      setRenameMode(false)
      setNewProjectName('')
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
        Загрузка...
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  function render() {
    if (route.startsWith('emp/')) {
      return <EmployeeDetail empId={route.slice(4)} onBack={goBack} setRoute={updateRoute} />
    }
    if (route.startsWith('project/')) {
      const projectId = route.slice('project/'.length)
      return (
        <ProjectDetail
          projectId={projectId}
          onBack={goBack}
          setRoute={updateRoute}
          onProjectLoaded={(name, role) => {
            setActiveProjectName(name)
            setActiveProjectId(projectId)
            setActiveProjectRole(role)
          }}
        />
      )
    }
    switch (route) {
      case 'dashboard':
        return <Dashboard setRoute={updateRoute} />
      case 'analytics':
        return <Analytics />
      case 'employees':
        return <Employees setRoute={updateRoute} />
      case 'diagnostics':
        return <Diagnostics setRoute={updateRoute} />
      case 'map':
        return <AvailabilityMap />
      case 'meeting':
        return <MeetingFinder />
      case 'conflicts':
        return <Conflicts setRoute={updateRoute} />
      case 'recommendations':
        return <Recommendations setRoute={updateRoute} />
      case 'roadmap':
        return <Roadmap setRoute={updateRoute} />
      case 'notifications':
        return <Notifications setRoute={updateRoute} />
      case 'sources':
        return <Sources />
      case 'projects':
        return <ProjectsPage setRoute={updateRoute} />
      default:
        return <Dashboard setRoute={updateRoute} />
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {activeProjectName ? (
        <Sidebar
          route={route}
          setRoute={updateRoute}
          onOpenAI={() => setAiOpen(true)}
          onLogout={logout}
          currentProjectName={activeProjectName}
          currentProjectId={activeProjectId}
          currentRole={activeProjectRole}
          projects={projects}
          onSelectProject={(id: string) => {
            localStorage.setItem('wt_last_project', id)
            updateRoute(`project/${id}`)
          }}
          onRenameProject={handleRenameProject}
        />
      ) : (
        <div className="w-20 flex flex-col items-center py-6 border-r border-stone-100">
          <button
            onClick={() => updateRoute('projects')}
            className="flex flex-col items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            title="Проекты"
          >
            <Icon name="project" className="w-6 h-6" />
            <span className="text-xs font-medium">Проекты</span>
          </button>
        </div>
      )}
      <main className="flex-1 min-w-0">{render()}</main>
      {aiOpen && <AIAssistant onClose={() => setAiOpen(false)} />}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <AppShell />
      </StoreProvider>
    </AuthProvider>
  )
}