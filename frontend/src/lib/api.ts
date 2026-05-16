import axios from 'axios'

// baseURL '/api' — Vite proxy перенаправит на http://localhost:8000
export const http = axios.create({ baseURL: '/api', timeout: 10000 })

http.interceptors.response.use(
  (r) => r,
  (e) => {
    console.error('API error:', e.response?.data || e.message)
    return Promise.reject(e)
  }
)

// ===== Запросы (все возвращают то же, что считал derived.ts) =====
export const apiGetEmployees = (team?: string) =>
  http.get('/employees', { params: team ? { team } : {} }).then((r) => r.data)

export const apiGetEmployee = (id: string) =>
  http.get(`/employees/${id}`).then((r) => r.data)

export const apiGetDiagnostics = () =>
  http.get('/diagnostics').then((r) => r.data)

export const apiGetConflicts = (severity?: string, type?: string) =>
  http.get('/conflicts', { params: { severity, type } }).then((r) => r.data)

export const apiGetRecommendations = () =>
  http.get('/recommendations').then((r) => r.data)

export const apiGetNotifications = () =>
  http.get('/notifications').then((r) => r.data)

export const apiGetRoadmap = () => http.get('/roadmap').then((r) => r.data)

export const apiGetAvailability = (team: string, day: number) =>
  http.get('/availability', { params: { team, day } }).then((r) => r.data)

export const apiSuggestTime = (employee_ids: string[], duration: number) =>
  http
    .post('/meetings/suggest-time', { employee_ids, duration })
    .then((r) => r.data)

export const apiGetSources = () => http.get('/sources').then((r) => r.data)

export const apiGetStats = (team?: string) =>
  http.get('/stats', { params: team ? { team } : {} }).then((r) => r.data)

export const apiRecalculate = () =>
  http.post('/recalculate').then((r) => r.data)
