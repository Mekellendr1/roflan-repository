<<<<<<< HEAD
import { useEffect, useRef, useState, useCallback } from 'react'
=======
import { useEffect, useState } from 'react'
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
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
<<<<<<< HEAD
import ProfileSetup from './pages/ProfileSetup'
import MyProfile from './pages/MyProfile'
import { hydrateFromList } from './lib/derived'
import { computeAll } from './lib/metrics'
import { http } from './lib/api'
import { apiGetProjects } from './lib/authApi'
import { StoreProvider } from './lib/store'
=======
import { hydrateFromList } from './lib/derived'
import { StoreProvider, useStore } from './lib/store'
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
import { AuthProvider, useAuth } from './lib/authContext'
import type { ProjectRole } from './lib/authTypes'

function AppShell() {
  const [route, setRoute] = useState('projects')
  const [history, setHistory] = useState<string[]>(['projects'])
  const [aiOpen, setAiOpen] = useState(false)
<<<<<<< HEAD

  const [activeProjectName, setActiveProjectName] = useState<string | null>(null)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activeProjectRole, setActiveProjectRole] = useState<ProjectRole | null>(null)
  const [projects, setProjects] = useState<any[]>([])

  // Счётчик меняется только при СМЕНЕ проекта → перемонтирует страницы
  const [dataKey, setDataKey] = useState(0)
  const [dataLoading, setDataLoading] = useState(false)
  const fetchTicket = useRef(0)
  // Сохраняем activeProjectId в ref чтобы иметь актуальное значение в колбэках
  const activeProjectIdRef = useRef<string | null>(null)

  const { user, loading: authLoading, logout } = useAuth()

  const loadProjectEmployees = useCallback((projectId: string, remount = true) => {
    const token = localStorage.getItem('wt_token')
    if (!token || !projectId) return

    const ticket = ++fetchTicket.current
    if (remount) setDataLoading(true)

    http.get(`/projects/${projectId}/employees`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (ticket !== fetchTicket.current) return
        const data: any[] = Array.isArray(res.data) ? res.data : []
        const rawFilled = data
          .filter((e) => e.profile_filled !== false)
          // Убираем поле metrics с бэка — фронт считает их сам через computeAll
          .map(({ metrics: _m, profile_filled: _pf, ...rest }: any) => rest)
        try {
          hydrateFromList(computeAll(rawFilled))
        } catch (err) {
          console.error('computeAll failed:', err, rawFilled)
          // Попробуем посчитать по одному, пропуская битые записи
          const safe = rawFilled.flatMap((e) => {
            try { return [computeAll([e])[0]] } catch { return [] }
          })
          hydrateFromList(safe)
        }
      })
      .catch((err) => {
        if (ticket !== fetchTicket.current) return
        console.error('Failed to load employees:', err)
        hydrateFromList([])
      })
      .finally(() => {
        if (ticket !== fetchTicket.current) return
        if (remount) {
          setDataKey((k) => k + 1)
          setDataLoading(false)
        }
      })
  }, [])

  // Загружаем сотрудников при смене проекта
  useEffect(() => {
    if (!activeProjectId) return
    activeProjectIdRef.current = activeProjectId
    loadProjectEmployees(activeProjectId, true)
  }, [activeProjectId, loadProjectEmployees])

  // Загружаем проекты при входе
=======
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
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
  useEffect(() => {
    if (!user) return
    const token = localStorage.getItem('wt_token')
    if (!token) return
<<<<<<< HEAD
    let alive = true

    apiGetProjects(token)
      .then((list) => {
        if (!alive) return
        setProjects(list)
        if (list.length === 0) return

        const lastId = localStorage.getItem('wt_last_project')
        const target = lastId && list.find((p: any) => p.id === lastId)
          ? lastId
          : list[0].id

        localStorage.setItem('wt_last_project', target)
        updateRoute(`project/${target}`)
      })
      .catch(() => {})

    return () => { alive = false }
  }, [user])

  useEffect(() => {
    const onPop = () => {
=======
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
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
      const path = window.location.pathname.slice(1) || 'projects'
      setRoute(path)
      setHistory((h) => h.slice(0, -1))
    }
<<<<<<< HEAD
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const goBack = () => {
    if (history.length > 1) {
      const next = history.slice(0, -1)
      setHistory(next)
      setRoute(next[next.length - 1])
=======
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Navigate back
  const goBack = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1)
      setHistory(newHistory)
      setRoute(newHistory[newHistory.length - 1])
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
      window.history.back()
    }
  }

<<<<<<< HEAD
  const updateRoute = (r: string) => {
    setRoute(r)
    setHistory((h) => [...h, r])
    window.history.pushState(null, '', `/${r}`)
  }

  const handleRenameProject = (projectId: string, newName: string) => {
    if (!newName.trim() || projectId !== activeProjectId) return
    setActiveProjectName(newName)
    setProjects((ps) => ps.map((p) => p.id === projectId ? { ...p, name: newName } : p))
  }

  // Перегружаем сотрудников БЕЗ перемонтирования (чтобы не выкидывало с ProjectDetail)
  const handleMembersChanged = useCallback(() => {
    const pid = activeProjectIdRef.current
    if (pid) loadProjectEmployees(pid, false)
  }, [loadProjectEmployees])

=======
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

>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
        Загрузка...
      </div>
    )
  }

