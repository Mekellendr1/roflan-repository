import type {
  CalendarEvent,
  Employee,
  EmployeeComputed,
  EmployeeMetrics,
  Recommendation,
  RiskLevel,
} from './types'

// ===== Константы формул (раздел 6, 9, 10 ТЗ) =====

const D_MAX_DAYS = 90 // макс. период без обновления (формула Ai = 1 - di/D)
const OVERLOAD_THRESHOLD = 0.8 // Li > 0.8 → перегрузка (раздел 9)

// Веса интегрального риска Ri = w1(1-Ai) + w2·Ci + w3·Li + w4·Zi + w5·Hi
// (раздел 10 ТЗ). Сумма = 1. Обоснование:
//  - актуальность графика (1-Ai) — базовый фактор, 25%
//  - конфликты Ci — самый показательный сигнал, 30%
//  - загрузка Li — операционная нагрузка, 25%
//  - смена часового пояса Zi — 10%
//  - расхождение HR/календарь Hi — 10%
const W = { a: 0.25, c: 0.3, l: 0.25, z: 0.1, h: 0.1 }

// ===== Вспомогательные =====

function daysSince(isoDate: string): number {
  const then = new Date(isoDate).getTime()
  const now = Date.now()
  return Math.max(0, Math.floor((now - then) / 86_400_000))
}

function eventHours(e: CalendarEvent): number {
  return e.endHour - e.startHour
}

function isWithinSchedule(e: CalendarEvent, emp: Employee): boolean {
  const inDays = emp.schedule.days.includes(e.day)
  const inHours =
    e.startHour >= emp.schedule.startHour && e.endHour <= emp.schedule.endHour
  return inDays && inHours
}

// ===== Формула актуальности: Ai = 1 - di/D (раздел 6) =====
export function calcActuality(daysSinceUpdate: number): number {
  return Math.max(0, 1 - daysSinceUpdate / D_MAX_DAYS)
}

// ===== Формула конфликтов: Ci = Mout / Mall (раздел 7) =====
export function calcOutOfHoursRatio(emp: Employee): {
  ratio: number
  total: number
  out: number
} {
  const all = emp.events.filter((e) => e.type !== 'focus')
  if (all.length === 0) return { ratio: 0, total: 0, out: 0 }
  const out = all.filter((e) => !isWithinSchedule(e, emp)).length
  return { ratio: out / all.length, total: all.length, out }
}

// ===== Формула загрузки: Li = Hbusy / Hwork (раздел 9) =====
export function calcWorkload(emp: Employee): {
  load: number
  busy: number
  work: number
} {
  const work =
    (emp.schedule.endHour - emp.schedule.startHour) * emp.schedule.days.length
  const busy = emp.events
    .filter((e) => e.type === 'meeting' || e.type === 'recurring' || e.type === 'task')
    .reduce((s, e) => s + eventHours(e), 0)
  return { load: work > 0 ? busy / work : 0, busy, work }
}

// ===== Конфликты заявленный график ↔ факт =====
function countConflicts(emp: Employee): number {
  let count = 0
  const sorted = [...emp.events].sort((a, b) => a.day - b.day || a.startHour - b.startHour)
  // двойные бронирования
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      if (sorted[j].day !== sorted[i].day) break
      if (sorted[j].startHour < sorted[i].endHour) count++
    }
  }
  // вне рабочих часов
  count += emp.events.filter((e) => !isWithinSchedule(e, emp) && e.type !== 'focus').length
  return count
}

// ===== Признак возможной смены часового пояса (Zi) =====
function calcTimezoneShift(emp: Employee): number {
  return emp.activityTimezoneShift ? 1 : 0
}

// ===== Расхождение HR-данных и календаря (Hi) =====
function calcHrMismatch(emp: Employee): number {
  return emp.format !== emp.hrFormat ? 1 : 0
}

// ===== Уровень риска по Ri =====
function riskLevel(ri: number): RiskLevel {
  if (ri >= 0.7) return 'critical'
  if (ri >= 0.5) return 'high'
  if (ri >= 0.3) return 'medium'
  return 'low'
}

