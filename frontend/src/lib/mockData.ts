import type {
  Employee,
  Conflict,
  MeetingSlot,
  Source,
  NotificationItem,
} from './types'

export const employees: Employee[] = [
  { id: 'e1', name: 'Иван Петров', initials: 'ИП', role: 'Senior Backend', team: 'Backend', tz: 'Europe/Moscow', tzShort: 'МСК', tzOffset: 3, format: 'Гибрид', schedule: '10:00–19:00', scheduleUpdated: 5, riskScore: 87, workload: 130, overtime: 8.5, conflicts: 4, color: 'red', tags: ['130% загрузка', '4 конфликта'] },
  { id: 'e2', name: 'Мария Косова', initials: 'МК', role: 'Tech Lead', team: 'Backend', tz: 'Europe/Lisbon', tzShort: 'LIS', tzOffset: 0, format: 'Удалёнка', schedule: '09:00–18:00', scheduleUpdated: 2, riskScore: 79, workload: 115, overtime: 6.0, conflicts: 3, color: 'red', tags: ['встречи 22:00+', 'back-to-back 6ч'] },
  { id: 'e3', name: 'Алексей Смирнов', initials: 'АС', role: 'Middle Backend', team: 'Backend', tz: 'Asia/Novosibirsk', tzShort: 'НСК', tzOffset: 7, format: 'Офис', schedule: '09:00–18:00', scheduleUpdated: 18, riskScore: 58, workload: 95, overtime: 2.5, conflicts: 2, color: 'amber', tags: ['HR ≠ календарь', 'график 18 дн'] },
  { id: 'e4', name: 'Дмитрий Яковлев', initials: 'ДЯ', role: 'Senior Backend', team: 'Backend', tz: 'Europe/Moscow', tzShort: 'МСК', tzOffset: 3, format: 'Удалёнка', schedule: '11:00–20:00', scheduleUpdated: 7, riskScore: 46, workload: 88, overtime: 1.5, conflicts: 2, color: 'amber', tags: ['двойное бронирование'] },
  { id: 'e5', name: 'Анна Морозова', initials: 'АМ', role: 'Tech Lead', team: 'Frontend', tz: 'Europe/Vilnius', tzShort: 'VNO', tzOffset: 2, format: 'Гибрид', schedule: '09:00–18:00', scheduleUpdated: 3, riskScore: 34, workload: 82, overtime: 0, conflicts: 1, color: 'amber', tags: ['1 минор-конфликт'] },
  { id: 'e6', name: 'Елена Волкова', initials: 'ЕВ', role: 'Junior Backend', team: 'Backend', tz: 'Europe/Vilnius', tzShort: 'VNO', tzOffset: 2, format: 'Офис', schedule: '09:00–18:00', scheduleUpdated: 1, riskScore: 22, workload: 75, overtime: 0, conflicts: 0, color: 'green', tags: ['в норме'] },
  { id: 'e7', name: 'Сергей Лебедев', initials: 'СЛ', role: 'Middle DevOps', team: 'Infra', tz: 'Europe/Moscow', tzShort: 'МСК', tzOffset: 3, format: 'Удалёнка', schedule: '10:00–19:00', scheduleUpdated: 4, riskScore: 18, workload: 70, overtime: 0, conflicts: 0, color: 'green', tags: ['в норме'] },
  { id: 'e8', name: 'Ольга Никитина', initials: 'ОН', role: 'QA Engineer', team: 'QA', tz: 'America/New_York', tzShort: 'NYC', tzOffset: -5, format: 'Удалёнка', schedule: '09:00–18:00', scheduleUpdated: 6, riskScore: 41, workload: 90, overtime: 1.0, conflicts: 1, color: 'amber', tags: ['ранний созвон'] },
]

