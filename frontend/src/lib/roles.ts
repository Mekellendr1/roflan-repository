import type { UserRole } from './types'

const ALL = [
  'dashboard', 'analytics', 'employees', 'diagnostics',
  'map', 'meeting', 'conflicts', 'recommendations',
  'roadmap', 'notifications', 'sources', 'events',
]

export const ROLE_ACCESS: Record<ProjectRole, string[]> = {
  Администратор: ALL,
  Руководитель: ['dashboard', 'analytics', 'employees', 'diagnostics', 'map', 'meeting', 'conflicts', 'recommendations', 'roadmap', 'notifications', 'events'],
  'HR-специалист': ['dashboard', 'employees', 'diagnostics', 'conflicts', 'recommendations', 'roadmap', 'notifications', 'sources', 'events'],
  'Проектный менеджер': ['dashboard', 'employees', 'map', 'meeting', 'conflicts', 'recommendations', 'events'],
  Аналитик: ['dashboard', 'analytics', 'employees', 'diagnostics', 'conflicts', 'roadmap', 'events'],
  Сотрудник: ['dashboard', 'employees', 'notifications', 'events'],
}

export type ProjectRole = 'Администратор' | 'Руководитель' | 'HR-специалист' | 'Проектный менеджер' | 'Аналитик' | 'Сотрудник'

export const ALL_ROLES: ProjectRole[] = [
  'Администратор', 'Руководитель', 'HR-специалист', 'Проектный менеджер', 'Аналитик', 'Сотрудник',
]
