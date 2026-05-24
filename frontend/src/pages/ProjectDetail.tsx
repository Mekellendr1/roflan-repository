<<<<<<< HEAD
import { useEffect, useState } from 'react'
import { useAuth } from '../lib/authContext'
import { apiGetProject, apiInviteMember, apiUpdateMemberRole, apiRemoveMember, apiUpdateProject } from '../lib/authApi'
=======
/**
 * Страница конкретного проекта — детали, участники, приглашение.
 */

import { useEffect, useState } from 'react'
import { useAuth } from '../lib/authContext'
import {
  apiGetProject,
  apiInviteMember,
  apiUpdateMemberRole,
  apiRemoveMember,
  apiUpdateProject,
} from '../lib/authApi'
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
import { ALL_ROLES } from '../lib/roles'
import type { Project, ProjectMember, ProjectRole } from '../lib/authTypes'
import Icon from '../components/Icon'

<<<<<<< HEAD
interface Props {
  projectId: string
  setRoute: (r: string) => void
  onBack?: () => void
  onProjectLoaded?: (name: string, role: ProjectRole) => void
  onMembersChanged?: () => void
}

const ROLE_COLORS: Record<ProjectRole, string> = {
  Администратор:       'bg-purple-100 text-purple-800',
  Руководитель:        'bg-indigo-100 text-indigo-800',
  'HR-специалист':     'bg-sky-100 text-sky-800',
  'Проектный менеджер':'bg-emerald-100 text-emerald-800',
  Аналитик:            'bg-blue-100 text-blue-800',
  Сотрудник:           'bg-stone-100 text-stone-600',
}

export default function ProjectDetail({ projectId, setRoute, onBack, onProjectLoaded, onMembersChanged }: Props) {
=======
interface ProjectDetailProps {
  projectId: string
  setRoute: (r: string) => void
  onProjectLoaded?: (name: string, role: ProjectRole) => void
}

const ROLE_LABELS: Record<ProjectRole, string> = {
  owner: 'Владелец',
  Администратор: 'Администратор',
  Руководитель: 'Руководитель',
  'HR-специалист': 'HR-специалист',
  'Проектный менеджер': 'Проектный менеджер',
  Аналитик: 'Аналитик',
  Сотрудник: 'Сотрудник',
}

const ROLE_COLORS: Record<ProjectRole, string> = {
  owner: 'bg-amber-100 text-amber-800',
  Администратор: 'bg-purple-100 text-purple-800',
  Руководитель: 'bg-indigo-100 text-indigo-800',
  'HR-специалист': 'bg-sky-100 text-sky-800',
  'Проектный менеджер': 'bg-emerald-100 text-emerald-800',
  Аналитик: 'bg-blue-100 text-blue-800',
  Сотрудник: 'bg-stone-100 text-stone-600',
}

export default function ProjectDetail({ projectId, setRoute, onProjectLoaded }: ProjectDetailProps) {
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
  const { token, user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

<<<<<<< HEAD
=======
  // invite modal
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
  const [showInvite, setShowInvite] = useState(false)
  const [inviteInput, setInviteInput] = useState('')
  const [inviteRole, setInviteRole] = useState<ProjectRole>('Сотрудник')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

<<<<<<< HEAD
=======
  // edit modal
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
  const [showEdit, setShowEdit] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    apiGetProject(token, projectId)
      .then((p) => {
        setProject(p)
        setEditName(p.name)
        setEditDesc(p.description)
        localStorage.setItem('wt_last_project', p.id)
<<<<<<< HEAD
        // Определяем роль текущего пользователя
        const myMember = p.members.find((m) => m.user_id === user?.id)
        // Если пользователь владелец проекта — он Администратор
        const role: ProjectRole = myMember?.role ?? 'Администратор'
        onProjectLoaded?.(p.name, role)
=======
        onProjectLoaded?.(p.name, p.owner_id === user?.id ? 'owner' : (p.members.find((m) => m.user_id === user?.id)?.role as ProjectRole) ?? 'Сотрудник')
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
      })
      .catch(() => setError('Проект не найден или нет доступа'))
      .finally(() => setLoading(false))
  }, [token, projectId])

<<<<<<< HEAD
  const isAdmin = project && user && (
    project.owner_id === user.id ||
    project.members.some((m) => m.user_id === user.id && m.role === 'Администратор')
  )

  // Все участники включая владельца
  const allMembers: (ProjectMember & { isOwner?: boolean })[] = project
    ? [
        // Владелец всегда первым если не в members
        ...(project.members.some(m => m.user_id === project.owner_id)
          ? []
          : [{
              id: 'owner',
              user_id: project.owner_id,
              username: '',
              full_name: '',
              email: '',
              role: 'Администратор' as ProjectRole,
              profile_filled: true,
              invited_at: project.created_at,
              isOwner: true,
            }]),
        ...project.members,
      ]
    : []
=======
  const currentUserRole: ProjectRole | null = project
    ? project.owner_id === user?.id
      ? 'owner'
      : project.members.find((m) => m.user_id === user?.id)?.role ?? null
    : null

  const isOwnerOrAdmin =
    project &&
    user &&
    (project.owner_id === user.id ||
      project.members.some((m) => m.user_id === user.id && m.role === 'Администратор'))
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !project || !inviteInput.trim()) return
    setInviting(true)
    setInviteError(null)
    try {
<<<<<<< HEAD
      const member = await apiInviteMember(token, project.id, inviteInput.trim(), inviteRole)
      setProject((p) => p ? { ...p, members: [...p.members, member] } : p)
      setInviteInput('')
      setShowInvite(false)
      onMembersChanged?.()
    } catch (err: any) {
      setInviteError(err?.response?.data?.detail || 'Ошибка')
=======
      const member = await apiInviteMember(
        token,
        project.id,
        inviteInput.trim(),
        inviteRole
      )
      setProject((prev) =>
        prev ? { ...prev, members: [...prev.members, member] } : prev
      )
      setInviteInput('')
      setInviteRole('Сотрудник')
      setShowInvite(false)
    } catch (e: unknown) {
      setInviteError(
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          'Не удалось пригласить пользователя'
      )
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
    } finally {
      setInviting(false)
    }
  }

