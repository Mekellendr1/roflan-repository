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
  const [aiOpen, setAiOpen] = useState(false)
  const [activeProjectName, setActiveProjectName] = useState<string | null>(null)
  const [activeProjectRole, setActiveProjectRole] = useState<ProjectRole | null>(null)
  const [projects, setProjects] = useState<any[]>([])
  const { employees } = useStore()
  const { user, loading: authLoading, logout } = useAuth()

  useEffect(() => {
    hydrateFromList(employees)
  }, [employees])

  // active project persists until explicitly changed or closed

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
            setRoute(`project/${last}`)
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-400 text-sm">
        Загрузка...
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  function render() {
    if (route.startsWith('emp/')) {
      return <EmployeeDetail empId={route.slice(4)} setRoute={setRoute} />
    }
    if (route.startsWith('project/')) {
      const projectId = route.slice('project/'.length)
      return (
        <ProjectDetail
          projectId={projectId}
          setRoute={setRoute}
          onProjectLoaded={(name, role) => {
            setActiveProjectName(name)
            setActiveProjectRole(role)
          }}
        />
      )
    }
    switch (route) {
      case 'dashboard':
        return <Dashboard setRoute={setRoute} />
      case 'analytics':
        return <Analytics />
      case 'employees':
        return <Employees setRoute={setRoute} />
      case 'diagnostics':
        return <Diagnostics setRoute={setRoute} />
      case 'map':
        return <AvailabilityMap />
      case 'meeting':
        return <MeetingFinder />
      case 'conflicts':
        return <Conflicts setRoute={setRoute} />
      case 'recommendations':
        return <Recommendations setRoute={setRoute} />
      case 'roadmap':
        return <Roadmap setRoute={setRoute} />
      case 'notifications':
        return <Notifications setRoute={setRoute} />
      case 'sources':
        return <Sources />
      case 'projects':
        return <ProjectsPage setRoute={setRoute} />
      default:
        return <Dashboard setRoute={setRoute} />
    }
  }

  return (
    <div className="flex min-h-screen bg-stone-50">
      {activeProjectName ? (
        <Sidebar
          route={route}
          setRoute={setRoute}
          onOpenAI={() => setAiOpen(true)}
          onLogout={logout}
          currentProjectName={activeProjectName}
          currentRole={activeProjectRole}
          projects={projects}
          onSelectProject={(id: string) => {
            localStorage.setItem('wt_last_project', id)
            setRoute(`project/${id}`)
          }}
        />
      ) : (
        <div className="w-20 flex flex-col items-center py-6 border-r border-stone-100">
          <button
            onClick={() => setRoute('projects')}
            className="flex flex-col items-center gap-1 text-stone-600 hover:text-stone-900"
          >
            <Icon name="project" className="w-6 h-6" />
            <span className="text-xs">Проекты</span>
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
