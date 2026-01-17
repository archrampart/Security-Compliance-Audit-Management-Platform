import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { notificationsApi, Notification } from '../api/notifications'
import { Bell, Trash2, Check, CheckCheck } from 'lucide-react'

export default function Notifications() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadNotifications()
    loadUnreadCount()
  }, [filter])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const read = filter === 'all' ? undefined : filter === 'read'
      const response = await notificationsApi.getAll(read)
      setNotifications(response.data)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const response = await notificationsApi.getUnreadCount()
      setUnreadCount(response.data.count)
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  }

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationsApi.markAsRead(notificationId)
      await loadNotifications()
      await loadUnreadCount()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      await loadNotifications()
      await loadUnreadCount()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleDelete = async (notificationId: number) => {
    if (!confirm(t('notifications.deleteConfirm'))) return

    try {
      await notificationsApi.delete(notificationId)
      await loadNotifications()
      await loadUnreadCount()
    } catch (error) {
      console.error('Error deleting notification:', error)
      alert(t('notifications.deleteError'))
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read) {
      handleMarkAsRead(notification.id)
    }

    // Navigate to related entity if exists
    if (notification.related_entity_type === 'finding' && notification.related_entity_id) {
      navigate(`/findings?finding_id=${notification.related_entity_id}`)
    } else if (notification.related_entity_type === 'audit' && notification.related_entity_id) {
      navigate(`/audits?audit_id=${notification.related_entity_id}`)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'finding_assigned':
      case 'finding_due_soon':
      case 'finding_overdue':
      case 'finding_status_changed':
        return '🔍'
      case 'comment_added':
        return '💬'
      case 'audit_status_changed':
        return '📋'
      default:
        return '🔔'
    }
  }

  const getTranslatedNotification = (notification: Notification) => {
    // Extract dynamic values from message using regex
    // Find all quoted strings in message
    const quotedStrings = notification.message.match(/"([^"]+)"/g)
    const entityTitle = quotedStrings && quotedStrings.length > 0 ? quotedStrings[0].replace(/"/g, '') : ''

    let translatedTitle = ''
    let translatedMessage = ''

    switch (notification.type) {
      case 'finding_assigned':
        translatedTitle = t('notifications.types.finding_assigned.title')
        translatedMessage = entityTitle
          ? t('notifications.types.finding_assigned.message', { title: entityTitle })
          : notification.message
        break

      case 'finding_due_soon':
        translatedTitle = t('notifications.types.finding_due_soon.title')
        // Extract days from message: "..." bulgusu yakında son tarih (X gün kaldı)
        const daysMatch = notification.message.match(/\((\d+)\s*gün kaldı\)/)
        const daysLeft = daysMatch ? daysMatch[1] : '0'
        translatedMessage = entityTitle && daysLeft
          ? t('notifications.types.finding_due_soon.message', { title: entityTitle, days: daysLeft })
          : notification.message
        break

      case 'finding_overdue':
        translatedTitle = t('notifications.types.finding_overdue.title')
        // Extract days from message: "..." bulgusu son tarih geçti (X gün)
        // Pattern: "..." bulgusu son tarih geçti (X gün)
        const overdueMatch = notification.message.match(/\((\d+)\s*gün\)/)
        const daysOverdue = overdueMatch ? overdueMatch[1] : '0'
        translatedMessage = entityTitle && daysOverdue
          ? t('notifications.types.finding_overdue.message', { title: entityTitle, days: daysOverdue })
          : notification.message
        break

      case 'finding_status_changed':
        translatedTitle = t('notifications.types.finding_status_changed.title')
        // Extract status from message: "..." bulgusunun durumu "X" olarak güncellendi
        // Get second quoted string (status value)
        const statusValue = quotedStrings && quotedStrings.length > 1 ? quotedStrings[1].replace(/"/g, '') : ''
        translatedMessage = entityTitle && statusValue
          ? t('notifications.types.finding_status_changed.message', {
            title: entityTitle,
            status: t(`status.${statusValue}`, statusValue)
          })
          : notification.message
        break

      case 'comment_added':
        translatedTitle = t('notifications.types.comment_added.title')
        translatedMessage = entityTitle
          ? t('notifications.types.comment_added.message', { title: entityTitle })
          : notification.message
        break

      case 'audit_status_changed':
        translatedTitle = t('notifications.types.audit_status_changed.title')
        // Extract status from message: "..." denetiminin durumu "X" olarak güncellendi
        // Get second quoted string (status value)
        const auditStatusValue = quotedStrings && quotedStrings.length > 1 ? quotedStrings[1].replace(/"/g, '') : ''
        translatedMessage = entityTitle && auditStatusValue
          ? t('notifications.types.audit_status_changed.message', {
            title: entityTitle,
            status: t(`status.${auditStatusValue}`, auditStatusValue)
          })
          : notification.message
        break

      default:
        translatedTitle = notification.title
        translatedMessage = notification.message
    }

    return {
      title: translatedTitle,
      message: translatedMessage
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-500">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-100 dark:via-neutral-200 dark:to-neutral-100 bg-clip-text text-transparent">
              {t('notifications.title')}
            </h1>
          </div>
          <p className="mt-2 text-neutral-600">{t('notifications.subtitle')}</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center space-x-2 rounded-lg border border-accent-600 px-4 py-2 text-sm font-medium text-accent-600 hover:bg-accent-50 transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            <span>{t('notifications.markAllAsRead')}</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex space-x-2 border-b border-neutral-200 dark:border-neutral-700">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${filter === 'all'
            ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
            : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
        >
          {t('notifications.all')} ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${filter === 'unread'
            ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
            : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
        >
          {t('notifications.unread')} ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${filter === 'read'
            ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
            : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
        >
          {t('notifications.read')} ({notifications.length - unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-12 text-center">
          <Bell className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-500" />
          <h3 className="mt-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">{t('notifications.noNotifications')}</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-lg border p-4 transition-all ${!notification.read
                ? 'border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-900/10 shadow-sm'
                : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:shadow-sm'
                }`}
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3
                          className={`text-base font-medium ${!notification.read ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-700 dark:text-neutral-300'
                            }`}
                        >
                          {getTranslatedNotification(notification).title}
                        </h3>
                        {!notification.read && (
                          <span className="ml-2 h-2 w-2 flex-shrink-0 rounded-full bg-accent-600 dark:bg-accent-500 mt-2"></span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{getTranslatedNotification(notification).message}</p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-neutral-400 dark:text-neutral-500">
                        <span>
                          {new Date(notification.created_at).toLocaleString(
                            i18n.language === 'en' ? 'en-US' : 'tr-TR'
                          )}
                        </span>
                        {notification.related_entity_type && (
                          <span className="capitalize">
                            {t(`notifications.relatedTo.${notification.related_entity_type}`)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex items-center space-x-2">
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkAsRead(notification.id)
                      }}
                      className="rounded p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                      title={t('notifications.markAsRead')}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(notification.id)
                    }}
                    className="rounded p-2 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/30 transition-colors"
                    title={t('notifications.delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

