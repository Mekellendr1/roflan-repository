import { useEffect, useState } from 'react'
import { useAuth } from '../lib/authContext'
import { apiGetProject, apiInviteMember, apiUpdateMemberRole, apiRemoveMember, apiUpdateProject } from '../lib/authApi'
import { ALL_ROLES } from '../lib/roles'
import type { Project, ProjectMember, ProjectRole } from '../lib/authTypes'
import Icon from '../components/Icon'

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
  const { token, user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showInvite, setShowInvite] = useState(false)
  const [inviteInput, setInviteInput] = useState('')
  const [inviteRole, setInviteRole] = useState<ProjectRole>('Сотрудник')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

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
        // Определяем роль текущего пользователя
        const myMember = p.members.find((m) => m.user_id === user?.id)
        // Если пользователь владелец проекта — он Администратор
        const role: ProjectRole = myMember?.role ?? 'Администратор'
        onProjectLoaded?.(p.name, role)
      })
      .catch(() => setError('Проект не найден или нет доступа'))
      .finally(() => setLoading(false))
  }, [token, projectId])

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

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !project || !inviteInput.trim()) return
    setInviting(true)
    setInviteError(null)
    try {
      const member = await apiInviteMember(token, project.id, inviteInput.trim(), inviteRole)
      setProject((p) => p ? { ...p, members: [...p.members, member] } : p)
      setInviteInput('')
      setShowInvite(false)
      onMembersChanged?.()
    } catch (err: any) {
      setInviteError(err?.response?.data?.detail || 'Ошибка')
    } finally {
      setInviting(false)
    }
  }

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
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !project) return
    setSaving(true)
    try {
      const updated = await apiUpdateProject(token, project.id, { name: editName, description: editDesc })
      setProject(updated)
      setShowEdit(false)
    } catch {} finally {
      setSaving(false)
    }
  }

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
            </button>
          </div>
        )}
      </div>

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
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
