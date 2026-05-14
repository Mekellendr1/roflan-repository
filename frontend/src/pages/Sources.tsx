import { notifications, sources } from '../lib/mockData'
import Badge from '../components/Badge'
import Icon from '../components/Icon'
import TopBar from '../components/TopBar'

export default function Sources() {
  return (
    <div className="animate-fade-in">
      <TopBar title="Источники данных" subtitle="Откуда система получает информацию о сотрудниках" />
      <div className="p-8">
        <div className="grid grid-cols-2 gap-4">
          {sources.map((s) => (
            <div key={s.id} className="bg-white border border-stone-200 rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-lg flex items-center justify-center ${
                      s.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <Icon name={s.icon} className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">{s.name}</p>
                    <p className="text-xs text-stone-500">{s.type}</p>
                  </div>
                </div>
                <Badge color={s.status === 'active' ? 'green' : 'amber'}>
                  {s.status === 'active' ? 'активен' : 'устарел'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wide mb-1">Записей</p>
                  <p className="font-mono font-bold text-stone-900">{s.records}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wide mb-1">Синхронизация</p>
                  <p className="font-medium text-stone-700">{s.lastSync}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-bold text-stone-900 mb-4">Уведомления и действия</h2>
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="bg-white border border-stone-200 rounded-xl px-5 py-4 flex items-center gap-4"
              >
                <div className={`w-2 h-2 rounded-full ${n.urgent ? 'bg-red-500' : 'bg-stone-300'}`} />
                <div className="flex-1">
                  <p className="text-sm text-stone-900">
                    <span className="font-semibold">{n.who}</span> — {n.text}
                  </p>
                </div>
                <button className="px-3 py-1.5 text-sm font-medium border border-stone-200 rounded-lg hover:bg-stone-50">
                  {n.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
