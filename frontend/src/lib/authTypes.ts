<<<<<<< HEAD
=======
/**
 * Типы для системы авторизации и проектов.
 */

>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
export interface AuthUser {
  id: string
  email: string
  username: string
  full_name: string
<<<<<<< HEAD
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
=======
  created_at: string
}

export type ProjectRole = UserRole | 'owner'
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5

export interface ProjectMember {
  id: string
  user_id: string
  username: string
  full_name: string
  email: string
  role: ProjectRole
<<<<<<< HEAD
  profile_filled: boolean
=======
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
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
