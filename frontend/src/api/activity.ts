import apiClient from './client'

export interface User {
  id: number
  full_name: string
  email: string
}

export interface ActivityLog {
  id: number
  entity_type: string
  entity_id: number
  action: string
  user_id?: number
  details?: Record<string, any>
  created_at: string
  user?: User
}

export interface ActivityLogFilters {
  entity_type?: string
  entity_id?: number
  action?: string
  user_id?: number
  skip?: number
  limit?: number
}

export const activityApi = {
  getAll: (filters?: ActivityLogFilters) => {
    const params = new URLSearchParams()
    if (filters?.entity_type) params.append('entity_type', filters.entity_type)
    if (filters?.entity_id) params.append('entity_id', filters.entity_id.toString())
    if (filters?.action) params.append('action', filters.action)
    if (filters?.user_id) params.append('user_id', filters.user_id.toString())
    if (filters?.skip !== undefined) params.append('skip', filters.skip.toString())
    if (filters?.limit !== undefined) params.append('limit', filters.limit.toString())
    const queryString = params.toString()
    return apiClient.get<ActivityLog[]>(`/activity${queryString ? `?${queryString}` : ''}`)
  },
  getByEntity: (entityType: string, entityId: number, skip?: number, limit?: number) => {
    const params = new URLSearchParams()
    if (skip !== undefined) params.append('skip', skip.toString())
    if (limit !== undefined) params.append('limit', limit.toString())
    const queryString = params.toString()
    return apiClient.get<ActivityLog[]>(`/activity/${entityType}/${entityId}${queryString ? `?${queryString}` : ''}`)
  },
}





