import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useTranslation } from 'react-i18next'
import { AlertCircle } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Login error:', err)
      // Show specific error message if available
      if (err.response?.data?.detail) {
        setError(err.response.data.detail)
      } else if (err.message) {
        setError(err.message)
      } else if (err.response?.status === 401) {
        setError(t('auth.invalidCredentials'))
      } else if (err.response?.status === 400) {
        setError(err.response.data?.detail || 'Geçersiz istek')
      } else {
        setError(err.message || t('auth.invalidCredentials'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="flex min-h-screen items-center justify-center"
      style={{
        background: 'linear-gradient(to bottom right, #f8fafc 0%, #e2e8f0 100%)',
      }}
    >
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-large border border-neutral-200">
        <div className="mb-8 text-center">
          <h1 
            className="text-3xl font-bold bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ArchRampart Audit
          </h1>
          <p className="mt-2 text-neutral-600">{t('auth.login')}</p>
        </div>

        {error && (
          <div className="mb-4 flex items-center space-x-2 rounded-lg bg-error-50 border border-error-200 p-3 text-error-700">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1.5">
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-4 py-2.5 shadow-soft focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-200 transition-all duration-200 text-neutral-900 placeholder-neutral-400"
              placeholder={t('auth.email')}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1.5">
              {t('auth.password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-4 py-2.5 shadow-soft focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-200 transition-all duration-200 text-neutral-900 placeholder-neutral-400"
              placeholder={t('auth.password')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent-600 px-4 py-2.5 font-medium text-white shadow-medium hover:bg-accent-700 hover:shadow-large transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundImage: loading ? 'none' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            }}
          >
            {loading ? t('common.loading') : t('auth.loginButton')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="https://archrampart.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-neutral-500 hover:text-primary-600 transition-colors"
          >
            {t('auth.visitWebsite')}
          </a>
        </div>
      </div>
    </div>
  )
}

