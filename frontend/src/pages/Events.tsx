import { useState, useEffect, useCallback } from 'react'
import { COMPUTED, getMyEmployee, useCacheVersion } from '../lib/derived'
import { useAuth } from '../lib/authContext'
import { apiCreateEvent, apiUpdateEvent, apiDeleteEvent, http } from '../lib/api'
import { computeAll } from '../lib/metrics'
import { hydrateFromList } from '../lib/derived'
import TopBar from '../components/TopBar'
import Icon from '../components/Icon'
import type { ProjectRole } from '../lib/authTypes'

const WEEKDAY = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const EVENT_TYPES = ['meeting', 'focus', 'task', 'recurring']
const EVENTS_PER_PAGE = 20

function fmtHour(h: number) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return `${hh}:${mm.toString().padStart(2, '0')}`
}

function decl(n: number, forms: [string, string, string]) {
  const n100 = Math.abs(n) % 100
  const n10 = n100 % 10
  if (n100 > 10 && n100 < 20) return forms[2]
  if (n10 > 1 && n10 < 5) return forms[1]
  if (n10 === 1) return forms[0]
  return forms[2]
}

export default function EventsPage({
  setRoute,
  currentRole,
}: {
  setRoute: (r: string) => void
  currentRole?: ProjectRole | null
}) {
  const { user } = useAuth()
  useCacheVersion()
  const isEmployee = currentRole === 'Сотрудник'
  const canManage = !isEmployee
  const myEmp = user ? getMyEmployee(user.id) : undefined

  const [team, setTeam] = useState('Все команды')
  const teams = ['Все команды', ...new Set(COMPUTED.map((e) => e.team))]
  const list = team === 'Все команды' ? COMPUTED : COMPUTED.filter((e) => e.team === team)

  const sourceList = isEmployee && myEmp ? [myEmp] : list

  const allEvents = sourceList.flatMap((e) =>
    e.events.map((ev) => ({ ...ev, empName: e.name, empId: e.id, empTeam: e.team }))
  )

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [dayFilter, setDayFilter] = useState<number[]>([])
  const [sortAsc, setSortAsc] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')

  // Модальное окно
  const [modal, setModal] = useState<{ editId?: string } | null>(null)
  const emptyForm = {
    employee_ids: [] as string[],
    title: '',
    day: 0,
    start_hour: 9,
    end_hour: 10,
    event_type: 'meeting',
  }
  const [form, setForm] = useState(emptyForm)
  const toggleEmployee = (id: string) => {
    setForm((f) => ({
      ...f,
      employee_ids: f.employee_ids.includes(id)
        ? f.employee_ids.filter((x) => x !== id)
        : [...f.employee_ids, id],
    }))
  }
  const openCreate = () => {
    setForm(emptyForm)
    setModal({})
  }
  const openEdit = (ev: any) => {
    setForm({
      employee_ids: [ev.empId],
      title: ev.title,
      day: ev.day,
      start_hour: ev.startHour,
      end_hour: ev.endHour,
      event_type: ev.type || 'meeting',
    })
    setModal({ editId: ev.id })
  }
  const closeModal = () => { setModal(null); setForm(emptyForm) }

  const [tick, setTick] = useState(0)
  const forceUpdate = useCallback(() => setTick((t) => t + 1), [])

  const reloadCache = useCallback(async () => {
    try {
      const token = localStorage.getItem('wt_token')
      const lastProject = localStorage.getItem('wt_last_project')
      if (!token || !lastProject) return
      const res = await http.get(`/projects/${lastProject}/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data: any[] = Array.isArray(res.data) ? res.data : []
      const filled = data
        .filter((e: any) => e.profile_filled !== false)
        .map(({ metrics: _m, profile_filled: _pf, ...rest }: any) => rest)
      hydrateFromList(computeAll(filled))
    } catch (err) {
      console.error('reload failed', err)
    }
  }, [])

  useEffect(() => {
    if (tick > 0) reloadCache()
  }, [tick, reloadCache])

  useEffect(() => { setPage(1) }, [team, search, dayFilter, typeFilter])

  const filtered = allEvents
    .filter((ev) => !search || ev.title.toLowerCase().includes(search.toLowerCase()) || ev.empName.toLowerCase().includes(search.toLowerCase()))
    .filter((ev) => dayFilter.length === 0 || dayFilter.includes(ev.day))
    .filter((ev) => !typeFilter || ev.type === typeFilter)
    .sort((a, b) => {
      const cmp = a.day - b.day || a.startHour - b.startHour
      return sortAsc ? cmp : -cmp
    })

  const totalPages = Math.max(1, Math.ceil(filtered.length / EVENTS_PER_PAGE))
  const paged = filtered.slice((page - 1) * EVENTS_PER_PAGE, page * EVENTS_PER_PAGE)

  // Группировка одинаковых событий (название, день, время)
  const grouped = paged.reduce((acc, ev) => {
    const key = `${ev.title}|${ev.day}|${ev.startHour}|${ev.endHour}`
    if (!acc.has(key)) acc.set(key, { ...ev, empNames: [ev.empName], empIds: [ev.empId], count: 1 })
    else { const g = acc.get(key)!; g.empNames.push(ev.empName); g.empIds.push(ev.empId); g.count++ }
    return acc
  }, new Map<string, any>())
  const groupedList = [...grouped.values()]

  const submit = async () => {
    if (form.employee_ids.length === 0 || !form.title) return
    try {
      if (modal?.editId) {
        await apiUpdateEvent(modal.editId, {
          title: form.title,
          day: form.day,
          start_hour: form.start_hour,
          end_hour: form.end_hour,
          event_type: form.event_type,
        })
      } else {
        await apiCreateEvent({
          employee_ids: form.employee_ids,
          title: form.title,
          day: form.day,
          start_hour: form.start_hour,
          end_hour: form.end_hour,
          event_type: form.event_type,
        })
      }
      closeModal()
      forceUpdate()
    } catch (err) { console.error(err) }
  }

  const remove = async (id: string) => {
    if (!confirm('Удалить событие?')) return
    try { await apiDeleteEvent(id); forceUpdate() } catch (err) { console.error(err) }
  }

  const TYPE_LABEL: Record<string, string> = {
    meeting: 'Встреча',
    focus: 'Фокус',
    task: 'Задача',
    recurring: 'Повтор',
  }

  return (
    <div className="fade-in">
      <TopBar
        title={isEmployee ? 'Мои события' : 'События команды'}
        subtitle={`${filtered.length} ${decl(filtered.length, ['событие', 'события', 'событий'])}`}
      >
        {!isEmployee && (
          <select value={team} onChange={(e) => setTeam(e.target.value)}
            className="px-4 py-2 text-sm border border-stone-300 rounded-lg bg-white font-medium">
            {teams.map((t) => <option key={t}>{t}</option>)}
          </select>
        )}
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск…"
          className="px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white w-40" />
        {canManage && (
          <button onClick={openCreate}
            className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold flex items-center gap-2 cursor-pointer">
            <Icon name="plus" className="w-4 h-4" />
            Создать
          </button>
        )}
      </TopBar>

      <div className="p-8 bg-gray-50 min-h-[calc(100vh-100px)] space-y-4">
        {/* Фильтры */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Дни недели */}
          <div className="flex items-center gap-1">
            {WEEKDAY.map((d, i) => (
              <button key={d} onClick={() => setDayFilter((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i])}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium cursor-pointer transition-colors ${
                  dayFilter.includes(i) ? 'bg-blue-600 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}>
                {d}
              </button>
            ))}
          </div>
          {/* Тип события */}
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-stone-200 rounded-lg bg-white text-stone-600">
            <option value="">Все типы</option>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
          {/* Сортировка */}
          <button onClick={() => setSortAsc((v) => !v)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs border border-stone-200 rounded-lg bg-white text-stone-600 hover:bg-stone-100 cursor-pointer">
            <Icon name={sortAsc ? 'chevron' : 'chevron'} className={`w-3.5 h-3.5 transition-transform ${sortAsc ? '' : 'rotate-180'}`} />
            {sortAsc ? 'Сначала раньше' : 'Сначала позже'}
          </button>
          {(dayFilter.length > 0 || typeFilter || search) && (
            <button onClick={() => { setDayFilter([]); setTypeFilter(''); setSearch('') }}
              className="text-xs text-blue-700 hover:text-blue-800 cursor-pointer">
              Сбросить фильтры
            </button>
          )}
        </div>

        {/* Таблица */}
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          {paged.length === 0 ? (
            <div className="p-12 text-center text-stone-400">
              <Icon name="calendar" className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-semibold text-stone-500">Нет событий</p>
              {search || dayFilter.length > 0 || typeFilter ? (
                <p className="text-sm mt-1">Попробуйте другие фильтры</p>
              ) : canManage && (
                <button onClick={openCreate}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 cursor-pointer">
                  Создать первое событие
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Шапка таблицы */}
              <div className="hidden md:flex items-center gap-3 px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider bg-stone-50 border-b border-stone-200">
                <span className="w-28 flex-shrink-0">День · Время</span>
                <span className="flex-1">Название</span>
                {!isEmployee && <span className="w-36 flex-shrink-0">Участники</span>}
                <span className="w-20 text-center flex-shrink-0">Тип</span>
                <span className="w-28 text-center flex-shrink-0 hidden lg:block">Создано</span>
                {canManage && <span className="w-16 text-right flex-shrink-0">Действия</span>}
              </div>
              <div className="divide-y divide-stone-100">
                {groupedList.map((g) => (
                  <div key={g.id} className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-stone-50 group">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-xs font-semibold text-stone-600 w-28 flex-shrink-0">
                        {WEEKDAY[g.day]} {fmtHour(g.startHour)}–{fmtHour(g.endHour)}
                      </span>
                      <span className="font-medium text-stone-800 truncate flex-1">{g.title}</span>
                      {!isEmployee && (
                        <span className="text-xs text-stone-500 truncate w-36 flex-shrink-0" title={g.empNames.join(', ')}>
                          {g.empNames.join(', ')}
                        </span>
                      )}
                      <span className="text-xs flex-shrink-0 w-20 text-center">
                        <span className={`rounded px-1.5 py-0.5 ${
                          g.type === 'meeting' ? 'bg-blue-50 text-blue-700' :
                          g.type === 'focus' ? 'bg-amber-50 text-amber-700' :
                          g.type === 'task' ? 'bg-green-50 text-green-700' :
                          'bg-stone-100 text-stone-600'
                        }`}>
                          {TYPE_LABEL[g.type] || g.type}
                        </span>
                      </span>
                      {g.createdAt && (
                        <span className="text-xs text-stone-400 w-28 text-center flex-shrink-0 hidden lg:block">
                          {new Date(g.createdAt).toLocaleDateString('ru')}
                        </span>
                      )}
                    </div>
                    {canManage && (
                      <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => openEdit({ ...g, id: g.empIds[0], empId: g.empIds[0], empName: g.empNames[0] })}
                          className="p-1.5 text-stone-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 cursor-pointer">
                          <Icon name="edit" className="w-4 h-4" />
                        </button>
                        <button onClick={async () => {
                          if (!confirm(`Удалить ${g.count} событий?`)) return
                          for (const id of g.empIds) try { await apiDeleteEvent(id) } catch {}
                          forceUpdate()
                        }}
                          className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50 cursor-pointer">
                          <Icon name="trash" className="w-4 h-4" />
                        </button>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 px-5 py-4 border-t border-stone-100">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                ←
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                if (totalPages > 10 && p > 1 && p < totalPages && (p < page - 4 || p > page + 4)) {
                  if (p === page - 5 || p === page + 5) return <span key={p} className="px-2 text-stone-300">…</span>
                  return null
                }
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`px-3 py-1.5 text-sm rounded-lg cursor-pointer ${
                      p === page ? 'bg-stone-900 text-white' : 'border border-stone-200 hover:bg-stone-100'
                    }`}>
                    {p}
                  </button>
                )
              })}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={closeModal}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6 pb-3">
              <h3 className="font-bold text-stone-900 text-lg">
                {modal.editId ? 'Редактировать событие' : 'Новое событие'}
              </h3>
              <button onClick={closeModal} className="text-stone-400 hover:text-stone-600 cursor-pointer">
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 pb-6">
              {/* Сотрудники (мультивыбор) */}
              {!modal.editId && (
                <div>
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2 block">Участники</label>
                  <div className="max-h-32 overflow-y-auto border border-stone-200 rounded-lg divide-y divide-stone-100">
                    {list.map((emp) => {
                      const selected = form.employee_ids.includes(emp.id)
                      return (
                        <label key={emp.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer text-sm hover:bg-stone-50 ${selected ? 'bg-blue-50' : ''}`}>
                          <input type="checkbox" checked={selected} onChange={() => toggleEmployee(emp.id)}
                            className="accent-blue-600 rounded" />
                          <span className="flex-1 text-stone-800">{emp.name}</span>
                          <span className="text-xs text-stone-400">{emp.team}</span>
                        </label>
                      )
                    })}
                  </div>
                  {form.employee_ids.length > 0 && (
                    <p className="text-xs text-stone-500 mt-1">Выбрано: {form.employee_ids.length}</p>
                  )}
                </div>
              )}
              {/* Название */}
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1 block">Название</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Введите название события"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm" />
              </div>
              {/* День и время — вместе */}
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1 block">День и время</label>
                <div className="flex items-center gap-2">
                  <select value={form.day} onChange={(e) => setForm((f) => ({ ...f, day: Number(e.target.value) }))}
                    className="border border-stone-200 rounded-lg px-3 py-2.5 text-sm bg-white flex-1">
                    {WEEKDAY.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                  <span className="text-stone-300">·</span>
                  <input type="number" min={0} max={23} value={form.start_hour}
                    onChange={(e) => setForm((f) => ({ ...f, start_hour: Number(e.target.value) }))}
                    className="w-20 border border-stone-200 rounded-lg px-3 py-2.5 text-sm" />
                  <span className="text-stone-400">–</span>
                  <input type="number" min={1} max={24} value={form.end_hour}
                    onChange={(e) => setForm((f) => ({ ...f, end_hour: Number(e.target.value) }))}
                    className="w-20 border border-stone-200 rounded-lg px-3 py-2.5 text-sm" />
                  <span className="text-xs text-stone-400">ч</span>
                </div>
              </div>
              {/* Тип */}
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1 block">Тип события</label>
                <select value={form.event_type} onChange={(e) => setForm((f) => ({ ...f, event_type: e.target.value }))}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm bg-white">
                  {EVENT_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                </select>
              </div>
              {/* Кнопки */}
              <div className="flex items-center gap-3 pt-2">
                <button onClick={submit}
                  className="flex-1 px-4 py-2.5 bg-stone-900 text-white rounded-lg text-sm font-semibold hover:bg-stone-800 cursor-pointer disabled:opacity-40"
                  disabled={form.employee_ids.length === 0 || !form.title}>
                  {modal.editId ? 'Сохранить' : 'Создать событие'}
                </button>
                <button onClick={closeModal}
                  className="px-4 py-2.5 text-sm text-stone-600 hover:text-stone-900 cursor-pointer">
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
