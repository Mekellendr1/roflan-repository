import type { UserRole } from './types'

const ALL = [
  'dashboard', 'analytics', 'employees', 'diagnostics',
  'map', 'meeting', 'conflicts', 'recommendations',
  'roadmap', 'notifications', 'sources',
]

export const ROLE_ACCESS: Record<ProjectRole, string[]> = {
  Администратор: ALL,
  Руководитель: ['dashboard', 'analytics', 'employees', 'diagnostics', 'map', 'meeting', 'conflicts', 'recommendations', 'roadmap', 'notifications'],
  'HR-специалист': ['dashboard', 'employees', 'diagnostics', 'conflicts', 'recommendations', 'roadmap', 'notifications', 'sources'],
  'Проектный менеджер': ['dashboard', 'employees', 'map', 'meeting', 'conflicts', 'recommendations'],
  Аналитик: ['dashboard', 'analytics', 'employees', 'diagnostics', 'conflicts', 'roadmap'],
  Сотрудник: ['dashboard', 'employees', 'notifications'],
}

export type ProjectRole = 'Администратор' | 'Руководитель' | 'HR-специалист' | 'Проектный менеджер' | 'Аналитик' | 'Сотрудник'

export const ALL_ROLES: ProjectRole[] = [
  'Администратор', 'Руководитель', 'HR-специалист', 'Проектный менеджер', 'Аналитик', 'Сотрудник',
]
