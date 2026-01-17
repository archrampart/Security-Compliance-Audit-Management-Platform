import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { useTranslation } from 'react-i18next'
import { usersApi } from '../api/users'
import GlobalSearch from './GlobalSearch'
import {
  LayoutDashboard,
  Building2,
  FolderOpen,
  FileCheck,
  AlertCircle,
  FileText,
  Users,
  LogOut,
  Globe,
  Bell,
  Lock,
  X,
  AlertCircle as AlertCircleIcon,
  ChevronDown,
  User as UserIcon,
  Moon,
  Sun,
} from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const { isDark, toggleTheme } = useThemeStore()
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const toggleLanguage = () => {
    const newLang = i18n.language === 'tr' ? 'en' : 'tr'
    i18n.changeLanguage(newLang)
  }

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')

    // Validation
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      setPasswordError(t('profile.password.allFieldsRequired'))
      return
    }

    if (passwordData.new_password.length < 6) {
      setPasswordError(t('profile.password.minLength'))
      return
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError(t('profile.password.mismatch'))
      return
    }

    try {
      setPasswordLoading(true)
      await usersApi.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      })
      setShowPasswordModal(false)
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      })
      alert(t('profile.password.success'))
    } catch (error: any) {
      console.error('Error changing password:', error)
      setPasswordError(error.response?.data?.detail || t('profile.password.error'))
    } finally {
      setPasswordLoading(false)
    }
  }

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { path: '/organizations', icon: Building2, label: t('nav.organizations'), roles: ['platform_admin'] },
    { path: '/users', icon: Users, label: t('nav.users'), roles: ['platform_admin', 'org_admin'] },
    { path: '/projects', icon: FolderOpen, label: t('nav.projects') },
    { path: '/audits', icon: FileCheck, label: t('nav.audits') },
    { path: '/findings', icon: AlertCircle, label: t('nav.findings') },
    { path: '/templates', icon: FileText, label: t('nav.templates') },
    { path: '/notifications', icon: Bell, label: t('nav.notifications') },
  ].filter((item) => {
    if (!item.roles) return true
    return user && item.roles.includes(user.role)
  })

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-neutral-800 shadow-xl border-r border-neutral-200 dark:border-neutral-700 transition-colors duration-300">
        <div className="flex h-full flex-col">
          {/* Logo/Brand */}
          <div className="flex h-20 flex-col items-center justify-center border-b border-neutral-200 dark:border-neutral-700 bg-gradient-to-r from-accent-50 to-primary-50 dark:from-neutral-800 dark:to-neutral-900 px-4 transition-colors duration-300">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-600 to-primary-600 dark:from-accent-400 dark:to-primary-400">
              ArchRampart
            </h1>
            <p className="mt-0.5 text-[10px] font-medium text-neutral-500 dark:text-neutral-400 leading-tight text-center">
              {t('nav.tagline')}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center space-x-3 rounded-xl px-4 py-3 transition-all duration-200 ${isActive
                    ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-md shadow-accent-200 dark:shadow-accent-900/50'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-accent-600 dark:hover:text-accent-400'
                    }`}
                >
                  <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className={`font-medium ${isActive ? 'text-white' : ''}`}>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="border-t border-neutral-200 dark:border-neutral-700 p-4 bg-neutral-50 dark:bg-neutral-900/50 transition-colors duration-300">
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={toggleLanguage}
                className="flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 hover:shadow-sm transition-all duration-200"
              >
                <Globe className="h-4 w-4" />
                <span>{i18n.language.toUpperCase()}</span>
              </button>
              <button
                onClick={toggleTheme}
                className="flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 hover:shadow-sm transition-all duration-200"
                title={isDark ? 'Light Mode' : 'Dark Mode'}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
            <div className="relative user-menu-container mb-3">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-full rounded-xl bg-white dark:bg-neutral-800 px-4 py-3 shadow-sm border border-neutral-200 dark:border-neutral-600 hover:shadow-md transition-all duration-200 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{user?.full_name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{user?.email}</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl bg-white dark:bg-neutral-800 shadow-lg border border-neutral-200 dark:border-neutral-600 overflow-hidden z-50">
                  <button
                    onClick={() => {
                      setShowPasswordModal(true)
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <Lock className="h-4 w-4" />
                    <span>{t('profile.changePassword')}</span>
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center justify-center space-x-2 rounded-xl px-4 py-2.5 text-sm font-medium text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/30 hover:shadow-sm transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span>{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area with footer */}
      <div className="ml-64 flex flex-1 flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-700 px-8 py-4 transition-colors duration-300">
          <div className="flex items-center justify-end">
            <GlobalSearch />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-8 pb-0 animate-fadeIn">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="mt-8 border-t border-neutral-200 dark:border-neutral-700 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm py-5 transition-colors duration-300">
          <div className="px-8">
            <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
              <div className="flex items-center space-x-4">
                <span className="font-medium">© {new Date().getFullYear()} ArchRampart</span>
                <span className="text-neutral-300 dark:text-neutral-600">•</span>
                <a
                  href="https://archrampart.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 hover:underline transition-colors"
                >
                  archrampart.com
                </a>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 font-medium">
                {t('footer.tagline')}
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-neutral-200">
            <div className="sticky top-0 bg-gradient-to-r from-accent-50 to-primary-50 border-b border-neutral-200 px-6 py-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-700 bg-clip-text text-transparent">
                  {t('profile.changePassword')}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPasswordData({
                      current_password: '',
                      new_password: '',
                      confirm_password: '',
                    })
                    setPasswordError('')
                  }}
                  className="rounded-lg p-2 text-neutral-500 hover:bg-white hover:text-neutral-700 hover:shadow-sm transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={handlePasswordChange} className="space-y-6">
                {passwordError && (
                  <div className="rounded-xl bg-error-50 border border-error-200 p-4">
                    <div className="flex items-start">
                      <AlertCircleIcon className="h-5 w-5 text-error-600 mr-3 mt-0.5" />
                      <span className="text-sm font-medium text-error-700">{passwordError}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    {t('profile.password.currentPassword')} <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    className="input w-full"
                    placeholder={t('profile.password.currentPasswordPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    {t('profile.password.newPassword')} <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    className="input w-full"
                    placeholder={t('profile.password.newPasswordPlaceholder')}
                    minLength={6}
                  />
                  <p className="mt-1 text-xs text-neutral-500">{t('profile.password.minLengthHint')}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    {t('profile.password.confirmPassword')} <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    className="input w-full"
                    placeholder={t('profile.password.confirmPasswordPlaceholder')}
                    minLength={6}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false)
                      setPasswordData({
                        current_password: '',
                        new_password: '',
                        confirm_password: '',
                      })
                      setPasswordError('')
                    }}
                    className="btn-secondary"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? t('common.loading') : t('profile.password.change')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