// ===== Генерация объяснимых рекомендаций (раздел 16 ТЗ) =====
function buildRecommendations(
  emp: Employee,
  m: Omit<EmployeeMetrics, 'recommendations' | 'actualizationPriority'>
): Recommendation[] {
  const recs: Recommendation[] = []
  const push = (
    action: string,
    reason: string,
    priority: Recommendation['priority'],
    category: Recommendation['category']
  ) =>
    recs.push({
      id: `${emp.id}-${recs.length}`,
      empId: emp.id,
      empName: emp.name,
      action,
      reason,
      priority,
      category,
    })

  if (m.actuality < 0.6)
    push(
      'Попросить сотрудника подтвердить график',
      `График не обновлялся ${m.daysSinceUpdate} дн. (актуальность ${(m.actuality * 100).toFixed(0)}%)`,
      'high',
      'schedule'
    )
  if (m.outOfHoursRatio > 0.25)
    push(
      'Перенести регулярные встречи в рабочее окно',
      `${(m.outOfHoursRatio * 100).toFixed(0)}% встреч проходят вне графика`,
      'high',
      'meeting'
    )
  if (m.workload > OVERLOAD_THRESHOLD)
    push(
      'Снизить количество встреч на этой неделе',
      `Загрузка ${(m.workload * 100).toFixed(0)}% — выше порога перегрузки 80%`,
      'high',
      'workload'
    )
  if (m.timezoneShift)
    push(
      'Обновить часовой пояс в профиле',
      'Фактическая активность не совпадает с заявленным поясом',
      'medium',
      'timezone'
    )
  if (m.hrMismatch)
    push(
      'Сверить формат работы с HR-системой',
      `HR: ${emp.hrFormat}, профиль: ${emp.format}`,
      'medium',
      'hr'
    )
  if (m.hasExceptions)
    push(
      'Не назначать задачи на период отсутствия',
      'У сотрудника есть активные исключения (отпуск/больничный/командировка)',
      'low',
      'schedule'
    )
  if (recs.length === 0)
    push('Действий не требуется', 'График актуален, конфликтов нет', 'low', 'schedule')
  return recs
}

// ===== Главная функция: собрать все показатели по сотруднику =====
export function computeMetrics(emp: Employee): EmployeeComputed {
  const daysSinceUpdate = daysSince(emp.lastUpdate)
  const actuality = calcActuality(daysSinceUpdate)
  const ooh = calcOutOfHoursRatio(emp)
  const wl = calcWorkload(emp)
  const conflictCount = countConflicts(emp)
  const timezoneShift = calcTimezoneShift(emp)
  const hrMismatch = calcHrMismatch(emp)
  const hasExceptions = emp.exceptions.length > 0

  // Ri = w1(1-Ai) + w2·Ci + w3·Li + w4·Zi + w5·Hi
  const integralRisk = Math.min(
    1,
    W.a * (1 - actuality) +
      W.c * ooh.ratio +
      W.l * Math.min(wl.load, 1.5) +
      W.z * timezoneShift +
      W.h * hrMismatch
  )

  const base = {
    daysSinceUpdate,
    actuality,
    outOfHoursRatio: ooh.ratio,
    conflictCount,
    workload: wl.load,
    hasExceptions,
    timezoneShift,
    hrMismatch,
    integralRisk,
    riskLevel: riskLevel(integralRisk),
    busyHours: wl.busy,
    workHours: wl.work,
    meetingsTotal: ooh.total,
    meetingsOutOfHours: ooh.out,
  }

  const recommendations = buildRecommendations(emp, base)
  // Приоритет актуализации = риск * 100, скорректированный на давность
  const actualizationPriority = Math.round(
    Math.min(100, integralRisk * 80 + (daysSinceUpdate / D_MAX_DAYS) * 20)
  )

  const metrics: EmployeeMetrics = {
    ...base,
    recommendations,
    actualizationPriority,
  }

  return { ...emp, metrics }
}

export function computeAll(employees: Employee[]): EmployeeComputed[] {
  return employees.map((emp) => {
    // Защита от undefined полей (данные с бэка могут быть неполными)
    const safe = {
      ...emp,
      events: Array.isArray(emp.events) ? emp.events : [],
      exceptions: Array.isArray(emp.exceptions) ? emp.exceptions : [],
    }
    return computeMetrics(safe)
  })
}

// ===== Командное окно доступности: Tteam = W1 ∩ W2 ∩ ... ∩ Wn (раздел 8) =====
export function teamAvailability(
  employees: EmployeeComputed[],
  day: number
): { hour: number; freeCount: number; total: number }[] {
  const hours = Array.from({ length: 13 }, (_, i) => i + 8) // 8..20
  return hours.map((h) => {
    let free = 0
    for (const emp of employees) {
      const inSchedule =
        emp.schedule.days.includes(day) &&
        h >= emp.schedule.startHour &&
        h < emp.schedule.endHour
      const busy = emp.events.some(
        (e) => e.day === day && h >= e.startHour && h < e.endHour
      )
      if (inSchedule && !busy) free++
    }
    return { hour: h, freeCount: free, total: employees.length }
  })
}

export const FORMULAS = {
  actuality: 'Ai = 1 − di / D,  D = 90 дн.',
  conflicts: 'Ci = Mout / Mall',
  workload: 'Li = Hbusy / Hwork,  порог 0.8',
  team: 'Tteam = W1 ∩ W2 ∩ … ∩ Wn',
  risk: 'Ri = 0.25·(1−Ai) + 0.30·Ci + 0.25·Li + 0.10·Zi + 0.10·Hi',
}

export { D_MAX_DAYS, OVERLOAD_THRESHOLD, W as RISK_WEIGHTS }
