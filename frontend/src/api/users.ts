import apiClient from './client'

export interface User {
  id: number
  email: string
  full_name: string
  role: 'platform_admin' | 'org_admin' | 'auditor'
  organization_id?: number
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface UserCreate {
  email: string
  full_name: string
  password: string
  role: 'platform_admin' | 'org_admin' | 'auditor'
  organization_id?: number
  is_active?: boolean
}

export interface UserUpdate {
  email?: string
  full_name?: string
  role?: 'platform_admin' | 'org_admin' | 'auditor'
  organization_id?: number
  is_active?: boolean
}

export interface ChangePasswordData {
  current_password: string
  new_password: string
}

export const usersApi = {
  getAll: (organizationId?: number) => {
    const params = organizationId ? `?organization_id=${organizationId}` : ''
    return apiClient.get<User[]>(`/users${params}`)
  },
  getById: (id: number) => apiClient.get<User>(`/users/${id}`),
  create: (data: UserCreate) => apiClient.post<User>('/users', data),
  update: (id: number, data: UserUpdate) => apiClient.put<User>(`/users/${id}`, data),
  delete: (id: number) => apiClient.delete(`/users/${id}`),
  changePassword: (data: ChangePasswordData) => apiClient.post('/users/me/change-password', data),
}

