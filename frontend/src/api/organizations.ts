import apiClient from './client'

export interface Organization {
  id: number
  name: string
  description?: string
  logo_url?: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface OrganizationCreate {
  name: string
  description?: string
  logo_url?: string
}

export interface OrganizationUpdate {
  name?: string
  description?: string
  logo_url?: string
  is_active?: boolean
}

export const organizationsApi = {
  getAll: () => apiClient.get<Organization[]>('/organizations'),
  getById: (id: number) => apiClient.get<Organization>(`/organizations/${id}`),
  create: (data: OrganizationCreate) => apiClient.post<Organization>('/organizations', data),
  update: (id: number, data: OrganizationUpdate) => apiClient.put<Organization>(`/organizations/${id}`, data),
  delete: (id: number) => apiClient.delete(`/organizations/${id}`),
}

