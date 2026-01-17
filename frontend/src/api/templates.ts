import apiClient from './client'
import { AuditStandard } from './audits'
import { Severity, Status } from './findings'

export interface TemplateItem {
  id: number
  template_id: number
  order_number: number
  control_reference?: string
  default_title: string
  default_description?: string
  default_severity: Severity
  default_status: Status
  default_recommendation?: string
  created_at: string
  updated_at?: string
}

export interface Template {
  id: number
  name: string
  description?: string
  standard: AuditStandard
  organization_id: number
  is_system?: boolean
  created_at: string
  updated_at?: string
  items: TemplateItem[]
}

export interface TemplateItemCreate {
  order_number: number
  control_reference?: string
  default_title: string
  default_description?: string
  default_severity: Severity
  default_status: Status
  default_recommendation?: string
}

export interface TemplateCreate {
  name: string
  description?: string
  standard: AuditStandard
  organization_id?: number
  items?: TemplateItemCreate[]
}

export interface TemplateUpdate {
  name?: string
  description?: string
  standard?: AuditStandard
}

export const templatesApi = {
  getAll: (organizationId?: number, lang?: string) => {
    const params = new URLSearchParams()
    if (organizationId) params.append('organization_id', organizationId.toString())
    if (lang) params.append('lang', lang)
    const queryString = params.toString()
    return apiClient.get<Template[]>(`/templates${queryString ? `?${queryString}` : ''}`)
  },
  getById: (id: number, lang?: string) => {
    const params = lang ? `?lang=${lang}` : ''
    return apiClient.get<Template>(`/templates/${id}${params}`)
  },
  create: (data: TemplateCreate) => apiClient.post<Template>('/templates', data),
  update: (id: number, data: TemplateUpdate) => apiClient.put<Template>(`/templates/${id}`, data),
  delete: (id: number) => apiClient.delete(`/templates/${id}`),
  copy: (id: number, newName?: string) => {
    return apiClient.post<Template>(`/templates/${id}/copy`, { new_name: newName || null })
  },
  createItem: (templateId: number, data: TemplateItemCreate) => 
    apiClient.post<TemplateItem>(`/templates/${templateId}/items`, data),
  updateItem: (itemId: number, data: TemplateItemCreate) => 
    apiClient.put<TemplateItem>(`/templates/items/${itemId}`, data),
  deleteItem: (itemId: number) => apiClient.delete(`/templates/items/${itemId}`),
}

