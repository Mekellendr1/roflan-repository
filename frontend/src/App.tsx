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
import { hydrateFromList } from './lib/derived'
import { StoreProvider, useStore } from './lib/store'
import { ROLE_ACCESS } from './lib/roles'

function AppShell() {
  const [route, setRoute] = useState('dashboard')
  const [aiOpen, setAiOpen] = useState(false)
  const { employees, role } = useStore()

  // Любое изменение в store (правка профиля, импорт, подтверждение)
  // мгновенно пересчитывает все производные данные для всех страниц.
  useEffect(() => {
    hydrateFromList(employees)
  }, [employees])

  // Доступные маршруты для текущей роли (раздел 12 ТЗ)
  const allowed = ROLE_ACCESS[role]

  function render() {
    if (route.startsWith('emp/')) {
      return <EmployeeDetail empId={route.slice(4)} setRoute={setRoute} />
    }
    // если роль не имеет доступа к разделу — назад на дашборд
    if (!allowed.includes(route)) {
      return <Dashboard setRoute={setRoute} />
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

  return (
    <div className="flex min-h-screen bg-stone-50">
      <Sidebar
        route={route}
        setRoute={setRoute}
        onOpenAI={() => setAiOpen(true)}
        allowed={allowed}
      />
      <main className="flex-1 min-w-0">{render()}</main>
      {aiOpen && <AIAssistant onClose={() => setAiOpen(false)} />}
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  )
}
