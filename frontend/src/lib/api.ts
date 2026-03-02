import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — token qo'shish
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — 401 da token yangilash
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        if (refresh) {
          const res = await axios.post(`${API_URL}/api/v1/auth/refresh`, { refresh_token: refresh })
          const { access_token, refresh_token } = res.data
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', refresh_token)
          original.headers.Authorization = `Bearer ${access_token}`
          return api(original)
        }
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data: { email: string; password: string; full_name?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

// ─── Social API ───────────────────────────────────────────────────────────────
export const socialAPI = {
  list: () => api.get('/social/accounts'),
  disconnect: (id: string) => api.delete(`/social/accounts/${id}`),
  connectYoutube: () => api.get('/social/connect/youtube'),
  connectInstagram: () => api.get('/social/connect/instagram'),
  connectLinkedin: () => api.get('/social/connect/linkedin'),
  listTelegramChannels: () => api.get('/social/telegram/channels'),
  addTelegramChannel: (data: {
    channel_id: string
    channel_username?: string
    channel_name?: string
    bot_token?: string
  }) => api.post('/social/telegram/channels', data),
  deleteTelegramChannel: (id: string) => api.delete(`/social/telegram/channels/${id}`),
}

// ─── Posts API ────────────────────────────────────────────────────────────────
export const postsAPI = {
  list: () => api.get('/posts/'),
  get: (id: string) => api.get(`/posts/${id}`),
  create: (data: {
    caption: string
    media_url?: string
    media_type?: string
    scheduled_time?: string
    platforms?: string[]
    telegram_channel_ids?: string[]
  }) => api.post('/posts/', data),
  delete: (id: string) => api.delete(`/posts/${id}`),
  publishNow: (id: string) => api.post(`/posts/${id}/publish-now`),
  schedule: (id: string, scheduled_time: string) =>
    api.post(`/posts/${id}/schedule?scheduled_time=${encodeURIComponent(scheduled_time)}`),
  platformStatus: (id: string) => api.get(`/posts/${id}/platform-status`),
  uploadMedia: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/posts/upload-media', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// ─── Stats API ────────────────────────────────────────────────────────────────
export const statsAPI = {
  dashboard: () => api.get('/stats/dashboard'),
}

export default api
