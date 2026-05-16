import type {
  CalendarEvent,
  DataSource,
  Employee,
  TimeException,
} from './types'

// Дата "сегодня" минус N дней → ISO
function ago(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

const ev = (
  id: string,
  title: string,
  day: number,
  s: number,
  e: number,
  type: CalendarEvent['type'] = 'meeting',
  source = 'Google Calendar'
): CalendarEvent => ({ id, title, day, startHour: s, endHour: e, type, source })

const exc = (
  id: string,
  type: TimeException['type'],
  startDate: string,
  endDate: string,
  note: string,
  source = 'HR System'
): TimeException => ({ id, type, startDate, endDate, note, source })

export const employees: Employee[] = [
  // 1. Иван — перегрузка + встречи вне графика + back-to-back
  {
    id: 'e1',
    name: 'Иван Петров',
    initials: 'ИП',
    role: 'Senior Backend',
    team: 'Backend',
    timezone: 'Europe/Moscow',
    tzShort: 'МСК',
    tzOffset: 3,
    format: 'Гибрид',
    hrFormat: 'Офис',
    schedule: { days: [0, 1, 2, 3, 4], startHour: 10, endHour: 19 },
    lastUpdate: ago(47),
    activityTimezoneShift: false,
    exceptions: [],
    events: [
      ev('e1-1', 'Sprint planning', 2, 10, 12),
      ev('e1-2', 'Design review', 2, 12, 13),
      ev('e1-3', 'Architecture sync', 2, 13, 15),
      ev('e1-4', 'Code review', 2, 15, 17),
      ev('e1-5', '1:1 с командой', 2, 17, 19),
      ev('e1-6', 'Late night call', 2, 20, 21, 'recurring'),
      ev('e1-7', 'Standup', 0, 10, 11),
      ev('e1-8', 'Refactoring block', 1, 13, 16, 'focus'),
      ev('e1-9', 'Weekend hotfix', 5, 11, 13),
    ],
  },
  // 2. Мария — встречи 22:00 (US team), HR mismatch, давно не обновляла
  {
    id: 'e2',
    name: 'Мария Косова',
    initials: 'МК',
    role: 'Tech Lead',
    team: 'Backend',
    timezone: 'Europe/Lisbon',
    tzShort: 'LIS',
    tzOffset: 0,
    format: 'Удалёнка',
    hrFormat: 'Гибрид',
    schedule: { days: [0, 1, 2, 3, 4], startHour: 9, endHour: 18 },
    lastUpdate: ago(62),
    activityTimezoneShift: true,
    exceptions: [],
    events: [
      ev('e2-1', 'Sync with US team', 3, 22, 23, 'recurring'),
      ev('e2-2', 'Standup', 3, 10, 11),
      ev('e2-3', 'Design crit', 3, 11, 12),
      ev('e2-4', 'PR review', 3, 12, 13),
      ev('e2-5', 'Roadmap sync', 3, 14, 15),
      ev('e2-6', '1:1', 3, 15, 16),
      ev('e2-7', 'Demo prep', 3, 16, 18),
      ev('e2-8', 'Architecture deep-dive', 1, 9, 11),
    ],
  },
  // 3. Алексей — HR mismatch + устаревший график + отпуск
  {
    id: 'e3',
    name: 'Алексей Смирнов',
    initials: 'АС',
    role: 'Middle Backend',
    team: 'Backend',
    timezone: 'Asia/Novosibirsk',
    tzShort: 'НСК',
    tzOffset: 7,
    format: 'Офис',
    hrFormat: 'Удалёнка',
    schedule: { days: [0, 1, 2, 3, 4], startHour: 9, endHour: 18 },
    lastUpdate: ago(78),
    activityTimezoneShift: false,
    exceptions: [
      exc('e3-x1', 'vacation', ago(-3), ago(-8), 'Отпуск 15–19 мая'),
    ],
    events: [
      ev('e3-1', 'Project review', 4, 14, 15),
      ev('e3-2', 'Standup', 0, 9, 10),
      ev('e3-3', 'Standup', 1, 9, 10),
      ev('e3-4', 'Task sync', 2, 11, 12),
    ],
  },
  // 4. Дмитрий — двойное бронирование
  {
    id: 'e4',
    name: 'Дмитрий Яковлев',
    initials: 'ДЯ',
    role: 'Senior Backend',
    team: 'Backend',
    timezone: 'Europe/Moscow',
    tzShort: 'МСК',
    tzOffset: 3,
    format: 'Удалёнка',
    hrFormat: 'Удалёнка',
    schedule: { days: [0, 1, 2, 3, 4], startHour: 11, endHour: 20 },
    lastUpdate: ago(12),
    activityTimezoneShift: false,
    exceptions: [],
    events: [
      ev('e4-1', 'Code review', 1, 15, 16),
      ev('e4-2', '1:1 с менеджером', 1, 15, 16),
      ev('e4-3', 'Standup', 1, 11, 12),
      ev('e4-4', 'Focus block', 2, 13, 17, 'focus'),
    ],
  },
  // 5. Анна — лёгкий конфликт, поздняя встреча в пятницу
  {
    id: 'e5',
    name: 'Анна Морозова',
    initials: 'АМ',
    role: 'Tech Lead',
    team: 'Frontend',
    timezone: 'Europe/Vilnius',
    tzShort: 'VNO',
    tzOffset: 2,
    format: 'Гибрид',
    hrFormat: 'Гибрид',
    schedule: { days: [0, 1, 2, 3, 4], startHour: 9, endHour: 18 },
    lastUpdate: ago(8),
    activityTimezoneShift: false,
    exceptions: [],
    events: [
      ev('e5-1', 'Late retrospective', 4, 18, 19),
      ev('e5-2', 'Standup', 0, 9, 10),
      ev('e5-3', 'Design sync', 2, 14, 15),
    ],
  },
  // 6-7. Здоровые сотрудники для контраста
  {
    id: 'e6',
    name: 'Елена Волкова',
    initials: 'ЕВ',
    role: 'Junior Backend',
    team: 'Backend',
    timezone: 'Europe/Vilnius',
    tzShort: 'VNO',
    tzOffset: 2,
    format: 'Офис',
    hrFormat: 'Офис',
    schedule: { days: [0, 1, 2, 3, 4], startHour: 9, endHour: 18 },
    lastUpdate: ago(3),
    activityTimezoneShift: false,
    exceptions: [],
    events: [
      ev('e6-1', 'Standup', 0, 10, 10.5),
      ev('e6-2', 'Standup', 2, 10, 10.5),
      ev('e6-3', 'Focus time', 1, 13, 15, 'focus'),
      ev('e6-4', 'Mentoring', 3, 14, 15),
    ],
  },
  {
    id: 'e7',
    name: 'Сергей Лебедев',
    initials: 'СЛ',
    role: 'Middle DevOps',
    team: 'Infra',
    timezone: 'Europe/Moscow',
    tzShort: 'МСК',
    tzOffset: 3,
    format: 'Удалёнка',
    hrFormat: 'Удалёнка',
    schedule: { days: [0, 1, 2, 3, 4], startHour: 10, endHour: 19 },
    lastUpdate: ago(5),
    activityTimezoneShift: false,
    exceptions: [],
    events: [
      ev('e7-1', 'Standup', 0, 11, 11.5),
      ev('e7-2', 'Infra review', 2, 14, 15),
      ev('e7-3', 'On-call handoff', 4, 12, 13),
    ],
  },
  // 8. Ольга — встречи рано утром (NYC), смена пояса
  {
    id: 'e8',
    name: 'Ольга Никитина',
    initials: 'ОН',
    role: 'QA Engineer',
    team: 'QA',
    timezone: 'America/New_York',
    tzShort: 'NYC',
    tzOffset: -5,
    format: 'Удалёнка',
    hrFormat: 'Удалёнка',
    schedule: { days: [0, 1, 2, 3, 4], startHour: 9, endHour: 18 },
    lastUpdate: ago(34),
    activityTimezoneShift: true,
    exceptions: [
      exc('e8-x1', 'sick', ago(2), ago(0), 'Больничный'),
    ],
    events: [
      ev('e8-1', 'Daily stand-up', 0, 7, 7.5, 'recurring'),
      ev('e8-2', 'Daily stand-up', 1, 7, 7.5, 'recurring'),
      ev('e8-3', 'Daily stand-up', 2, 7, 7.5, 'recurring'),
      ev('e8-4', 'Test planning', 3, 14, 15),
    ],
  },
  // 9. Павел — командировка
  {
    id: 'e9',
    name: 'Павел Орлов',
    initials: 'ПО',
    role: 'Middle Frontend',
    team: 'Frontend',
    timezone: 'Europe/Moscow',
    tzShort: 'МСК',
    tzOffset: 3,
    format: 'Гибрид',
    hrFormat: 'Гибрид',
    schedule: { days: [0, 1, 2, 3, 4], startHour: 9, endHour: 18 },
    lastUpdate: ago(21),
    activityTimezoneShift: false,
    exceptions: [
      exc('e9-x1', 'business_trip', ago(-1), ago(-5), 'Командировка в офис Берлина'),
    ],
    events: [
      ev('e9-1', 'Standup', 0, 9, 10),
      ev('e9-2', 'UI sync', 2, 13, 14),
      ev('e9-3', 'Sprint review', 4, 15, 16),
    ],
  },
]

export const dataSources: DataSource[] = [
  { id: 's1', name: 'Google Calendar', type: 'calendar', icon: 'calendar', status: 'active', lastSync: '2 мин назад', records: 1247 },
  { id: 's2', name: 'HR System (БОСС-Кадровик)', type: 'hr', icon: 'users', status: 'active', lastSync: '15 мин назад', records: 9 },
  { id: 's3', name: 'Jira (задачи)', type: 'tasks', icon: 'tasks', status: 'active', lastSync: '5 мин назад', records: 318 },
  { id: 's4', name: 'Табель учёта времени', type: 'timesheet', icon: 'clock', status: 'stale', lastSync: '6 часов назад', records: 540 },
  { id: 's5', name: 'Slack статусы', type: 'manual', icon: 'message', status: 'error', lastSync: 'нет связи', records: 0 },
]

export const TEAMS = ['Все команды', 'Backend', 'Frontend', 'Infra', 'QA']
export const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
