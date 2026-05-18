// Модель данных рабочего времени из ТЗ:
// Wi = (ei, si, ti, zi, fi, ai, ui)

export type WorkFormat = 'Офис' | 'Удалёнка' | 'Гибрид'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface WorkSchedule {
  // si — стандартный рабочий график
  days: number[] // 0=Пн ... 6=Вс
  startHour: number // локальные часы сотрудника
  endHour: number
}

export type ExceptionType = 'vacation' | 'sick' | 'business_trip' | 'personal'

export interface TimeException {
  // ai — отсутствия / исключения
  id: string
  type: ExceptionType
  startDate: string // ISO
  endDate: string
  note?: string
  source: string
}

export type EventType = 'meeting' | 'task' | 'focus' | 'recurring'

export interface CalendarEvent {
  // fi — фактические календарные события
  id: string
  title: string
  day: number // 0..6 (день недели в демо-неделе)
  startHour: number // локальные часы сотрудника
  endHour: number
  type: EventType
  source: string
}

export type UserRole =
  | 'Администратор'
  | 'Руководитель'
  | 'HR-специалист'
  | 'Проектный менеджер'
  | 'Аналитик'
  | 'Сотрудник'

export interface HistoryEntry {
  // история изменений рабочего времени (раздел 3, проблема №11 ТЗ)
  id: string
  date: string // ISO
  action: string
  detail: string
  riskAt: number // снимок Ri на момент изменения (0..1)
}

export interface Employee {
  // ei
  id: string
  name: string
  initials: string
  role: string
  team: string
  // ti
  timezone: string
  tzShort: string
  tzOffset: number
  // zi
  format: WorkFormat
  hrFormat: WorkFormat // что записано в HR (может расходиться)
  // si
  schedule: WorkSchedule
  // ui — дата последнего обновления (ISO)
  lastUpdate: string
  // fi
  events: CalendarEvent[]
  // ai
  exceptions: TimeException[]
  // признак фактического часового пояса по активности (для Zi)
  activityTimezoneShift: boolean
  // история изменений (раздел 3 ТЗ)
  history?: HistoryEntry[]
}

// Рассчитанные показатели (раздел 14 ТЗ)
export interface EmployeeMetrics {
  daysSinceUpdate: number // di
  actuality: number // Ai = 1 - di/D
  outOfHoursRatio: number // Ci = Mout/Mall
  conflictCount: number
  workload: number // Li = Hbusy/Hwork
  hasExceptions: boolean
  timezoneShift: number // Zi (0/1)
  hrMismatch: number // Hi (0/1)
  integralRisk: number // Ri 0..1
  riskLevel: RiskLevel
  recommendations: Recommendation[]
  actualizationPriority: number // 0..100, для дорожной карты
  busyHours: number
  workHours: number
  meetingsTotal: number
  meetingsOutOfHours: number
}

export interface EmployeeComputed extends Employee {
  metrics: EmployeeMetrics
}

export interface Recommendation {
  id: string
  empId: string
  empName: string
  action: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  category: 'schedule' | 'meeting' | 'workload' | 'timezone' | 'hr'
}

export type ConflictType =
  | 'out_of_hours'
  | 'double_booking'
  | 'hr_mismatch'
  | 'overload'
  | 'back_to_back'
  | 'timezone'
  | 'stale_schedule'
  | 'exception_overlap'

export interface Conflict {
  id: string
  empId: string
  empName: string
  severity: 'critical' | 'warning' | 'low'
  type: ConflictType
  title: string
  desc: string
}

export interface DataSource {
  id: string
  name: string
  type: 'calendar' | 'hr' | 'tasks' | 'timesheet' | 'manual'
  icon: string
  status: 'active' | 'stale' | 'error'
  lastSync: string
  records: number
}

export interface Notification {
  id: string
  empId?: string
  who: string
  text: string
  reason: string
  action: string
  urgent: boolean
  category: string
}

export interface DiagnosticGroup {
  id: string
  title: string
  desc: string
  color: 'red' | 'amber' | 'green' | 'blue' | 'stone'
  employees: EmployeeComputed[]
}

export interface MeetingSlot {
  score: number
  optimal: boolean
  day: string
  time: string
  tzs: string
  reason: string
  availableCount: number
  totalCount: number
}
