import apiClient from './client'

export type AuditStandard = 'ISO27001' | 'PCI_DSS' | 'KVKK' | 'GDPR' | 'NIST' | 'CIS' | 'SOC2' | 'OWASP_TOP10' | 'OWASP_ASVS' | 'OWASP_API' | 'OWASP_MOBILE' | 'ISO27017' | 'ISO27018' | 'HIPAA' | 'COBIT' | 'ENISA' | 'CMMC' | 'FEDRAMP' | 'ITIL' | 'OTHER'
export type AuditStatus = 'planning' | 'in_progress' | 'completed' | 'cancelled'

export interface Audit {
  id: number
  name: string
  description?: string
  standard: AuditStandard
  project_id: number
  audit_date?: string
  status: AuditStatus
  created_at: string
  updated_at?: string
}

export interface AuditCreate {
  name: string
  description?: string
  standard: AuditStandard
  project_id: number
  audit_date?: string
  template_id?: number
  status?: AuditStatus
  language?: string  // Language for template items (tr/en)
}

export interface AuditUpdate {
  name?: string
  description?: string
  standard?: AuditStandard
  audit_date?: string
  status?: AuditStatus
}

export const auditsApi = {
  getAll: (projectId?: number) => {
    const params = projectId ? `?project_id=${projectId}` : ''
    return apiClient.get<Audit[]>(`/audits${params}`)
  },
  getById: (id: number) => apiClient.get<Audit>(`/audits/${id}`),
  create: (data: AuditCreate) => apiClient.post<Audit>('/audits', data),
  update: (id: number, data: AuditUpdate) => apiClient.put<Audit>(`/audits/${id}`, data),
  delete: (id: number) => apiClient.delete(`/audits/${id}`),
  copy: (id: number, newName: string) => apiClient.post<Audit>(`/audits/${id}/copy?new_name=${encodeURIComponent(newName)}`),
  generateWord: (id: number) => apiClient.get(`/reports/audit/${id}/word`, { responseType: 'blob' }),
}

