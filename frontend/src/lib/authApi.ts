/**
 * API-функции для авторизации и проектов.
 */

import { http } from './api'
import type { AuthUser, Project, ProjectMember, ProjectRole } from './authTypes'

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface RegisterData {
  email: string
  username: string
  password: string
  full_name?: string
}

export interface LoginData {
  username: string // email или username
  password: string
}

export async function apiRegister(data: RegisterData): Promise<AuthUser> {
  const res = await http.post('/auth/register', data)
  return res.data
}

export async function apiLogin(data: LoginData): Promise<string> {
  // OAuth2PasswordRequestForm ожидает application/x-www-form-urlencoded
  const form = new URLSearchParams()
  form.append('username', data.username)
  form.append('password', data.password)
  const res = await http.post('/auth/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return res.data.access_token
}

export async function apiGetMe(token: string): Promise<AuthUser> {
  const res = await http.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}

// ─── Projects ────────────────────────────────────────────────────────────────

function authHeader(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } }
}

export async function apiGetProjects(token: string): Promise<Project[]> {
  const res = await http.get('/projects', authHeader(token))
  return res.data
}

export async function apiCreateProject(
  token: string,
  data: { name: string; description?: string }
): Promise<Project> {
  const res = await http.post('/projects', data, authHeader(token))
  return res.data
}

export async function apiGetProject(token: string, id: string): Promise<Project> {
  const res = await http.get(`/projects/${id}`, authHeader(token))
  return res.data
}

export async function apiUpdateProject(
  token: string,
  id: string,
  data: { name?: string; description?: string }
): Promise<Project> {
  const res = await http.put(`/projects/${id}`, data, authHeader(token))
  return res.data
}

export async function apiDeleteProject(token: string, id: string): Promise<void> {
  await http.delete(`/projects/${id}`, authHeader(token))
}

export async function apiInviteMember(
  token: string,
  projectId: string,
  username_or_email: string,
  role: ProjectRole
): Promise<ProjectMember> {
  const res = await http.post(
    `/projects/${projectId}/members`,
    { username_or_email, role },
    authHeader(token)
  )
  return res.data
}

export async function apiUpdateMemberRole(
  token: string,
  projectId: string,
  memberId: string,
  role: ProjectRole
): Promise<ProjectMember> {
  const res = await http.put(
    `/projects/${projectId}/members/${memberId}`,
    { role },
    authHeader(token)
  )
  return res.data
}

export async function apiRemoveMember(
  token: string,
  projectId: string,
  memberId: string
): Promise<void> {
  await http.delete(`/projects/${projectId}/members/${memberId}`, authHeader(token))
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface ProfileSetupData {
  role: string
  team: string
  timezone: string
  work_format: string
  work_start: number
  work_end: number
  schedule_days?: string
}

export async function apiSetupProfile(token: string, data: ProfileSetupData): Promise<any> {
  const res = await http.post('/profile/setup', data, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}

export async function apiGetMyProfile(token: string): Promise<any> {
  const res = await http.get('/profile/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}

export async function apiUpdateMyProfile(token: string, data: Partial<ProfileSetupData>): Promise<any> {
  const res = await http.put('/profile/me', data, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}
