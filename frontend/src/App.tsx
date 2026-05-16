import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
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
import { hydrate } from './lib/derived'
import {
  apiGetConflicts,
  apiGetDiagnostics,
  apiGetEmployees,
  apiGetNotifications,
  apiGetRecommendations,
  apiGetRoadmap,
} from './lib/api'

export default function App() {
  const [route, setRoute] = useState('dashboard')
  const [aiOpen, setAiOpen] = useState(false)
  const [state, setState] = useState<'loading' | 'ready' | 'offline'>('loading')

  useEffect(() => {
    let cancelled = false
    Promise.all([
      apiGetEmployees(),
      apiGetDiagnostics(),
      apiGetConflicts(),
      apiGetRecommendations(),
      apiGetNotifications(),
      apiGetRoadmap(),
    ])
      .then(
        ([
          employees,
          groups,
          conflicts,
          recommendations,
          notifications,
          roadmap,
        ]) => {
          if (cancelled) return
          hydrate({
            employees,
            groups,
            conflicts,
            recommendations,
            notifications,
            roadmap,
          })
          setState('ready')
        }
      )
      .catch((e) => {
        console.error('Backend offline, using local data:', e)
        if (!cancelled) setState('offline')
      })
    return () => {
      cancelled = true
    }
  }, [])

  function render() {
    if (route.startsWith('emp/')) {
      return <EmployeeDetail empId={route.slice(4)} setRoute={setRoute} />
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
      default:
        return <Dashboard setRoute={setRoute} />
    }
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-stone-300 border-t-lime-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-stone-500 text-sm">Загрузка данных с сервера…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-stone-50">
      <Sidebar
        route={route}
        setRoute={setRoute}
        onOpenAI={() => setAiOpen(true)}
      />
      <main className="flex-1 min-w-0">
        {state === 'offline' && (
          <div className="bg-amber-50 border-b border-amber-200 px-8 py-2 text-sm text-amber-800">
            ⚠ Бэкенд недоступен — показаны локальные демо-данные. Запусти
            сервер на :8000 и обнови страницу.
          </div>
        )}
        {render()}
      </main>
      {aiOpen && <AIAssistant onClose={() => setAiOpen(false)} />}
    </div>
  )
}
