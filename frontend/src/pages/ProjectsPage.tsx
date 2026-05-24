/**
 * Страница списка проектов.
 */

import { useEffect, useState } from 'react'
import { useAuth } from '../lib/authContext'
import { apiGetProjects, apiCreateProject, apiDeleteProject } from '../lib/authApi'
import type { Project } from '../lib/authTypes'
import Icon from '../components/Icon'

interface ProjectsPageProps {
  setRoute: (r: string) => void
}

export default function ProjectsPage({ setRoute }: ProjectsPageProps) {
  const { token } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    apiGetProjects(token)
      .then(setProjects)
      .catch(() => setError('Не удалось загрузить проекты'))
      .finally(() => setLoading(false))
  }, [token])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !newName.trim()) return
    setCreating(true)
    try {
      const p = await apiCreateProject(token, { name: newName.trim(), description: newDesc.trim() })
      setProjects((prev) => [p, ...prev])
      setShowCreate(false)
      setNewName('')
      setNewDesc('')
    } catch {
      setError('Не удалось создать проект')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    if (!token) return
    if (!window.confirm('Удалить проект?')) return
    try {
      await apiDeleteProject(token, id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch {
      setError('Не удалось удалить проект')
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Проекты</h1>
          <p className="text-sm text-stone-500 mt-0.5">Создавайте проекты и приглашайте участников</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors"
        >
          <Icon name="plus" className="w-4 h-4" />
          Новый проект
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-stone-400 text-sm py-16 text-center">Загрузка...</div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center">
            <Icon name="road" className="w-8 h-8 text-stone-400" />
          </div>
          <div>
            <p className="font-semibold text-stone-700">Нет проектов</p>
            <p className="text-sm text-stone-400 mt-1">Создайте первый проект и пригласите команду</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-2 px-4 py-2 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors"
          >
            Создать проект
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-stone-200 rounded-2xl p-5 hover:border-stone-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => { localStorage.setItem('wt_last_project', p.id); setRoute(`project/${p.id}`) }}
                    className="font-semibold text-stone-900 hover:text-stone-600 transition-colors text-left text-lg leading-tight"
                  >
                    {p.name}
                  </button>
                  {p.description && (
                    <p className="text-sm text-stone-500 mt-1 leading-relaxed">{p.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-stone-400">
                      <Icon name="users" className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                      {p.members.length + 1} участник{p.members.length === 0 ? '' : p.members.length < 4 ? 'а' : 'ов'}
                    </span>
                    <span className="text-xs text-stone-400">
                      Создан {new Date(p.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => { localStorage.setItem('wt_last_project', p.id); setRoute(`project/${p.id}`) }}
                    className="px-3 py-1.5 text-xs font-semibold bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
                  >
                    Открыть
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-stone-200 flex items-center justify-between">
              <h2 className="font-bold text-stone-900 text-lg">Новый проект</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <Icon name="close" className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                  Название *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  placeholder="Мой проект"
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                  Описание
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  placeholder="Краткое описание проекта..."
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 border border-stone-200 text-stone-700 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 disabled:opacity-50 transition-colors"
                >
                  {creating ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
