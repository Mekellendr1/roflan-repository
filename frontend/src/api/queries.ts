import { api } from './client'
import type {
  Conflict,
  ConflictSeverity,
  ConflictType,
  Employee,
  MeetingSlot,
  NotificationItem,
  Source,
} from '../lib/types'

// ============ EMPLOYEES ============

export async function getEmployees(filters?: {
  team?: string
  tz?: string
}): Promise<Employee[]> {
  const params: Record<string, string> = {}
  if (filters?.team && filters.team !== 'all') params.team = filters.team
  if (filters?.tz && filters.tz !== 'all') params.tz = filters.tz
  const { data } = await api.get('/employees', { params })
  return data
}

export interface EmployeeDetail extends Employee {
  risk_history: number[]
  active_conflicts: Conflict[]
}

export async function getEmployeeDetail(id: string): Promise<EmployeeDetail> {
  const { data } = await api.get(`/employees/${id}`)
  return data
}

// ============ CONFLICTS ============

export async function getConflicts(filters?: {
  severity?: ConflictSeverity | 'all'
  type?: ConflictType | 'all'
}): Promise<Conflict[]> {
  const params: Record<string, string> = {}
  if (filters?.severity && filters.severity !== 'all') params.severity = filters.severity
  if (filters?.type && filters.type !== 'all') params.type = filters.type
  const { data } = await api.get('/conflicts', { params })
  return data
}

export interface RecalculateResult {
  conflicts_found: number
  employees_processed: number
  duration_ms: number
}

export async function recalculate(): Promise<RecalculateResult> {
  const { data } = await api.post('/recalculate')
  return data
}

// ============ AVAILABILITY ============

export interface AvailabilityCell {
  hour: number
  state: 'off' | 'free' | 'busy' | 'all'
}

export interface AvailabilityRow {
  employee_id: string
  employee_name: string
  tz_short: string
  cells: AvailabilityCell[]
}

export interface AvailabilityResponse {
  date: string
  hours: number[]
  rows: AvailabilityRow[]
  recommendation: {
    hour: number
    time: string
    score: number
    reason: string
  } | null
}

export async function getAvailability(
  employeeIds: string[],
  targetDate?: string,
  viewerTz: string = 'Europe/Moscow'
): Promise<AvailabilityResponse> {
  const params: Record<string, string> = {
    employee_ids: employeeIds.join(','),
    viewer_tz: viewerTz,
  }
  if (targetDate) params.target_date = targetDate
  const { data } = await api.get('/availability', { params })
  return data
}

// ============ MEETING FINDER ============

export interface MeetingRequest {
  employee_ids: string[]
  duration_minutes: number
  window_days?: number
  priority?: 'comfort' | 'asap' | 'no_overtime'
}

export async function suggestMeetingTime(request: MeetingRequest): Promise<MeetingSlot[]> {
  const { data } = await api.post('/meetings/suggest-time', request)
  return data
}

// ============ SOURCES & NOTIFICATIONS ============

export async function getSources(): Promise<Source[]> {
  const { data } = await api.get('/sources')
  return data
}

export async function getNotifications(): Promise<NotificationItem[]> {
  const { data } = await api.get('/notifications')
  return data
}

// ============ STATS ============

export interface DashboardStats {
  conflicts: number
  at_risk: number
  avg_load: number
  stale: number
}

export async function getStats(): Promise<DashboardStats> {
  const { data } = await api.get('/stats')
  return data
}
