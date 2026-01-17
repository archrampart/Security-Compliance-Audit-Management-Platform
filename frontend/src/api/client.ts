import axios from 'axios'

// Dinamik API URL - lokal network erişimi için
const getApiBaseUrl = () => {
  // Environment variable varsa onu kullan
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL}/api/v1`
  }
  
  // Browser'dan erişiliyorsa, aynı hostname'i kullan (lokal network için)
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol
    const hostname = window.location.hostname
    const port = '9090' // Backend portu
    
    // localhost ise localhost kullan, değilse aynı IP'yi kullan
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://localhost:${port}/api/v1`
    } else {
      return `${protocol}//${hostname}:${port}/api/v1`
    }
  }
  
  // Fallback
  return '/api/v1'
}

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const stored = localStorage.getItem('auth-storage')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      if (parsed.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  return config
})

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Better error messages for network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      error.message = 'Sunucuya bağlanılamadı. Lütfen backend\'in çalıştığından emin olun.'
    } else if (error.response) {
      // Server responded with error status
      const data = error.response.data
      if (data && data.detail) {
        error.message = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
      } else if (data && data.message) {
        error.message = data.message
      }
    } else if (error.request) {
      // Request made but no response
      error.message = 'Sunucudan yanıt alınamadı. Lütfen network bağlantınızı kontrol edin.'
    }
    return Promise.reject(error)
  }
)

export default apiClient

