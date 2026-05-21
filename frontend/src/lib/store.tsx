import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { computeMetrics } from './metrics'
import { employees as seedEmployees } from './mockData'
import type {
  Employee,
  EmployeeComputed,
  HistoryEntry,
  TimeException,
  WorkSchedule,
} from './types'

function nowISO() {
  return new Date().toISOString()
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

interface StoreValue {
  employees: EmployeeComputed[]
  getEmployee: (id: string) => EmployeeComputed | undefined
  // мутации профиля (раздел 3, 11 ТЗ)
  confirmActuality: (id: string) => void
  updateSchedule: (id: string, sched: WorkSchedule) => void
  updateFormat: (id: string, format: Employee['format']) => void
  addException: (id: string, exc: Omit<TimeException, 'id'>) => void
  removeException: (id: string, excId: string) => void
  // импорт данных (раздел 18 ТЗ)
  importEmployees: (raw: Employee[]) => { ok: boolean; message: string }
  resetData: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

function withHistory(emp: Employee, entry: Omit<HistoryEntry, 'id' | 'date' | 'riskAt'>): Employee {
  const risk = computeMetrics(emp).metrics.integralRisk
  const h: HistoryEntry = {
    id: uid('h'),
    date: nowISO(),
    riskAt: risk,
    ...entry,
  }
  return { ...emp, history: [...(emp.history ?? []), h] }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [raw, setRaw] = useState<Employee[]>(() =>
    seedEmployees.map((e) => ({
      ...e,
      history: [
        {
          id: uid('h'),
          date: e.lastUpdate,
          action: 'Профиль создан',
          detail: `График ${e.schedule.startHour}:00–${e.schedule.endHour}:00, ${e.format}`,
          riskAt: computeMetrics(e).metrics.integralRisk,
        },
      ],
    }))
  )
  const employees = useMemo<EmployeeComputed[]>(
    () => raw.map(computeMetrics),
    [raw]
  )

  const getEmployee = useCallback(
    (id: string) => employees.find((e) => e.id === id),
    [employees]
  )

  const mutate = useCallback(
    (id: string, fn: (e: Employee) => Employee) => {
      setRaw((prev) => prev.map((e) => (e.id === id ? fn(e) : e)))
    },
    []
  )

  const confirmActuality = useCallback(
    (id: string) => {
      mutate(id, (e) =>
        withHistory({ ...e, lastUpdate: nowISO() }, {
          action: 'Актуальность подтверждена',
          detail: 'Сотрудник подтвердил, что график соответствует реальности',
        })
      )
    },
    [mutate]
  )

  const updateSchedule = useCallback(
    (id: string, sched: WorkSchedule) => {
      mutate(id, (e) =>
        withHistory(
          { ...e, schedule: sched, lastUpdate: nowISO() },
          {
            action: 'Изменён график',
            detail: `Новые часы: ${sched.startHour}:00–${sched.endHour}:00, дней: ${sched.days.length}`,
          }
        )
      )
    },
    [mutate]
  )

  const updateFormat = useCallback(
    (id: string, format: Employee['format']) => {
      mutate(id, (e) =>
        withHistory(
          { ...e, format, lastUpdate: nowISO() },
          { action: 'Изменён формат работы', detail: `Новый формат: ${format}` }
        )
      )
    },
    [mutate]
  )

  const addException = useCallback(
    (id: string, exc: Omit<TimeException, 'id'>) => {
      mutate(id, (e) =>
        withHistory(
          {
            ...e,
            exceptions: [...e.exceptions, { ...exc, id: uid('x') }],
            lastUpdate: nowISO(),
          },
          { action: 'Добавлено исключение', detail: exc.note || exc.type }
        )
      )
    },
    [mutate]
  )

  const removeException = useCallback(
    (id: string, excId: string) => {
      mutate(id, (e) =>
        withHistory(
          { ...e, exceptions: e.exceptions.filter((x) => x.id !== excId) },
          { action: 'Удалено исключение', detail: 'Период отсутствия снят' }
        )
      )
    },
    [mutate]
  )

  const importEmployees = useCallback(
    (parsed: Employee[]) => {
      try {
        if (!Array.isArray(parsed) || parsed.length === 0)
          return { ok: false, message: 'Файл пуст или не массив сотрудников' }
        // минимальная валидация
        const valid = parsed.every(
          (e) => e.id && e.name && e.schedule && Array.isArray(e.events)
        )
        if (!valid)
          return {
            ok: false,
            message: 'Нет обязательных полей (id, name, schedule, events)',
          }
        setRaw(
          parsed.map((e) => ({
            ...e,
            history: [
              {
                id: uid('h'),
                date: nowISO(),
                action: 'Импортирован из файла',
                detail: 'Загружен через окно «Источники»',
                riskAt: computeMetrics(e).metrics.integralRisk,
              },
            ],
          }))
        )
        return { ok: true, message: `Загружено сотрудников: ${parsed.length}` }
      } catch (err) {
        return { ok: false, message: 'Ошибка разбора файла' }
      }
    },
    []
  )

  const resetData = useCallback(() => {
    setRaw(
      seedEmployees.map((e) => ({
        ...e,
        history: [
          {
            id: uid('h'),
            date: e.lastUpdate,
            action: 'Профиль создан',
            detail: `График ${e.schedule.startHour}:00–${e.schedule.endHour}:00, ${e.format}`,
            riskAt: computeMetrics(e).metrics.integralRisk,
          },
        ],
      }))
    )
  }, [])

  const value: StoreValue = {
    employees,
    getEmployee,
    confirmActuality,
    updateSchedule,
    updateFormat,
    addException,
    removeException,
    importEmployees,
    resetData,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
