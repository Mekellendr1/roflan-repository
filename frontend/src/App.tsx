import { useState } from 'react'
import Sidebar from './components/Sidebar'
import AvailabilityMap from './pages/AvailabilityMap'
import Conflicts from './pages/Conflicts'
import Dashboard from './pages/Dashboard'
import EmployeeDetail from './pages/EmployeeDetail'
import MeetingFinder from './pages/MeetingFinder'
import Sources from './pages/Sources'

export default function App() {
  const [route, setRoute] = useState('dashboard')

  let content = null
  if (route === 'dashboard') content = <Dashboard setRoute={setRoute} />
  else if (route === 'map') content = <AvailabilityMap />
  else if (route === 'conflicts') content = <Conflicts />
  else if (route === 'meeting') content = <MeetingFinder />
  else if (route === 'sources') content = <Sources />
  else if (route.startsWith('emp/'))
    content = <EmployeeDetail empId={route.slice(4)} setRoute={setRoute} />

  return (
    <div className="flex min-h-screen text-stone-900">
      <Sidebar route={route} setRoute={setRoute} />
      <main className="flex-1 min-w-0">{content}</main>
    </div>
  )
}
