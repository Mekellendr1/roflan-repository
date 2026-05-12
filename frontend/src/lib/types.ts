export type RiskColor = 'red' | 'amber' | 'green'

export interface Employee {
  id: string
  name: string
  initials: string
  role: string
  team: string
  tz: string
  tzShort: string
  tzOffset: number
  format: string
  schedule: string
  scheduleUpdated: number
  riskScore: number
  workload: number
  overtime: number
  conflicts: number
  color: RiskColor
  tags: string[]
}

export type ConflictSeverity = 'critical' | 'warning' | 'low'
export type ConflictType =
  | 'overload'
  | 'out_of_hours'
  | 'hr_mismatch'
  | 'double_booking'
  | 'back_to_back'
  | 'stale_schedule'
  | 'uncomfortable'

export interface Conflict {
  id: string
  severity: ConflictSeverity
  type: ConflictType
  empId: string
  title: string
  desc: string
}

export interface MeetingSlot {
  score: number
  optimal: boolean
  date: string
  time: string
  tzs: string
  reason: string
}

export interface Source {
  id: string
  name: string
  type: 'calendar' | 'hr' | 'tasks' | 'manual'
  icon: string
  status: 'active' | 'stale'
  lastSync: string
  records: number
}

export interface NotificationItem {
  id: string
  urgent: boolean
  who: string
  text: string
  action: string
}
