import axios from 'axios'

// baseURL = '/api' — Vite proxy перенаправит на http://localhost:8000
export const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)
