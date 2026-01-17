import { create } from 'zustand'
import axios from 'axios'

// API base URL helper - client.ts'den aynı mantık
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol
    const hostname = window.location.hostname
    const port = '9090'
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://localhost:${port}/api/v1`
    } else {
      return `${protocol}//${hostname}:${port}/api/v1`
    }
  }
  return '/api/v1'
}

export interface User {
  id: number
  email: string
  full_name: string
  role: 'platform_admin' | 'org_admin' | 'auditor'
  organization_id: number | null
  is_active: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: (() => {
    const stored = localStorage.getItem('auth-storage')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.token && parsed.user) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${parsed.token}`
          return parsed.user
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    return null
  })(),
  token: (() => {
    const stored = localStorage.getItem('auth-storage')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        return parsed.token || null
      } catch (e) {
        return null
      }
    }
    return null
  })(),
  login: async (email: string, password: string) => {
    try {
      const params = new URLSearchParams()
      params.append('username', email)
      params.append('password', password)

      const baseURL = getApiBaseUrl()

      // Login request - don't use interceptor for this
      const loginAxios = axios.create()
      const response = await loginAxios.post(`${baseURL}/auth/login`, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      const { access_token } = response.data

      if (!access_token) {
        throw new Error('Token alınamadı')
      }

      // Get user info - use interceptor-free axios
      const userResponse = await loginAxios.get(`${baseURL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })

      const userData = userResponse.data

      if (!userData) {
        throw new Error('Kullanıcı bilgileri alınamadı')
      }

      set({
        token: access_token,
        user: userData,
      })

      // Persist to localStorage
      localStorage.setItem('auth-storage', JSON.stringify({
        token: access_token,
        user: userData,
      }))

      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    } catch (error: any) {
      // Re-throw with better error message
      if (error.response) {
        // Server responded with error
        throw error
      } else if (error.request) {
        // Request made but no response
        throw new Error('Sunucuya bağlanılamadı. Lütfen backend\'in çalıştığından emin olun.')
      } else {
        // Something else happened
        throw error
      }
    }
  },
  logout: () => {
    set({ user: null, token: null })
    localStorage.removeItem('auth-storage')
    delete axios.defaults.headers.common['Authorization']
  },
  isAuthenticated: () => {
    return get().token !== null && get().user !== null
  },
}))

// Initialize axios interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

