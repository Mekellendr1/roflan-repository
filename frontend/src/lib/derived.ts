/**
 * derived.ts — публичный API не изменился, но данные приходят с бэкенда.
 * App.tsx наполняет кэш через hydrate() после загрузки с сервера.
 * Если бэк недоступен — локальный расчёт (derived_local), чтобы демо не падало.
 */
import type {
  Conflict,
  DiagnosticGroup,
  EmployeeComputed,
  Notification,
  Recommendation,
} from './types'
import * as local from './derived_local'

interface Cache {
  employees: EmployeeComputed[]
  groups: DiagnosticGroup[]
  conflicts: Conflict[]
  recommendations: Recommendation[]
  notifications: Notification[]
  roadmap: EmployeeComputed[]
  ready: boolean
}

const cache: Cache = {
  employees: [],
  groups: [],
  conflicts: [],
  recommendations: [],
  notifications: [],
  roadmap: [],
  ready: false,
}

/** Вызывается из App.tsx после загрузки данных с бэка. */
export function hydrate(data: {
  employees: EmployeeComputed[]
  groups: DiagnosticGroup[]
  conflicts: Conflict[]
  recommendations: Recommendation[]
  notifications: Notification[]
  roadmap: EmployeeComputed[]
}) {
  cache.employees = data.employees
  cache.groups = data.groups
  cache.conflicts = data.conflicts
  cache.recommendations = data.recommendations
  cache.notifications = data.notifications
  cache.roadmap = data.roadmap
  cache.ready = true
}

/**
 * Пересчитать ВСЕ производные данные из списка сотрудников store.
 * Вызывается из App при каждом изменении (правка профиля, импорт и т.д.),
 * чтобы все страницы видели свежие данные.
 */
export function hydrateFromList(list: EmployeeComputed[]) {
  cache.employees = list
  cache.groups = local.diagnosticGroups(list)
  cache.conflicts = local.allConflicts(list)
  cache.recommendations = local.allRecommendations(list)
  cache.notifications = local.smartNotifications(list)
  cache.roadmap = local.actualizationRoadmap(list)
  cache.ready = true
}

function emps(): EmployeeComputed[] {
  return cache.ready ? cache.employees : local.COMPUTED
}

// COMPUTED — массив сотрудников через прокси (читает из кэша или локали)
export const COMPUTED: EmployeeComputed[] = new Proxy(
  [] as EmployeeComputed[],
  {
    get(_t, prop) {
      const src = emps()
      const v = (src as any)[prop]
      return typeof v === 'function' ? v.bind(src) : v
    },
    has(_t, prop) {
      return prop in emps()
    },
    ownKeys() {
      return Reflect.ownKeys(emps())
    },
    getOwnPropertyDescriptor(_t, prop) {
      return Object.getOwnPropertyDescriptor(emps(), prop)
    },
  }
)

export function getEmployee(id: string): EmployeeComputed | undefined {
  return emps().find((e) => e.id === id)
}

/** Найти Employee текущего пользователя по его userId */
export function getMyEmployee(userId: string): EmployeeComputed | undefined {
  return emps().find((e) => e.userId === userId)
}

/** Уведомления для конкретного сотрудника (по его empId) */
export function myNotifications(empId: string): import('./types').Notification[] {
  return smartNotifications().filter((n) => n.empId === empId)
}

export function diagnosticGroups(
  list?: EmployeeComputed[]
): DiagnosticGroup[] {
  // если бэк готов и фильтра нет — берём готовые группы с сервера
  if (cache.ready && !list) return cache.groups
  // иначе считаем локально по переданному списку (фильтр по команде)
  return local.diagnosticGroups(list ?? emps())
}

export function allConflicts(): Conflict[] {
  return cache.ready ? cache.conflicts : local.allConflicts()
}

export function allRecommendations(): Recommendation[] {
  return cache.ready ? cache.recommendations : local.allRecommendations()
}

export function smartNotifications(): Notification[] {
  return cache.ready ? cache.notifications : local.smartNotifications()
}

export function actualizationRoadmap(): EmployeeComputed[] {
  return cache.ready ? cache.roadmap : local.actualizationRoadmap()
}

export function dashboardStats(list?: EmployeeComputed[]) {
  const src = list ?? emps()
  const n = src.length || 1
  return {
    total: src.length,
    conflicts: allConflicts().length,
    critical: src.filter(
      (e) =>
        e.metrics.riskLevel === 'critical' || e.metrics.riskLevel === 'high'
    ).length,
    stale: src.filter((e) => e.metrics.actuality < 0.6).length,
    avgActuality: Math.round(
      (src.reduce((s, e) => s + e.metrics.actuality, 0) / n) * 100
    ),
    avgWorkload: Math.round(
      (src.reduce((s, e) => s + e.metrics.workload, 0) / n) * 100
    ),
    overloaded: src.filter((e) => e.metrics.workload > 0.8).length,
  }
}
