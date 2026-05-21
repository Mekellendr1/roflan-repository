/**
 * Типы для системы авторизации и проектов.
 */

export interface AuthUser {
  id: string
  email: string
  username: string
  full_name: string
  created_at: string
}

export type ProjectRole = UserRole | 'owner'

export interface ProjectMember {
  id: string
  user_id: string
  username: string
  full_name: string
  email: string
  role: ProjectRole
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
