import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { FolderOpen, FileCheck, AlertCircle, FileText, Clock, AlertTriangle, CheckCircle2, Circle, Activity, Settings2, X, GripVertical, Eye, EyeOff, Bell } from 'lucide-react'
import { projectsApi } from '../api/projects'
import { auditsApi, Audit } from '../api/audits'
import { findingsApi, Finding, Severity, Status } from '../api/findings'
import { templatesApi } from '../api/templates'
import { analyticsApi } from '../api/analytics'
import { notificationsApi } from '../api/notifications'
import { useAuthStore } from '../store/authStore'
import TrendChart from '../components/TrendChart'

interface DashboardCard {
  id: string
  name: string
  visible: boolean
  order: number
}

const DEFAULT_CARDS: DashboardCard[] = [
  { id: 'stats_projects', name: 'Projeler', visible: true, order: 1 },
  { id: 'stats_audits', name: 'Denetimler', visible: true, order: 2 },
  { id: 'stats_open_findings', name: 'Açık Bulgular', visible: true, order: 3 },
  { id: 'stats_templates', name: 'Şablonlar', visible: true, order: 4 },
  { id: 'trend_chart', name: 'Trend Grafiği', visible: true, order: 5 },
  { id: 'severity_distribution', name: 'Bulgu Dağılımı - Önem', visible: true, order: 6 },
  { id: 'status_distribution', name: 'Bulgu Dağılımı - Durum', visible: true, order: 7 },
  { id: 'urgent_findings', name: 'Acil Bulgular', visible: true, order: 8 },
  { id: 'recent_audits', name: 'Son Denetimler', visible: true, order: 9 },
]

const STORAGE_KEY = 'dashboard_cards_preferences'