<<<<<<< HEAD
  async function handleRoleChange(memberId: string, newRole: ProjectRole) {
    if (!token || !project) return
    // Нельзя понизить последнего Администратора
    if (newRole !== 'Администратор') {
      const member = project.members.find((m) => m.id === memberId)
      if (member?.role === 'Администратор') {
        const adminCount = project.members.filter((m) => m.role === 'Администратор').length
        if (adminCount <= 1) {
          alert('Нельзя изменить роль последнего Администратора')
          return
        }
      }
    }
    try {
      const updated = await apiUpdateMemberRole(token, project.id, memberId, newRole)
      setProject((p) => p ? { ...p, members: p.members.map((m) => m.id === memberId ? updated : m) } : p)
    } catch {}
  }

  async function handleRemove(memberId: string) {
    if (!token || !project) return
    // Не удалять если это последний Администратор
    const member = project.members.find((m) => m.id === memberId)
    if (member?.role === 'Администратор') {
      const adminCount = project.members.filter((m) => m.role === 'Администратор').length
      if (adminCount <= 1) {
        alert('Нельзя удалить последнего Администратора проекта')
        return
      }
    }
    try {
      await apiRemoveMember(token, project.id, memberId)
      setProject((p) => p ? { ...p, members: p.members.filter((m) => m.id !== memberId) } : p)
      onMembersChanged?.()
    } catch {}
=======
  async function handleRoleChange(member: ProjectMember, role: ProjectRole) {
    if (!token || !project) return
    try {
      const updated = await apiUpdateMemberRole(token, project.id, member.id, role)
      setProject((prev) =>
        prev
          ? { ...prev, members: prev.members.map((m) => (m.id === updated.id ? updated : m)) }
          : prev
      )
    } catch {
      setError('Не удалось изменить роль')
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!token || !project) return
    if (!window.confirm('Удалить участника из проекта?')) return
    try {
      await apiRemoveMember(token, project.id, memberId)
      setProject((prev) =>
        prev ? { ...prev, members: prev.members.filter((m) => m.id !== memberId) } : prev
      )
    } catch {
      setError('Не удалось удалить участника')
    }
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !project) return
    setSaving(true)
    try {
<<<<<<< HEAD
      const updated = await apiUpdateProject(token, project.id, { name: editName, description: editDesc })
      setProject(updated)
      setShowEdit(false)
    } catch {} finally {
=======
      const updated = await apiUpdateProject(token, project.id, {
        name: editName.trim(),
        description: editDesc.trim(),
      })
      setProject((prev) => (prev ? { ...prev, ...updated } : prev))
      setShowEdit(false)
    } catch {
      setError('Не удалось сохранить изменения')
    } finally {
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
      setSaving(false)
    }
  }