<<<<<<< HEAD
  if (!user) return <AuthPage />
  if (!user.profile_filled) return <ProfileSetup onDone={() => {}} />

  function renderPage() {
    if (route.startsWith('emp/')) {
      return <EmployeeDetail empId={route.slice(4)} onBack={goBack} setRoute={updateRoute} currentRole={activeProjectRole} />
=======
  if (!user) {
    return <AuthPage />
  }

  function render() {
    if (route.startsWith('emp/')) {
      return <EmployeeDetail empId={route.slice(4)} onBack={goBack} setRoute={updateRoute} />
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
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
<<<<<<< HEAD
            setActiveProjectRole(role)
            localStorage.setItem('wt_last_project', projectId)
            // Меняем activeProjectId только если это другой проект
            // (смена триггерит useEffect → загружает сотрудников)
            if (activeProjectIdRef.current !== projectId) {
              activeProjectIdRef.current = projectId
              setActiveProjectId(projectId)
            }
          }}
          onMembersChanged={handleMembersChanged}
=======
            setActiveProjectId(projectId)
            setActiveProjectRole(role)
          }}
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
        />
      )
    }
    switch (route) {
<<<<<<< HEAD
      case 'dashboard':        return <Dashboard setRoute={updateRoute} currentRole={activeProjectRole} />
      case 'analytics':        return <Analytics />
      case 'employees':        return <Employees setRoute={updateRoute} currentRole={activeProjectRole} />
      case 'diagnostics':      return <Diagnostics setRoute={updateRoute} />
      case 'map':              return <AvailabilityMap />
      case 'meeting':          return <MeetingFinder />
      case 'conflicts':        return <Conflicts setRoute={updateRoute} />
      case 'recommendations':  return <Recommendations setRoute={updateRoute} />
      case 'roadmap':          return <Roadmap setRoute={updateRoute} />
      case 'notifications':    return <Notifications setRoute={updateRoute} currentRole={activeProjectRole} />
      case 'sources':          return <Sources />
      case 'my-profile':       return <MyProfile onBack={goBack} />
      case 'projects':         return <ProjectsPage setRoute={updateRoute} />
      default:                 return <Dashboard setRoute={updateRoute} />
=======
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
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
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
<<<<<<< HEAD
          onSelectProject={(id) => {
            localStorage.setItem('wt_last_project', id)
            // Сначала меняем ref и state, потом роут
            activeProjectIdRef.current = id
            setActiveProjectId(id)
=======
          onSelectProject={(id: string) => {
            localStorage.setItem('wt_last_project', id)
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
            updateRoute(`project/${id}`)
          }}
          onRenameProject={handleRenameProject}
        />
      ) : (
        <div className="w-20 flex flex-col items-center py-6 border-r border-stone-100">
          <button
            onClick={() => updateRoute('projects')}
            className="flex flex-col items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
<<<<<<< HEAD
=======
            title="Проекты"
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
          >
            <Icon name="project" className="w-6 h-6" />
            <span className="text-xs font-medium">Проекты</span>
          </button>
        </div>
      )}
<<<<<<< HEAD

      {/* key=dataKey: перемонтирует страницы только при смене проекта */}
      <main key={dataKey} className="flex-1 min-w-0">
        {dataLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-stone-400 text-sm">Загрузка данных проекта...</div>
          </div>
        ) : renderPage()}
      </main>

=======
      <main className="flex-1 min-w-0">{render()}</main>
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
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
<<<<<<< HEAD
}
=======
}
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
