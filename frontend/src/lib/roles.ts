import type { UserRole } from './types'

// Все разделы
const ALL = [
  'dashboard',
  'analytics',
  'employees',
  'diagnostics',
  'map',
  'meeting',
  'conflicts',
  'recommendations',
  'roadmap',
  'notifications',
  'sources',
]

// Доступ по ролям (раздел 12 ТЗ).
// Администратор — всё. Остальные — по зоне ответственности.
export const ROLE_ACCESS: Record<UserRole | 'owner', string[]> = {
  owner: ALL,
  Администратор: ALL,
  Руководитель: [
    'dashboard',
    'analytics',
    'employees',
    'diagnostics',
    'map',
    'meeting',
    'conflicts',
    'recommendations',
    'roadmap',
    'notifications',
  ],
  'HR-специалист': [
    'dashboard',
    'employees',
    'diagnostics',
    'conflicts',
    'recommendations',
    'roadmap',
    'notifications',
    'sources',
  ],
  'Проектный менеджер': [
    'dashboard',
    'employees',
    'map',
    'meeting',
    'conflicts',
    'recommendations',
  ],
  Аналитик: [
    'dashboard',
    'analytics',
    'employees',
    'diagnostics',
    'conflicts',
    'roadmap',
  ],
  Сотрудник: ['dashboard', 'employees', 'notifications'],
}

export const ALL_ROLES: UserRole[] = [
  'Администратор',
  'Руководитель',
  'HR-специалист',
  'Проектный менеджер',
  'Аналитик',
  'Сотрудник',
]