export default function Dashboard() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user: currentUser } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [cards, setCards] = useState<DashboardCard[]>(DEFAULT_CARDS)

  // Get translated card name
  const getCardName = (cardId: string): string => {
    return t(`dashboard.cards.${cardId}`) || cardId
  }
  const [stats, setStats] = useState({
    projects: 0,
    audits: 0,
    findings: 0,
    templates: 0,
  })
  const [severityDistribution, setSeverityDistribution] = useState<Record<Severity, number>>({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  })
  const [statusDistribution, setStatusDistribution] = useState<Record<Status, number>>({
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  })
  const [urgentFindings, setUrgentFindings] = useState<Finding[]>([])
  const [recentAudits, setRecentAudits] = useState<Audit[]>([])
  const [openFindingsCount, setOpenFindingsCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [allFindings, setAllFindings] = useState<Finding[]>([])

  useEffect(() => {
    loadCardPreferences()
    loadDashboardData()
    loadUnreadCount()

    // Refresh unread count every 30 seconds
    const interval = setInterval(() => {
      loadUnreadCount()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const loadCardPreferences = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const savedCards = JSON.parse(stored) as DashboardCard[]
        setCards(savedCards)
      }
    } catch (error) {
      console.error('Error loading card preferences:', error)
    }
  }

  const saveCardPreferences = (updatedCards: DashboardCard[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCards))
      setCards(updatedCards)
    } catch (error) {
      console.error('Error saving card preferences:', error)
    }
  }

  const toggleCardVisibility = (cardId: string) => {
    const updatedCards = cards.map(card =>
      card.id === cardId ? { ...card, visible: !card.visible } : card
    )
    saveCardPreferences(updatedCards)
  }

  const moveCard = (cardId: string, direction: 'up' | 'down') => {
    const updatedCards = [...cards]
    const index = updatedCards.findIndex(c => c.id === cardId)
    if (index === -1) return

    if (direction === 'up' && index > 0) {
      [updatedCards[index], updatedCards[index - 1]] = [updatedCards[index - 1], updatedCards[index]]
      updatedCards[index].order = index + 1
      updatedCards[index - 1].order = index
    } else if (direction === 'down' && index < updatedCards.length - 1) {
      [updatedCards[index], updatedCards[index + 1]] = [updatedCards[index + 1], updatedCards[index]]
      updatedCards[index].order = index + 1
      updatedCards[index + 1].order = index + 2
    }

    saveCardPreferences(updatedCards)
  }

  const resetCards = () => {
    if (confirm(t('dashboard.resetConfirm'))) {
      localStorage.removeItem(STORAGE_KEY)
      setCards(DEFAULT_CARDS)
    }
  }

  const isCardVisible = (cardId: string) => {
    const card = cards.find(c => c.id === cardId)
    return card?.visible !== false
  }

  const getCardOrder = (cardId: string) => {
    const card = cards.find(c => c.id === cardId)
    return card?.order || 999
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Use analytics API for better performance
      const [analyticsRes, findingsRes, auditsRes, templatesRes] = await Promise.all([
        analyticsApi.getDashboardStats(),
        findingsApi.getAll(),
        auditsApi.getAll(),
        templatesApi.getAll(),
      ])

      const analyticsData = analyticsRes.data
      const findings = findingsRes.data || []
      const audits = auditsRes.data || []
      const templates = templatesRes.data || []

      // Set stats from analytics
      setStats({
        projects: analyticsData.total_projects,
        audits: analyticsData.total_audits,
        findings: analyticsData.total_findings,
        templates: templates.length,
      })

      // Set distributions from analytics
      setSeverityDistribution(analyticsData.severity_distribution as Record<Severity, number>)
      setStatusDistribution(analyticsData.status_distribution as Record<Status, number>)

      // Set open findings count
      setOpenFindingsCount(analyticsData.open_findings)

      // Get urgent findings (critical/high severity, open/in_progress status)
      const urgent = findings
        .filter((f: Finding) =>
          (f.severity === 'critical' || f.severity === 'high') &&
          (f.status === 'open' || f.status === 'in_progress')
        )
        .sort((a: Finding, b: Finding) => {
          // Sort by severity first (critical > high), then by date
          if (a.severity === 'critical' && b.severity !== 'critical') return -1
          if (a.severity !== 'critical' && b.severity === 'critical') return 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
        .slice(0, 5)
      setUrgentFindings(urgent)
      setAllFindings(findings)

      // Get recent audits (last 5)
      const recent = audits
        .sort((a: Audit, b: Audit) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 5)
      setRecentAudits(recent)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      // Fallback to manual calculation if analytics fails
      try {
        const [projectsRes, auditsRes, findingsRes, templatesRes] = await Promise.all([
          projectsApi.getAll(),
          auditsApi.getAll(),
          findingsApi.getAll(),
          templatesApi.getAll(),
        ])

        const projects = projectsRes.data || []
        const audits = auditsRes.data || []
        const findings = findingsRes.data || []
        const templates = templatesRes.data || []

        setStats({
          projects: projects.length,
          audits: audits.length,
          findings: findings.length,
          templates: templates.length,
        })

        const severityCounts: Record<Severity, number> = {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          info: 0,
        }
        findings.forEach((f: Finding) => {
          severityCounts[f.severity] = (severityCounts[f.severity] || 0) + 1
        })
        setSeverityDistribution(severityCounts)

        const statusCounts: Record<Status, number> = {
          open: 0,
          in_progress: 0,
          resolved: 0,
          closed: 0,
        }
        findings.forEach((f: Finding) => {
          statusCounts[f.status] = (statusCounts[f.status] || 0) + 1
        })
        setStatusDistribution(statusCounts)

        const openCount = findings.filter((f: Finding) =>
          f.status === 'open' || f.status === 'in_progress'
        ).length
        setOpenFindingsCount(openCount)

        const urgent = findings
          .filter((f: Finding) =>
            (f.severity === 'critical' || f.severity === 'high') &&
            (f.status === 'open' || f.status === 'in_progress')
          )
          .sort((a: Finding, b: Finding) => {
            if (a.severity === 'critical' && b.severity !== 'critical') return -1
            if (a.severity !== 'critical' && b.severity === 'critical') return 1
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          })
          .slice(0, 5)
        setUrgentFindings(urgent)

        const recent = audits
          .sort((a: Audit, b: Audit) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
          .slice(0, 5)
        setRecentAudits(recent)
      } catch (fallbackError) {
        console.error('Error in fallback loading:', fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    if (!currentUser) return

    try {
      const response = await notificationsApi.getUnreadCount()
      setUnreadCount(response.data.count || 0)
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  }

  const severityColors = {
    critical: 'bg-error-100 text-error-800 border border-error-200',
    high: 'bg-warning-100 text-warning-800 border border-warning-200',
    medium: 'bg-info-100 text-info-800 border border-info-200',
    low: 'bg-success-100 text-success-800 border border-success-200',
    info: 'bg-neutral-100 text-neutral-700 border border-neutral-200',
  }

  const statusIcons = {
    open: Circle,
    in_progress: Clock,
    resolved: CheckCircle2,
    closed: CheckCircle2,
  }

  const statusColors = {
    open: 'text-warning-600',
    in_progress: 'text-info-600',
    resolved: 'text-success-600',
    closed: 'text-neutral-600',
  }

  const statCards = [
    {
      name: t('dashboard.cards.stats_projects'),
      value: stats.projects,
      icon: FolderOpen,
      bgColor: 'bg-accent-50',
      textColor: 'text-accent-700',
      link: '/projects',
    },
    {
      name: t('dashboard.cards.stats_audits'),
      value: stats.audits,
      icon: FileCheck,
      bgColor: 'bg-info-50',
      textColor: 'text-info-700',
      link: '/audits',
    },
    {
      name: t('dashboard.cards.stats_open_findings'),
      value: openFindingsCount,
      icon: AlertCircle,
      bgColor: 'bg-warning-50',
      textColor: 'text-warning-700',
      link: '/findings',
      highlight: urgentFindings.length > 0,
    },
    {
      name: t('dashboard.cards.stats_templates'),
      value: stats.templates,
      icon: FileText,
      bgColor: 'bg-success-50',
      textColor: 'text-success-700',
      link: '/templates',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-600">{t('dashboard.loading')}</div>
      </div>
    )
  }



  return (
    <div>
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-100 dark:via-neutral-200 dark:to-neutral-100 bg-clip-text text-transparent">
            {t('nav.dashboard')}
          </h1>
          <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400 font-medium">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Bildirimler */}
          {currentUser && (
            <button
              onClick={() => navigate('/notifications')}
              className="relative rounded-xl p-3 text-neutral-600 hover:bg-neutral-100 hover:shadow-md transition-all duration-200"
              title={t('notifications.title')}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-error-500 to-error-600 text-xs font-bold text-white shadow-md animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}
          <div className="flex items-center space-x-2">
            {editMode && (
              <button
                onClick={resetCards}
                className="btn-secondary text-sm"
              >
                {t('dashboard.loadDefaults')}
              </button>
            )}
            <button
              onClick={() => setEditMode(!editMode)}
              className={`btn-primary text-sm ${editMode
                ? 'bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800'
                : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
            >
              {editMode ? (
                <>
                  <X className="inline h-4 w-4 mr-2" />
                  {t('dashboard.finishEditing')}
                </>
              ) : (
                <>
                  <Settings2 className="inline h-4 w-4 mr-2" />
                  {t('dashboard.editCards')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {editMode && (
        <div className="mb-6 rounded-lg bg-info-50 border border-info-200 p-4">
          <div className="flex items-start">
            <Settings2 className="h-5 w-5 text-info-600 mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-info-900 mb-1">{t('dashboard.editModeTitle')}</h3>
              <p className="text-sm text-info-700">
                {t('dashboard.editModeDesc')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {isCardVisible('stats_projects') || isCardVisible('stats_audits') ||
        isCardVisible('stats_open_findings') || isCardVisible('stats_templates') ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {statCards
            .filter(stat => {
              const cardId = stat.name === t('dashboard.cards.stats_projects') ? 'stats_projects' :
                stat.name === t('dashboard.cards.stats_audits') ? 'stats_audits' :
                  stat.name === t('dashboard.cards.stats_open_findings') ? 'stats_open_findings' :
                    'stats_templates'
              return isCardVisible(cardId) || editMode
            })
            .sort((a, b) => {
              const aId = a.name === t('dashboard.cards.stats_projects') ? 'stats_projects' :
                a.name === t('dashboard.cards.stats_audits') ? 'stats_audits' :
                  a.name === t('dashboard.cards.stats_open_findings') ? 'stats_open_findings' :
                    'stats_templates'
              const bId = b.name === t('dashboard.cards.stats_projects') ? 'stats_projects' :
                b.name === t('dashboard.cards.stats_audits') ? 'stats_audits' :
                  b.name === t('dashboard.cards.stats_open_findings') ? 'stats_open_findings' :
                    'stats_templates'
              return getCardOrder(aId) - getCardOrder(bId)
            })
            .map((stat) => {
              const Icon = stat.icon
              const cardId = stat.name === t('dashboard.cards.stats_projects') ? 'stats_projects' :
                stat.name === t('dashboard.cards.stats_audits') ? 'stats_audits' :
                  stat.name === t('dashboard.cards.stats_open_findings') ? 'stats_open_findings' :
                    'stats_templates'
              const isVisible = isCardVisible(cardId)

              if (!isVisible && !editMode) return null

              return (
                <div
                  key={stat.name}
                  className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 p-6 shadow-md border transition-all duration-300 ${editMode
                    ? 'border-neutral-300 dark:border-neutral-600 cursor-default'
                    : isVisible
                      ? 'border-neutral-200/60 dark:border-neutral-700 hover:shadow-xl hover:border-accent-200 dark:hover:border-accent-700 cursor-pointer hover:scale-[1.02] hover:-translate-y-1'
                      : 'border-neutral-100 dark:border-neutral-800 opacity-40'
                    }`}
                  onClick={editMode ? undefined : () => navigate(stat.link)}
                >
                  {/* Gradient overlay on hover */}
                  {!editMode && isVisible && (
                    <div className="absolute inset-0 bg-gradient-to-br from-accent-50/0 to-primary-50/0 group-hover:from-accent-50/30 group-hover:to-primary-50/20 transition-all duration-300 pointer-events-none rounded-2xl" />
                  )}
                  {editMode && (
                    <div className="absolute top-2 right-2 flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          moveCard(cardId, 'up')
                        }}
                        className="p-1 rounded text-neutral-500 hover:bg-neutral-100"
                        title={i18n.language === 'en' ? 'Move Up' : 'Yukarı Taşı'}
                      >
                        ↑
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          moveCard(cardId, 'down')
                        }}
                        className="p-1 rounded text-neutral-500 hover:bg-neutral-100"
                        title={i18n.language === 'en' ? 'Move Down' : 'Aşağı Taşı'}
                      >
                        ↓
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleCardVisibility(cardId)
                        }}
                        className={`p-1.5 rounded transition-colors ${isVisible
                          ? 'bg-success-50 text-success-600 hover:bg-success-100'
                          : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                          }`}
                        title={isVisible ? (i18n.language === 'en' ? 'Hide' : 'Gizle') : (i18n.language === 'en' ? 'Show' : 'Göster')}
                      >
                        {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </div>
                  )}
                  <div className="relative flex items-center justify-between">
                    <div className="flex-1">
                      {editMode && (
                        <div className="flex items-center mb-3 text-xs font-medium text-neutral-500">
                          <GripVertical className="h-3 w-3 mr-1" />
                          {cards.find(c => c.id === cardId)?.order || 0}
                        </div>
                      )}
                      <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-1">{stat.name}</p>
                      <p className="text-4xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-white dark:to-neutral-300 bg-clip-text text-transparent">{stat.value}</p>
                      {stat.highlight && isVisible && (
                        <p className="mt-2 inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-error-50 text-error-700 border border-error-200">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {i18n.language === 'en'
                            ? `${urgentFindings.length} urgent findings`
                            : `${urgentFindings.length} acil bulgu`}
                        </p>
                      )}
                    </div>
                    <div className={`relative p-4 rounded-2xl ${stat.bgColor} shadow-sm transition-transform duration-300 ${!editMode && isVisible ? 'group-hover:scale-110 group-hover:rotate-3' : ''}`}>
                      <Icon className={`h-7 w-7 ${stat.textColor}`} />
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      ) : null}

      {/* Trend Chart */}
      {(isCardVisible('trend_chart') || editMode) && (
        <div className="mb-8">
          <TrendChart findings={allFindings} />
        </div>
      )}

      {/* Distribution Cards */}
      {(isCardVisible('severity_distribution') || isCardVisible('status_distribution')) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
          {/* Bulgu Dağılımı - Önem Seviyesi */}
          {(isCardVisible('severity_distribution') || editMode) && (
            <div
              className={`rounded-xl bg-white dark:bg-neutral-800 p-6 shadow-medium border transition-all duration-200 relative ${editMode
                ? 'border-neutral-300 dark:border-neutral-600'
                : isCardVisible('severity_distribution')
                  ? 'border-neutral-200 dark:border-neutral-700'
                  : 'border-neutral-100 dark:border-neutral-800 opacity-50'
                }`}
              style={{ order: getCardOrder('severity_distribution') }}
            >
              {editMode && (
                <div className="absolute top-2 right-2 flex items-center space-x-1">
                  <button
                    onClick={() => moveCard('severity_distribution', 'up')}
                    className="p-1 rounded text-neutral-500 hover:bg-neutral-100"
                    title={i18n.language === 'en' ? 'Move Up' : 'Yukarı Taşı'}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveCard('severity_distribution', 'down')}
                    className="p-1 rounded text-neutral-500 hover:bg-neutral-100"
                    title={i18n.language === 'en' ? 'Move Down' : 'Aşağı Taşı'}
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => toggleCardVisibility('severity_distribution')}
                    className={`p-1.5 rounded transition-colors ${isCardVisible('severity_distribution')
                      ? 'bg-success-50 text-success-600 hover:bg-success-100'
                      : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                      }`}
                    title={isCardVisible('severity_distribution') ? (i18n.language === 'en' ? 'Hide' : 'Gizle') : (i18n.language === 'en' ? 'Show' : 'Göster')}
                  >
                    {isCardVisible('severity_distribution') ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
              )}
              {editMode && (
                <div className="flex items-center mb-2 text-xs text-neutral-500">
                  <GripVertical className="h-3 w-3 mr-1" />
                  {cards.find(c => c.id === 'severity_distribution')?.order || 0}
                </div>
              )}
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-accent-600 dark:text-accent-400" />
                {getCardName('severity_distribution')}
              </h3>
              <div className="space-y-3">
                {(Object.keys(severityDistribution) as Severity[]).map((severity) => {
                  const count = severityDistribution[severity]
                  const total = stats.findings
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0

                  return (
                    <div key={severity}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 capitalize">
                          {t(`severity.${severity}`)}
                        </span>
                        <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{count}</span>
                      </div>
                      <div className="w-full bg-neutral-100 dark:bg-neutral-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${severity === 'critical' ? 'bg-error-500' :
                            severity === 'high' ? 'bg-warning-500' :
                              severity === 'medium' ? 'bg-info-500' :
                                severity === 'low' ? 'bg-success-500' : 'bg-neutral-400'
                            }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Bulgu Dağılımı - Durum */}
          {(isCardVisible('status_distribution') || editMode) && (
            <div
              className={`rounded-xl bg-white dark:bg-neutral-800 p-6 shadow-medium border transition-all duration-200 relative ${editMode
                ? 'border-neutral-300 dark:border-neutral-600'
                : isCardVisible('status_distribution')
                  ? 'border-neutral-200 dark:border-neutral-700'
                  : 'border-neutral-100 dark:border-neutral-800 opacity-50'
                }`}
              style={{ order: getCardOrder('status_distribution') }}
            >
              {editMode && (
                <div className="absolute top-2 right-2 flex items-center space-x-1">
                  <button
                    onClick={() => moveCard('status_distribution', 'up')}
                    className="p-1 rounded text-neutral-500 hover:bg-neutral-100"
                    title={i18n.language === 'en' ? 'Move Up' : 'Yukarı Taşı'}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveCard('status_distribution', 'down')}
                    className="p-1 rounded text-neutral-500 hover:bg-neutral-100"
                    title={i18n.language === 'en' ? 'Move Down' : 'Aşağı Taşı'}
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => toggleCardVisibility('status_distribution')}
                    className={`p-1.5 rounded transition-colors ${isCardVisible('status_distribution')
                      ? 'bg-success-50 text-success-600 hover:bg-success-100'
                      : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                      }`}
                    title={isCardVisible('status_distribution') ? (i18n.language === 'en' ? 'Hide' : 'Gizle') : (i18n.language === 'en' ? 'Show' : 'Göster')}
                  >
                    {isCardVisible('status_distribution') ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
              )}
              {editMode && (
                <div className="flex items-center mb-2 text-xs text-neutral-500">
                  <GripVertical className="h-3 w-3 mr-1" />
                  {cards.find(c => c.id === 'status_distribution')?.order || 0}
                </div>
              )}
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
                <CheckCircle2 className="h-5 w-5 mr-2 text-success-600 dark:text-success-400" />
                {getCardName('status_distribution')}
              </h3>
              <div className="space-y-3">
                {(Object.keys(statusDistribution) as Status[]).map((status) => {
                  const count = statusDistribution[status]
                  const total = stats.findings
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0
                  const StatusIcon = statusIcons[status]

                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                          <StatusIcon className={`h-4 w-4 mr-2 ${statusColors[status]}`} />
                          {t(`status.${status}`)}
                        </span>
                        <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{count}</span>
                      </div>
                      <div className="w-full bg-neutral-100 dark:bg-neutral-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${status === 'open' ? 'bg-warning-500' :
                            status === 'in_progress' ? 'bg-info-500' :
                              status === 'resolved' ? 'bg-success-500' : 'bg-neutral-400'
                            }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}


        </div>
      )}

      {/* Bottom Cards */}
      {(isCardVisible('urgent_findings') || isCardVisible('recent_audits')) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Acil Bulgular */}
          {(isCardVisible('urgent_findings') || editMode) && (
            <div
              className={`rounded-xl bg-white dark:bg-neutral-800 p-6 shadow-medium border transition-all duration-200 relative ${editMode
                ? 'border-neutral-300 dark:border-neutral-600'
                : isCardVisible('urgent_findings')
                  ? 'border-neutral-200 dark:border-neutral-700'
                  : 'border-neutral-100 dark:border-neutral-800 opacity-50'
                }`}
              style={{ order: getCardOrder('urgent_findings') }}
            >
              {editMode && (
                <div className="absolute top-2 right-2 flex items-center space-x-1">
                  <button
                    onClick={() => moveCard('urgent_findings', 'up')}
                    className="p-1 rounded text-neutral-500 hover:bg-neutral-100"
                    title={i18n.language === 'en' ? 'Move Up' : 'Yukarı Taşı'}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveCard('urgent_findings', 'down')}
                    className="p-1 rounded text-neutral-500 hover:bg-neutral-100"
                    title={i18n.language === 'en' ? 'Move Down' : 'Aşağı Taşı'}
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => toggleCardVisibility('urgent_findings')}
                    className={`p-1.5 rounded transition-colors ${isCardVisible('urgent_findings')
                      ? 'bg-success-50 text-success-600 hover:bg-success-100'
                      : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                      }`}
                    title={isCardVisible('urgent_findings') ? (i18n.language === 'en' ? 'Hide' : 'Gizle') : (i18n.language === 'en' ? 'Show' : 'Göster')}
                  >
                    {isCardVisible('urgent_findings') ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
              )}
              {editMode && (
                <div className="flex items-center mb-2 text-xs text-neutral-500">
                  <GripVertical className="h-3 w-3 mr-1" />
                  {cards.find(c => c.id === 'urgent_findings')?.order || 0}
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-error-600" />
                  {getCardName('urgent_findings')}
                </h3>
                {urgentFindings.length > 0 && isCardVisible('urgent_findings') && (
                  <span className="text-xs bg-error-100 text-error-800 px-2 py-1 rounded-full font-medium">
                    {i18n.language === 'en'
                      ? `${urgentFindings.length} items`
                      : `${urgentFindings.length} adet`}
                  </span>
                )}
              </div>
              {urgentFindings.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-success-400 mb-2" />
                  <p className="text-neutral-600 text-sm">{t('dashboard.noUrgentFindings')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {urgentFindings.map((finding) => (
                    <div
                      key={finding.id}
                      onClick={editMode ? undefined : () => navigate('/findings')}
                      className={`p-3 rounded-lg border transition-colors dark:border-neutral-700 ${editMode
                        ? 'border-neutral-200 dark:border-neutral-700'
                        : isCardVisible('urgent_findings')
                          ? 'border-neutral-200 dark:border-neutral-700 hover:border-error-300 dark:hover:border-error-700 hover:bg-error-50 dark:hover:bg-error-900/20 cursor-pointer'
                          : 'border-neutral-100 dark:border-neutral-800'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${severityColors[finding.severity]}`}>
                              {t(`severity.${finding.severity}`)}
                            </span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${finding.status === 'open' ? 'bg-warning-100 text-warning-800' :
                              'bg-info-100 text-info-800'
                              }`}>
                              {t(`status.${finding.status}`)}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 line-clamp-1">{finding.title}</p>
                          {finding.control_reference && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{i18n.language === 'en' ? 'Control' : 'Kontrol'}: {finding.control_reference}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Son Denetimler */}
          {(isCardVisible('recent_audits') || editMode) && (
            <div
              className={`rounded-xl bg-white dark:bg-neutral-800 p-6 shadow-medium border transition-all duration-200 relative ${editMode
                ? 'border-neutral-300 dark:border-neutral-600'
                : isCardVisible('recent_audits')
                  ? 'border-neutral-200 dark:border-neutral-700'
                  : 'border-neutral-100 dark:border-neutral-800 opacity-50'
                }`}
              style={{ order: getCardOrder('recent_audits') }}
            >
              {editMode && (
                <div className="absolute top-2 right-2 flex items-center space-x-1">
                  <button
                    onClick={() => moveCard('recent_audits', 'up')}
                    className="p-1 rounded text-neutral-500 hover:bg-neutral-100"
                    title={i18n.language === 'en' ? 'Move Up' : 'Yukarı Taşı'}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveCard('recent_audits', 'down')}
                    className="p-1 rounded text-neutral-500 hover:bg-neutral-100"
                    title={i18n.language === 'en' ? 'Move Down' : 'Aşağı Taşı'}
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => toggleCardVisibility('recent_audits')}
                    className={`p-1.5 rounded transition-colors ${isCardVisible('recent_audits')
                      ? 'bg-success-50 text-success-600 hover:bg-success-100'
                      : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                      }`}
                    title={isCardVisible('recent_audits') ? (i18n.language === 'en' ? 'Hide' : 'Gizle') : (i18n.language === 'en' ? 'Show' : 'Göster')}
                  >
                    {isCardVisible('recent_audits') ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
              )}
              {editMode && (
                <div className="flex items-center mb-2 text-xs text-neutral-500">
                  <GripVertical className="h-3 w-3 mr-1" />
                  {cards.find(c => c.id === 'recent_audits')?.order || 0}
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-info-600 dark:text-info-500" />
                  {getCardName('recent_audits')}
                </h3>
                {isCardVisible('recent_audits') && (
                  <button
                    onClick={editMode ? undefined : () => navigate('/audits')}
                    className="text-xs text-accent-600 hover:text-accent-700 font-medium"
                  >
                    {t('dashboard.seeAll')}
                  </button>
                )}
              </div>
              {recentAudits.length === 0 ? (
                <div className="text-center py-8">
                  <FileCheck className="mx-auto h-12 w-12 text-neutral-400 mb-2" />
                  <p className="text-neutral-600 text-sm">{t('dashboard.noRecentAudits')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAudits.map((audit) => (
                    <div
                      key={audit.id}
                      onClick={editMode ? undefined : () => navigate('/audits')}
                      className={`p-3 rounded-lg border transition-colors dark:border-neutral-700 ${editMode
                        ? 'border-neutral-200 dark:border-neutral-700'
                        : isCardVisible('recent_audits')
                          ? 'border-neutral-200 dark:border-neutral-700 hover:border-accent-300 dark:hover:border-accent-700 hover:bg-accent-50 dark:hover:bg-accent-900/20 cursor-pointer'
                          : 'border-neutral-100 dark:border-neutral-800'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{audit.name}</p>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">{audit.standard}</span>
                            {audit.audit_date && (
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {new Date(audit.audit_date).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'tr-TR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

