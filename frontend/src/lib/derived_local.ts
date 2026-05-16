import { computeAll } from './metrics'
import { employees as rawEmployees } from './mockData'
import type {
  Conflict,
  DiagnosticGroup,
  EmployeeComputed,
  Notification,
  Recommendation,
} from './types'

// Считаем всё один раз
export const COMPUTED: EmployeeComputed[] = computeAll(rawEmployees)

export function getEmployee(id: string): EmployeeComputed | undefined {
  return COMPUTED.find((e) => e.id === id)
}

// ===== Диагностические группы (раздел 4 ТЗ, 9 групп) =====
export function diagnosticGroups(list = COMPUTED): DiagnosticGroup[] {
  return [
    {
      id: 'actual',
      title: 'Актуальный график',
      desc: 'Данные свежие, конфликтов нет',
      color: 'green',
      employees: list.filter(
        (e) => e.metrics.actuality >= 0.7 && e.metrics.conflictCount === 0
      ),
    },
    {
      id: 'stale',
      title: 'Устаревший график',
      desc: 'Давно не обновлялся, актуальность < 60%',
      color: 'amber',
      employees: list.filter((e) => e.metrics.actuality < 0.6),
    },
    {
      id: 'out_of_hours',
      title: 'Встречи вне рабочего времени',
      desc: 'Доля встреч вне графика > 25%',
      color: 'red',
      employees: list.filter((e) => e.metrics.outOfHoursRatio > 0.25),
    },
    {
      id: 'overload',
      title: 'Высокая нагрузка',
      desc: 'Загрузка выше порога 80%',
      color: 'red',
      employees: list.filter((e) => e.metrics.workload > 0.8),
    },
    {
      id: 'exceptions',
      title: 'Есть временные исключения',
      desc: 'Отпуск, больничный или командировка',
      color: 'blue',
      employees: list.filter((e) => e.metrics.hasExceptions),
    },
    {
      id: 'hr_conflict',
      title: 'Конфликт HR ↔ календарь',
      desc: 'Формат в HR не совпадает с профилем',
      color: 'amber',
      employees: list.filter((e) => e.metrics.hrMismatch === 1),
    },
    {
      id: 'tz_conflict',
      title: 'Конфликт часового пояса',
      desc: 'Активность не совпадает с заявленным поясом',
      color: 'amber',
      employees: list.filter((e) => e.metrics.timezoneShift === 1),
    },
    {
      id: 'confirm',
      title: 'Нужно подтвердить данные',
      desc: 'Средний риск, требуется подтверждение',
      color: 'stone',
      employees: list.filter(
        (e) => e.metrics.riskLevel === 'medium'
      ),
    },
    {
      id: 'review',
      title: 'Нужно пересмотреть график',
      desc: 'Высокий или критический риск неактуальности',
      color: 'red',
      employees: list.filter(
        (e) => e.metrics.riskLevel === 'high' || e.metrics.riskLevel === 'critical'
      ),
    },
  ]
}

// ===== Конфликты =====
export function allConflicts(list = COMPUTED): Conflict[] {
  const out: Conflict[] = []
  const add = (
    e: EmployeeComputed,
    severity: Conflict['severity'],
    type: Conflict['type'],
    title: string,
    desc: string
  ) =>
    out.push({
      id: `${e.id}-${type}-${out.length}`,
      empId: e.id,
      empName: e.name,
      severity,
      type,
      title,
      desc,
    })

  for (const e of list) {
    const m = e.metrics
    if (m.workload > 1)
      add(e, 'critical', 'overload', `${e.name} — перегрузка ${(m.workload * 100).toFixed(0)}%`, `${m.busyHours}ч занятости при норме ${m.workHours}ч`)
    else if (m.workload > 0.8)
      add(e, 'warning', 'overload', `${e.name} — высокая нагрузка ${(m.workload * 100).toFixed(0)}%`, 'Близко к порогу перегрузки')

    if (m.outOfHoursRatio > 0.25)
      add(e, 'critical', 'out_of_hours', `${e.name} — встречи вне графика`, `${m.meetingsOutOfHours} из ${m.meetingsTotal} событий вне рабочего времени`)

    if (m.hrMismatch)
      add(e, 'warning', 'hr_mismatch', `${e.name} — HR ≠ профиль`, `HR: ${e.hrFormat}, профиль: ${e.format}`)

    if (m.timezoneShift)
      add(e, 'warning', 'timezone', `${e.name} — смена часового пояса`, 'Активность расходится с заявленным поясом')

    if (m.actuality < 0.6)
      add(e, 'low', 'stale_schedule', `${e.name} — устаревший график`, `Не обновлялся ${m.daysSinceUpdate} дней`)

    if (m.hasExceptions)
      add(e, 'low', 'exception_overlap', `${e.name} — активное исключение`, e.exceptions[0]?.note || 'Период отсутствия')

    // двойное бронирование
    const sorted = [...e.events].sort((a, b) => a.day - b.day || a.startHour - b.startHour)
    for (let i = 0; i < sorted.length; i++)
      for (let j = i + 1; j < sorted.length; j++) {
        if (sorted[j].day !== sorted[i].day) break
        if (sorted[j].startHour < sorted[i].endHour) {
          add(e, 'warning', 'double_booking', `${e.name} — двойное бронирование`, `«${sorted[i].title}» и «${sorted[j].title}» пересекаются`)
        }
      }
  }
  const order = { critical: 0, warning: 1, low: 2 }
  return out.sort((a, b) => order[a.severity] - order[b.severity])
}

