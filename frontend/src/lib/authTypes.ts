export interface AuthUser {
  id: string
  email: string
  username: string
  full_name: string
  profile_filled: boolean
  created_at: string
}

// Роли в проекте — без "owner", вместо него Администратор
export type ProjectRole =
  | 'Администратор'
  | 'Руководитель'
  | 'HR-специалист'
  | 'Проектный менеджер'
  | 'Аналитик'
  | 'Сотрудник'

export interface ProjectMember {
  id: string
  user_id: string
  username: string
  full_name: string
  email: string
  role: ProjectRole
  profile_filled: boolean
  invited_at: string
}

export interface Project {
  id: string
  name: string
  description: string
  owner_id: string
  created_at: string
  members: ProjectMember[]
}
