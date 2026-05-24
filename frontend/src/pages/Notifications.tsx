<<<<<<< HEAD
/**
 * Уведомления.
 * - Администратор / Руководитель / HR / PM / Аналитик — видят уведомления по всей команде
 * - Сотрудник — видит только свои уведомления (о своём профиле)
 */

import { useState } from 'react'
import { smartNotifications, myNotifications, getMyEmployee } from '../lib/derived'
import { useAuth } from '../lib/authContext'
import { Badge } from '../components/Primitives'
import Icon from '../components/Icon'
import TopBar from '../components/TopBar'
import type { ProjectRole } from '../lib/authTypes'
=======
import { useState } from 'react'
import { smartNotifications } from '../lib/derived'
import { Badge } from '../components/Primitives'
import Icon from '../components/Icon'
import TopBar from '../components/TopBar'
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5

const CAT_LABEL: Record<string, string> = {
  risk: 'Риск',
  hr: 'HR',
  meeting: 'Встречи',
  schedule: 'График',
}

export default function Notifications({
  setRoute,
<<<<<<< HEAD
  currentRole,
}: {
  setRoute: (r: string) => void
  currentRole?: ProjectRole | null
}) {
  const { user } = useAuth()
  const [filter, setFilter] = useState<'all' | 'urgent'>('all')

  // Сотрудник видит только свои уведомления
  const isEmployee = currentRole === 'Сотрудник'
  const myEmp = user ? getMyEmployee(user.id) : undefined

  const all = isEmployee && myEmp
    ? myNotifications(myEmp.id)
    : smartNotifications()

  const list = filter === 'urgent' ? all.filter((n) => n.urgent) : all
  const urgentCount = all.filter((n) => n.urgent).length
=======
}: {
  setRoute: (r: string) => void
}) {
  const all = smartNotifications()
  const [filter, setFilter] = useState<'all' | 'urgent'>('all')
  const list = filter === 'urgent' ? all.filter((n) => n.urgent) : all
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5

  return (
    <div className="fade-in">
      <TopBar
<<<<<<< HEAD
        title={isEmployee ? 'Мои уведомления' : 'Уведомления'}
        subtitle={
          isEmployee
            ? `По вашему рабочему профилю · срочных ${urgentCount}`
            : `Адресные уведомления по команде · срочных ${urgentCount}`
        }
=======
        title="Уведомления"
        subtitle={`Система формирует адресные уведомления · срочных ${all.filter((n) => n.urgent).length}`}
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
      >
        <div className="flex gap-1 text-sm">
          {(['all', 'urgent'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
<<<<<<< HEAD
              className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${
                filter === f
                  ? 'bg-stone-900 text-white'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
=======
              className={`px-3 py-1.5 rounded-md font-medium ${
                filter === f
                  ? 'bg-stone-900 text-white'
                  : 'bg-white border border-stone-200 text-stone-700'
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
              }`}
            >
              {f === 'all' ? 'Все' : 'Только срочные'}
            </button>
          ))}
        </div>
      </TopBar>

      <div className="p-8">
<<<<<<< HEAD
        {/* Баннер для сотрудника без профиля */}
        {isEmployee && !myEmp && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            Ваш рабочий профиль не найден в текущем проекте — уведомления недоступны.
          </div>
        )}

=======
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
        <div className="space-y-2">
          {list.map((n) => (
            <div
              key={n.id}
              className={`bg-white border rounded-xl px-5 py-4 flex items-center gap-4 ${
<<<<<<< HEAD
                n.urgent ? 'border-red-200 bg-red-50/30' : 'border-stone-200'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${n.urgent ? 'bg-red-500' : 'bg-stone-300'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-stone-900">
                    {!isEmployee && <span className="font-semibold">{n.who} — </span>}
                    {n.text}
=======
                n.urgent ? 'border-red-200' : 'border-stone-200'
              }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  n.urgent ? 'bg-red-500' : 'bg-stone-300'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-stone-900">
                    <span className="font-semibold">{n.who}</span> — {n.text}
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
                  </p>
                  <Badge color="stone">{CAT_LABEL[n.category] || n.category}</Badge>
                  {n.urgent && <Badge color="red">срочно</Badge>}
                </div>
<<<<<<< HEAD
                <p className="text-xs text-stone-500 mt-1">Причина: {n.reason}</p>
=======
                <p className="text-xs text-stone-500 mt-1">
                  Причина: {n.reason}
                </p>
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
              </div>
              {n.empId && (
                <button
                  onClick={() => setRoute('emp/' + n.empId)}
<<<<<<< HEAD
                  className="px-3 py-1.5 text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg cursor-pointer flex-shrink-0"
=======
                  className="px-3 py-1.5 text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg"
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
                >
                  {n.action}
                </button>
              )}
            </div>
          ))}
<<<<<<< HEAD

          {list.length === 0 && (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                <Icon name="bell" className="w-5 h-5 text-stone-400" />
              </div>
              <p className="text-stone-500 font-medium">
                {filter === 'urgent' ? 'Нет срочных уведомлений' : 'Нет уведомлений'}
              </p>
              <p className="text-xs text-stone-400 mt-1">
                {isEmployee ? 'Ваш график в порядке' : 'Все данные команды актуальны'}
              </p>
=======
          {list.length === 0 && (
            <div className="text-center py-12 text-stone-500">
              Нет уведомлений в этой категории
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
            </div>
          )}
        </div>

        <div className="mt-6 bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-200 flex items-center justify-center flex-shrink-0">
            <Icon name="ai" className="w-5 h-5 text-sky-800" />
          </div>
          <div>
            <p className="font-semibold text-sky-900 text-sm">Как работают уведомления</p>
            <p className="text-sm text-sky-800 mt-0.5">
<<<<<<< HEAD
              {isEmployee
                ? 'Система анализирует ваш рабочий профиль и формирует персональные рекомендации: устаревший график, перегрузка, расхождение с HR-данными.'
                : 'Система оценивает данные каждого сотрудника и формирует адресные уведомления только при необходимости — устаревший график, перегрузка, HR-расхождение.'}
=======
              Система оценивает данные, выбирает релевантную причину (устаревший график, перегрузка, HR-расхождение) и формирует адресное действие только при необходимости.
>>>>>>> 8e5bb852d38b0f7212fa95f26d258b51fbad0db5
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