export const conflicts: Conflict[] = [
  { id: 'c1', severity: 'critical', type: 'overload', empId: 'e1', title: 'Иван Петров — перегрузка 130%', desc: '11.5 часов событий при норме 8 · среда, 13 мая' },
  { id: 'c2', severity: 'critical', type: 'out_of_hours', empId: 'e2', title: 'Мария Косова — встреча вне рабочих часов', desc: '«Sync with US team» в 22:00 LIS · повторяется еженедельно' },
  { id: 'c3', severity: 'critical', type: 'overload', empId: 'e1', title: 'Иван Петров — back-to-back 4 часа', desc: 'Встречи без перерывов 14:00–18:00 · четверг, 14 мая' },
  { id: 'c4', severity: 'warning', type: 'hr_mismatch', empId: 'e3', title: 'Алексей Смирнов — HR ≠ календарь', desc: 'HR: отпуск 15-19 мая · Календарь: встреча 17 мая 14:00' },
  { id: 'c5', severity: 'warning', type: 'back_to_back', empId: 'e2', title: 'Мария Косова — back-to-back 6 часов', desc: '7 встреч подряд без перерывов · четверг, 14 мая' },
  { id: 'c6', severity: 'warning', type: 'double_booking', empId: 'e4', title: 'Дмитрий Яковлев — двойное бронирование', desc: '«Code review» + «1:1 с менеджером» в одно время · 14 мая 15:00' },
  { id: 'c7', severity: 'warning', type: 'out_of_hours', empId: 'e8', title: 'Ольга Никитина — встреча до 9 утра', desc: 'Daily stand-up в 7:00 NYC · 3 раза в неделю' },
  { id: 'c8', severity: 'low', type: 'stale_schedule', empId: 'e3', title: 'Алексей Смирнов — устаревший график', desc: 'График не обновлялся 18 дней · требуется подтверждение' },
  { id: 'c9', severity: 'low', type: 'stale_schedule', empId: 'e4', title: 'Дмитрий Яковлев — частичная переработка', desc: '1.5ч сверх нормы 3 дня подряд' },
  { id: 'c10', severity: 'low', type: 'uncomfortable', empId: 'e5', title: 'Анна Морозова — некомфортное время', desc: 'Встреча 17:45 VNO в пятницу · перед выходными' },
]

export const meetingSlots: MeetingSlot[] = [
  { score: 94, optimal: true, date: 'Среда, 13 мая', time: '11:00–12:00 МСК', tzs: '09:00 LIS · 11:00 МСК · 12:00 VNO · 15:00 НСК', reason: 'Середина дня для всех · буфер 30+ мин до и после · нет переработок' },
  { score: 71, optimal: false, date: 'Четверг, 14 мая', time: '14:00–15:00 МСК', tzs: '12:00 LIS · 14:00 МСК · 15:00 VNO · 18:00 НСК', reason: 'Поздновато для Алексея (НСК) · в остальном комфортно' },
  { score: 68, optimal: false, date: 'Пятница, 15 мая', time: '10:00–11:00 МСК', tzs: '08:00 LIS · 10:00 МСК · 11:00 VNO · 14:00 НСК', reason: 'Рановато для Марии (LIS) · обед для Алексея (НСК)' },
  { score: 52, optimal: false, date: 'Понедельник, 18 мая', time: '16:00–17:00 МСК', tzs: '14:00 LIS · 16:00 МСК · 17:00 VNO · 20:00 НСК', reason: 'Вне рабочих часов для Алексея (НСК)' },
]

export const sources: Source[] = [
  { id: 's1', name: 'Google Calendar', type: 'calendar', icon: 'calendar', status: 'active', lastSync: '2 мин назад', records: 1247 },
  { id: 's2', name: 'HR System', type: 'hr', icon: 'users', status: 'active', lastSync: '15 мин назад', records: 42 },
  { id: 's3', name: 'Jira', type: 'tasks', icon: 'tasks', status: 'active', lastSync: '5 мин назад', records: 318 },
  { id: 's4', name: 'Slack статусы', type: 'manual', icon: 'message', status: 'stale', lastSync: '4 часа назад', records: 38 },
]

export const notifications: NotificationItem[] = [
  { id: 'n1', urgent: true, who: 'Иван П.', text: 'обнови график — критический риск', action: 'Открыть' },
  { id: 'n2', urgent: true, who: 'Алексей С.', text: 'подтверди отпуск — есть встреча 17 мая', action: 'Решить' },
  { id: 'n3', urgent: false, who: 'Мария К.', text: '3 встречи вне рабочих часов на этой неделе', action: 'Перенести' },
  { id: 'n4', urgent: false, who: 'Команда', text: 'sync не было 12 дней — запланировать?', action: 'Найти время' },
  { id: 'n5', urgent: false, who: 'Дмитрий Я.', text: 'двойное бронирование 14 мая 15:00', action: 'Перенести' },
]

export const riskHistory = [72, 68, 60, 55, 45, 40, 35, 38, 30, 25, 22, 18, 15, 13, 87]
