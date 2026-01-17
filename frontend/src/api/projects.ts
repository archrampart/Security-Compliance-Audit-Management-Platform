import apiClient from './client'

export interface Project {
  id: number
  name: string
  description?: string
  organization_id: number
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface ProjectCreate {
  name: string
  description?: string
  organization_id: number
  user_ids?: number[]
}

export interface ProjectUpdate {
  name?: string
  description?: string
  is_active?: boolean
  user_ids?: number[]
}

export const projectsApi = {
  getAll: (organizationId?: number) => {
    const params = organizationId ? `?organization_id=${organizationId}` : ''
    return apiClient.get<Project[]>(`/projects${params}`)
  },
  getById: (id: number) => apiClient.get<Project>(`/projects/${id}`),
  create: (data: ProjectCreate) => apiClient.post<Project>('/projects', data),
  update: (id: number, data: ProjectUpdate) => apiClient.put<Project>(`/projects/${id}`, data),
  delete: (id: number) => apiClient.delete(`/projects/${id}`),
  copy: (id: number, newName: string) => apiClient.post<Project>(`/projects/${id}/copy?new_name=${encodeURIComponent(newName)}`),
}

