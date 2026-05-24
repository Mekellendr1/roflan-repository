import { useState, useRef, useEffect } from 'react'
import {
  COMPUTED,
  actualizationRoadmap,
  allConflicts,
  diagnosticGroups,
  smartNotifications,
} from '../lib/derived'
import { teamAvailability } from '../lib/metrics'
import Icon from './Icon'

interface Msg {
  role: 'user' | 'ai'
  text: string
}

// Простой rule-based "ИИ": разбирает вопрос и отвечает из посчитанных данных.
// Для MVP этого достаточно — раздел 15-16 ТЗ требует ассистента, не LLM.
function answer(q: string): string {
  const t = q.toLowerCase()

  if (/перегруж|нагрузк|загрузк/.test(t)) {
    const over = COMPUTED.filter((e) => e.metrics.workload > 0.8)
    if (over.length === 0) return 'Сейчас перегруженных сотрудников нет — у всех загрузка ниже порога 80%.'
    return (
      'Перегружены (загрузка > 80%):\n' +
      over
        .map((e) => `• ${e.name} — ${Math.round(e.metrics.workload * 100)}% (${e.metrics.busyHours}ч из ${e.metrics.workHours}ч)`)
        .join('\n') +
      '\n\nРекомендую не назначать им новые встречи на этой неделе.'
    )
  }

  if (/устар|обнов|актуальн/.test(t)) {
    const stale = diagnosticGroups().find((g) => g.id === 'stale')!.employees
    if (stale.length === 0) return 'Графики у всех актуальны.'
    return (
      'Графики устарели у:\n' +
      stale
        .map((e) => `• ${e.name} — ${e.metrics.daysSinceUpdate} дн. без обновления (актуальность ${Math.round(e.metrics.actuality * 100)}%)`)
        .join('\n') +
      '\n\nИм стоит отправить запрос на подтверждение графика.'
    )
  }

  if (/конфликт/.test(t)) {
    const c = allConflicts()
    const crit = c.filter((x) => x.severity === 'critical')
    return `Всего конфликтов: ${c.length}, критических: ${crit.length}.\n\nСамые срочные:\n${crit
      .slice(0, 4)
      .map((x) => `• ${x.title} — ${x.desc}`)
      .join('\n')}`
  }

  if (/встреч|доступн|когда команд|окно/.test(t)) {
    // Среда (день 2) как пример
    const slots = teamAvailability(COMPUTED.filter((e) => e.team === 'Backend'), 2)
    const best = slots.reduce((a, b) => (b.freeCount > a.freeCount ? b : a))
    return `Команда Backend наиболее доступна в среду в ${best.hour}:00 — свободно ${best.freeCount} из ${best.total} человек.\n\nЗайди в «Карту доступности» или «Подбор времени» для деталей по всем дням.`
  }

  if (/перенес|отмен/.test(t)) {
    const ooh = COMPUTED.filter((e) => e.metrics.outOfHoursRatio > 0.25)
    return (
      'Стоит рассмотреть перенос встреч у:\n' +
      ooh
        .map((e) => `• ${e.name} — ${Math.round(e.metrics.outOfHoursRatio * 100)}% встреч вне рабочего времени`)
        .join('\n')
    )
  }

  if (/запрос|подтверд|напомн|уведомл/.test(t)) {
    const n = smartNotifications().filter((x) => x.urgent)
    return `Срочные уведомления (${n.length}):\n${n
      .map((x) => `• ${x.who}: ${x.text}`)
      .join('\n')}`
  }

  if (/в первую очеред|приоритет|с кого|дорожн/.test(t)) {
    const road = actualizationRoadmap().slice(0, 5)
    return (
      'Порядок актуализации (по приоритету):\n' +
      road
        .map((e, i) => `${i + 1}. ${e.name} — приоритет ${e.metrics.actualizationPriority}/100`)
        .join('\n')
    )
  }

  if (/привет|здравств|hi|hello/.test(t)) {
    return 'Привет! Я ассистент WorkTime Sync. Спроси меня: «кто перегружен», «у кого устарел график», «когда команда доступна», «какие конфликты», «кому отправить запрос», «с кого начать актуализацию».'
  }

  return 'Я могу рассказать про перегрузку, устаревшие графики, конфликты, доступность команды, приоритеты актуализации и уведомления. Попробуй спросить, например: «кто перегружен?» или «когда команда доступна?»'
}

const SUGGESTIONS = [
  'Кто перегружен?',
  'У кого устарел график?',
  'Когда команда доступна?',
  'С кого начать актуализацию?',
]

export default function AIAssistant({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'ai',
      text: 'Привет! Я ассистент WorkTime Sync. Могу помочь с доступностью, конфликтами и приоритетами.',
    },
  ])
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const ask = (q: string) => {
    if (!q.trim()) return
    setMessages((m) => [...m, { role: 'user', text: q }])
    setInput('')
    setTimeout(() => {
      setMessages((m) => [...m, { role: 'ai', text: answer(q) }])
    }, 350)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[420px] bg-white h-full flex flex-col slide-in shadow-2xl">
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
              <Icon name="ai" className="w-4 h-4 text-sky-700" />
            </div>
            <div>
              <p className="font-bold text-stone-900 text-sm">Ассистент</p>
              <p className="text-xs text-stone-500">анализирует данные команды</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-lg">
            <Icon name="x" className="w-4 h-4 text-stone-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-line ${
                  m.role === 'user'
                    ? 'bg-stone-900 text-white rounded-br-sm'
                    : 'bg-stone-100 text-stone-800 rounded-bl-sm'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="text-xs px-2.5 py-1 bg-white border border-stone-200 rounded-full hover:border-sky-400 hover:bg-sky-50 text-stone-600"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-stone-200 flex gap-2">
            <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ask(input)}
            placeholder="Спроси про доступность, риски, перегрузку…"
              className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-sky-400"
          />
          <button
            onClick={() => ask(input)}
              className="px-3 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-400"
          >
            <Icon name="send" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
