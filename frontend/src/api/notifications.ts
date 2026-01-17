import apiClient from './client'

export type NotificationType = 'finding_assigned' | 'finding_due_soon' | 'finding_overdue' | 'finding_status_changed' | 'comment_added' | 'audit_status_changed'

export interface Notification {
  id: number
  user_id: number
  type: NotificationType
  title: string
  message: string
  related_entity_type?: string
  related_entity_id?: number
  read: boolean
  created_at: string
}

export const notificationsApi = {
  getAll: (read?: boolean, skip?: number, limit?: number) => {
    const params = new URLSearchParams()
    if (read !== undefined) params.append('read', read.toString())
    if (skip !== undefined) params.append('skip', skip.toString())
    if (limit !== undefined) params.append('limit', limit.toString())
    const queryString = params.toString()
    return apiClient.get<Notification[]>(`/notifications${queryString ? `?${queryString}` : ''}`)
  },
  getUnreadCount: () => apiClient.get<{ count: number }>('/notifications/unread/count'),
  markAsRead: (notificationId: number) => 
    apiClient.put<Notification>(`/notifications/${notificationId}/read`),
  markAllAsRead: () => apiClient.put<{ updated: number }>('/notifications/read-all'),
  delete: (notificationId: number) => apiClient.delete(`/notifications/${notificationId}`),
}