// ===== Все рекомендации (раздел 16 ТЗ) =====
export function allRecommendations(list = COMPUTED): Recommendation[] {
  const recs = list.flatMap((e) => e.metrics.recommendations)
  const order = { high: 0, medium: 1, low: 2 }
  return recs
    .filter((r) => r.action !== 'Действий не требуется')
    .sort((a, b) => order[a.priority] - order[b.priority])
}

// ===== Умные уведомления (раздел 16 ТЗ) =====
export function smartNotifications(list = COMPUTED): Notification[] {
  const out: Notification[] = []
  for (const e of list) {
    const m = e.metrics
    const short = e.name.split(' ')[0] + ' ' + e.name.split(' ')[1][0] + '.'
    if (m.riskLevel === 'critical')
      out.push({ id: `n-${e.id}-1`, empId: e.id, who: short, text: 'обнови график — критический риск неактуальности', reason: `Ri = ${(m.integralRisk * 100).toFixed(0)}/100`, action: 'Открыть', urgent: true, category: 'risk' })
    if (m.hrMismatch)
      out.push({ id: `n-${e.id}-2`, empId: e.id, who: short, text: `подтверди формат работы (HR: ${e.hrFormat}, профиль: ${e.format})`, reason: 'Расхождение HR ↔ календарь', action: 'Решить', urgent: m.riskLevel === 'high', category: 'hr' })
    if (m.outOfHoursRatio > 0.25)
      out.push({ id: `n-${e.id}-3`, empId: e.id, who: short, text: 'рассмотри перенос встреч в рабочее окно', reason: `${(m.outOfHoursRatio * 100).toFixed(0)}% встреч вне графика`, action: 'Перенести', urgent: false, category: 'meeting' })
    if (m.actuality < 0.6 && m.riskLevel !== 'critical')
      out.push({ id: `n-${e.id}-4`, empId: e.id, who: short, text: `подтверди актуальность графика (${m.daysSinceUpdate} дн. без обновления)`, reason: `Актуальность ${(m.actuality * 100).toFixed(0)}%`, action: 'Подтвердить', urgent: false, category: 'schedule' })
  }
  return out.sort((a, b) => Number(b.urgent) - Number(a.urgent))
}

// ===== Дорожная карта актуализации (раздел 11 ТЗ) =====
export function actualizationRoadmap(list = COMPUTED): EmployeeComputed[] {
  return [...list].sort(
    (a, b) => b.metrics.actualizationPriority - a.metrics.actualizationPriority
  )
}

// ===== Сводная статистика =====
export function dashboardStats(list = COMPUTED) {
  const groups = diagnosticGroups(list)
  return {
    total: list.length,
    conflicts: allConflicts(list).length,
    critical: list.filter((e) => e.metrics.riskLevel === 'critical' || e.metrics.riskLevel === 'high').length,
    stale: groups.find((g) => g.id === 'stale')!.employees.length,
    avgActuality: Math.round(
      (list.reduce((s, e) => s + e.metrics.actuality, 0) / list.length) * 100
    ),
    avgWorkload: Math.round(
      (list.reduce((s, e) => s + e.metrics.workload, 0) / list.length) * 100
    ),
    overloaded: list.filter((e) => e.metrics.workload > 0.8).length,
  }
}
