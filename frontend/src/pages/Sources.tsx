import { useRef, useState } from 'react'
import { dataSources } from '../lib/mockData'
import { useStore } from '../lib/store'
import { Badge } from '../components/Primitives'
import Icon from '../components/Icon'
import TopBar, { GhostButton } from '../components/TopBar'

const TYPE_LABEL: Record<string, string> = {
  calendar: 'Календарь',
  hr: 'HR-система',
  tasks: 'Таск-трекер',
  timesheet: 'Табель',
  manual: 'Ручной ввод',
}

const STATUS: Record<string, { label: string; color: 'green' | 'amber' | 'red'; dot: string }> = {
  active: { label: 'активен', color: 'green', dot: 'bg-emerald-500' },
  stale: { label: 'устарел', color: 'amber', dot: 'bg-amber-500' },
  error: { label: 'нет связи', color: 'red', dot: 'bg-red-500' },
}

export default function Sources() {
  const total = dataSources.reduce((s, d) => s + d.records, 0)
  const { importEmployees, resetData } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const onFile = async (file: File) => {
    try {
      const text = await file.text()
      let parsed: unknown
      if (file.name.endsWith('.json')) {
        parsed = JSON.parse(text)
      } else {
        // примитивный CSV-парсер: ожидаем JSON-массив тоже допустим
        setMsg({
          ok: false,
          text: 'CSV: для MVP загрузите JSON-массив сотрудников (формат как в mockData)',
        })
        return
      }
      const res = importEmployees(parsed as never)
      setMsg({ ok: res.ok, text: res.message })
    } catch {
      setMsg({ ok: false, text: 'Не удалось прочитать файл' })
    }
  }

  return (
    <div className="fade-in">
      <TopBar
        title="Загрузка данных"
        subtitle="Источники, из которых система собирает данные о рабочем времени"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".json,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFile(f)
            e.target.value = ''
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="px-3 py-2 text-sm rounded-lg bg-sky-500 text-white hover:bg-sky-400 font-semibold flex items-center gap-2"
        >
          <Icon name="download" className="w-4 h-4" />
          Импорт JSON
        </button>
        <GhostButton
          icon="refresh"
          label="Сбросить к демо"
          onClick={() => {
            resetData()
            setMsg({ ok: true, text: 'Данные сброшены к демонстрационным' })
          }}
        />
      </TopBar>

      <div className="p-8">
        {msg && (
          <div
            className={`mb-5 px-4 py-3 rounded-xl text-sm border ${
              msg.ok
                ? 'bg-sky-50 border-sky-200 text-sky-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {msg.ok ? '✓ ' : '✕ '}
            {msg.text}
          </div>
        )}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <p className="text-xs text-stone-500 uppercase tracking-wide mb-2">
              Источников
            </p>
            <p className="text-3xl font-bold text-stone-900">{dataSources.length}</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <p className="text-xs text-stone-500 uppercase tracking-wide mb-2">
              Активных
            </p>
            <p className="text-3xl font-bold text-emerald-600">
              {dataSources.filter((d) => d.status === 'active').length}
            </p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <p className="text-xs text-stone-500 uppercase tracking-wide mb-2">
              Требуют внимания
            </p>
            <p className="text-3xl font-bold text-amber-600">
              {dataSources.filter((d) => d.status !== 'active').length}
            </p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <p className="text-xs text-stone-500 uppercase tracking-wide mb-2">
              Всего записей
            </p>
            <p className="text-3xl font-bold text-stone-900">
              {total.toLocaleString('ru')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {dataSources.map((s) => {
            const st = STATUS[s.status]
            return (
              <div
                key={s.id}
                className="bg-white border border-stone-200 rounded-xl p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-lg flex items-center justify-center ${
                        s.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : s.status === 'stale'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      <Icon name={s.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900">{s.name}</p>
                      <p className="text-xs text-stone-500">{TYPE_LABEL[s.type]}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                    <Badge color={st.color}>{st.label}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-wide mb-1">
                      Записей
                    </p>
                    <p className="font-mono font-bold text-stone-900">
                      {s.records.toLocaleString('ru')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-wide mb-1">
                      Синхронизация
                    </p>
                    <p className="font-medium text-stone-700">{s.lastSync}</p>
                  </div>
                </div>
                {s.status !== 'active' && (
                  <button className="mt-4 w-full py-2 text-sm font-medium border border-stone-200 rounded-lg hover:bg-stone-50 flex items-center justify-center gap-2">
                    <Icon name="refresh" className="w-4 h-4" />
                    Переподключить
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-6 bg-stone-50 border border-stone-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-stone-700 mb-2">
            Имитация данных (MVP)
          </p>
          <p className="text-sm text-stone-500">
            Для демонстрации система работает на синтетических данных из JSON: 9
            сотрудников, события календаря, исключения из HR, задачи из
            таск-трекера. В продакшене подключаются реальные коннекторы Google
            Calendar / БОСС-Кадровик / Jira.
          </p>
        </div>
      </div>
    </div>
  )
}