<<<<<<< HEAD
  if (loading) return <div className="flex items-center justify-center h-64 text-stone-400">Загрузка...</div>
  if (error) return <div className="flex items-center justify-center h-64 text-red-500">{error}</div>
  if (!project) return null

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{project.name}</h1>
          <p className="text-stone-500 text-sm mt-1 max-w-lg">{project.description}</p>
          <p className="text-xs text-stone-400 mt-2">
            Создан {new Date(project.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-stone-200 rounded-lg hover:bg-stone-50 transition cursor-pointer"
            >
              <Icon name="edit" className="w-4 h-4" /> Изменить
            </button>
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-stone-900 text-white rounded-lg hover:bg-stone-700 transition cursor-pointer"
            >
              <Icon name="plus" className="w-4 h-4" /> Пригласить
=======
  if (loading) {
    return (
      <div className="p-8 text-stone-400 text-sm">Загрузка...</div>
    )
  }

  if (error || !project) {
    return (
      <div className="p-8">
        <button
          onClick={() => setRoute('projects')}
          className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 mb-6"
        >
          <Icon name="back" className="w-4 h-4" />
          Назад к проектам
        </button>
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error || 'Проект не найден'}
        </div>
      </div>
    )
  }

  // Build combined participants list: owner + members
  const ownerEntry: ProjectMember = {
    id: '__owner__',
    user_id: project.owner_id,
    username: '—',
    full_name: '—',
    email: '—',
    role: 'owner',
    invited_at: project.created_at,
  }

  // Find owner info from members (if owner is also listed) or fallback
  const ownerMember = project.members.find((m) => m.user_id === project.owner_id)
  const ownerDisplay: ProjectMember = ownerMember
    ? { ...ownerMember, role: 'owner' }
    : user && user.id === project.owner_id
    ? { ...ownerEntry, username: user.username, full_name: user.full_name, email: user.email }
    : ownerEntry

  const nonOwnerMembers = project.members.filter((m) => m.user_id !== project.owner_id)
  const allParticipants = [ownerDisplay, ...nonOwnerMembers]

  function initials(name: string) {
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={() => setRoute('projects')}
        className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 mb-6 transition-colors"
      >
        <Icon name="back" className="w-4 h-4" />
        Все проекты
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-stone-900 leading-tight">{project.name}</h1>
          {project.description && (
            <p className="text-stone-500 mt-1.5 leading-relaxed">{project.description}</p>
          )}
          <p className="text-xs text-stone-400 mt-2">
            Создан {new Date(project.created_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {isOwnerOrAdmin && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-stone-100 text-stone-700 rounded-xl hover:bg-stone-200 transition-colors"
            >
              <Icon name="edit" className="w-3.5 h-3.5" />
              Изменить
            </button>
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors"
            >
              <Icon name="plus" className="w-3.5 h-3.5" />
              Пригласить
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
            </button>
          </div>
        )}
      </div>

<<<<<<< HEAD
      {/* Members */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100 flex items-center gap-2">
          <span className="font-semibold text-stone-800 text-sm">Участники</span>
          <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-mono">
            {allMembers.length}
          </span>
        </div>
        <div className="divide-y divide-stone-100">
          {allMembers.map((m) => {
            const isMe = m.user_id === user?.id
            const isOwnerRow = project.owner_id === m.user_id
            return (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-stone-800 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {(m.full_name || m.username || '?').slice(0, 2).toUpperCase()}
                </div>
                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-stone-900 truncate">
                      {m.full_name || m.username}
                      {isMe && <span className="ml-1 text-xs text-stone-400 font-normal">Вы</span>}
                    </p>
                    {/* Профиль не заполнен */}
                    {m.profile_filled === false && (
                      <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        профиль не заполнен
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 truncate">{m.email || m.username}</p>
                </div>
                {/* Role */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isAdmin && !isOwnerRow && !isMe ? (
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value as ProjectRole)}
                      className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white cursor-pointer"
                    >
                      {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : (
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${ROLE_COLORS[m.role as ProjectRole] ?? 'bg-stone-100 text-stone-600'}`}>
                      {m.role}
                    </span>
                  )}
                  {isAdmin && !isOwnerRow && !isMe && (
                    <button
                      onClick={() => handleRemove(m.id)}
                      className="p-1 text-stone-300 hover:text-red-500 transition cursor-pointer"
=======
      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Members */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-semibold text-stone-900">
            Участники
            <span className="ml-2 text-xs font-normal text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
              {allParticipants.length}
            </span>
          </h2>
        </div>

        <div className="divide-y divide-stone-100">
          {allParticipants.map((member) => {
            const isOwner = member.role === 'owner'
            const isCurrentUser = user && member.user_id === user.id
            const displayName = member.full_name || member.username
            const canManage = isOwnerOrAdmin && !isOwner && !isCurrentUser

            return (
              <div key={member.id} className="flex items-center gap-4 px-6 py-4">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {initials(displayName)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-stone-900 truncate">{displayName}</p>
                    {isCurrentUser && (
                      <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded font-medium">
                        Вы
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 truncate">{member.email || member.username}</p>
                </div>

                {/* Role */}
                <div className="flex items-center gap-2 shrink-0">
                  {canManage ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member, e.target.value as ProjectRole)}
                      className="text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-stone-300"
                    >
                      {ALL_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLORS[member.role]}`}>
                      {ROLE_LABELS[member.role]}
                    </span>
                  )}

                  {canManage && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Удалить участника"
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
                    >
                      <Icon name="trash" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

<<<<<<< HEAD
      {/* Open project button */}
      <button
        onClick={() => setRoute('dashboard')}
        className="mt-4 w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition cursor-pointer"
      >
        Открыть проект →
      </button>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowInvite(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-stone-900 mb-4">Пригласить участника</h3>
            <form onSubmit={handleInvite} className="space-y-3">
              <input
                type="text"
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                placeholder="Имя пользователя или email"
                autoFocus
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as ProjectRole)}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white"
              >
                {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {inviteError && <p className="text-xs text-red-600">{inviteError}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowInvite(false)}
                  className="flex-1 py-2 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 cursor-pointer">
                  Отмена
                </button>
                <button type="submit" disabled={inviting}
                  className="flex-1 py-2 bg-stone-900 text-white rounded-lg text-sm font-semibold hover:bg-stone-700 disabled:opacity-50 cursor-pointer">
                  {inviting ? '...' : 'Добавить'}
=======
      {/* Role legend */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.keys(ROLE_LABELS) as ProjectRole[]).map((r) => (
          <div key={r} className="bg-white border border-stone-200 rounded-xl px-3 py-2.5">
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1.5 ${ROLE_COLORS[r]}`}>
              {ROLE_LABELS[r]}
            </span>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              {r === 'owner' && 'Полный доступ ко всем разделам системы и управление проектом'}
              {r === 'Администратор' && 'Полный доступ ко всем разделам'}
              {r === 'Руководитель' && 'Почти все разделы, кроме Источников'}
              {r === 'HR-специалист' && 'Dashboard, сотрудники, диагностика, конфликты, рекомендации, дорожная карта, уведомления, источники'}
              {r === 'Проектный менеджер' && 'Dashboard, сотрудники, карта, подбор времени, конфликты, рекомендации'}
              {r === 'Аналитик' && 'Dashboard, аналитика, сотрудники, диагностика, конфликты, дорожная карта'}
              {r === 'Сотрудник' && 'Dashboard, сотрудники, уведомления'}
            </p>
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-stone-200 flex items-center justify-between">
              <h2 className="font-bold text-stone-900 text-lg">Пригласить участника</h2>
              <button
                onClick={() => { setShowInvite(false); setInviteError(null) }}
                className="text-stone-400 hover:text-stone-600"
              >
                <Icon name="close" className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              {inviteError && (
                <div className="px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {inviteError}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                  Email или имя пользователя
                </label>
                <input
                  type="text"
                  value={inviteInput}
                  onChange={(e) => setInviteInput(e.target.value)}
                  required
                  placeholder="user@example.com или username"
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                  Роль участника
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as ProjectRole)}
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50"
                >
                  {ALL_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowInvite(false); setInviteError(null) }}
                  className="flex-1 py-2.5 border border-stone-200 text-stone-700 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 disabled:opacity-50 transition-colors"
                >
                  {inviting ? 'Отправка...' : 'Пригласить'}
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

<<<<<<< HEAD
      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowEdit(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-stone-900 mb-4">Редактировать проект</h3>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                placeholder="Название" className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Описание" rows={3}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowEdit(false)}
                  className="flex-1 py-2 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 cursor-pointer">
                  Отмена
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 bg-stone-900 text-white rounded-lg text-sm font-semibold hover:bg-stone-700 disabled:opacity-50 cursor-pointer">
                  {saving ? '...' : 'Сохранить'}
=======
      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-stone-200 flex items-center justify-between">
              <h2 className="font-bold text-stone-900 text-lg">Редактировать проект</h2>
              <button
                onClick={() => setShowEdit(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <Icon name="close" className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                  Название *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                  Описание
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="flex-1 py-2.5 border border-stone-200 text-stone-700 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Сохранение...' : 'Сохранить'}
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
