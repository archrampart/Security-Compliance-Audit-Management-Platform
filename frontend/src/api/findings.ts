import apiClient from './client'

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type Status = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface User {
  id: number
  full_name: string
  email: string
}

export interface Evidence {
  id: number
  finding_id: number
  file_path: string
  file_name: string
  file_size?: number
  description?: string
  created_at: string
}

export interface FindingComment {
  id: number
  finding_id: number
  user_id: number
  comment: string
  created_at: string
  user?: User
}

export interface Finding {
  id: number
  audit_id: number
  title: string
  description?: string
  control_reference?: string
  severity: Severity
  status: Status
  recommendation?: string
  assigned_to_user_id?: number
  due_date?: string
  created_at: string
  updated_at?: string
  evidences: Evidence[]
  comments: FindingComment[]
  assigned_to?: User
}

export interface FindingCreate {
  audit_id: number
  title: string
  description?: string
  control_reference?: string
  severity: Severity
  status: Status
  recommendation?: string
  assigned_to_user_id?: number
  due_date?: string
}

export interface FindingUpdate {
  title?: string
  description?: string
  control_reference?: string
  severity?: Severity
  status?: Status
  recommendation?: string
  assigned_to_user_id?: number
  due_date?: string
}

export interface FindingCommentCreate {
  comment: string
}

export const findingsApi = {
  getAll: (auditId?: number, assignedToUserId?: number) => {
    const params = new URLSearchParams()
    if (auditId) params.append('audit_id', auditId.toString())
    if (assignedToUserId) params.append('assigned_to_user_id', assignedToUserId.toString())
    const queryString = params.toString()
    return apiClient.get<Finding[]>(`/findings${queryString ? `?${queryString}` : ''}`)
  },
  getById: (id: number) => apiClient.get<Finding>(`/findings/${id}`),
  create: (data: FindingCreate) => apiClient.post<Finding>('/findings', data),
  update: (id: number, data: FindingUpdate) => apiClient.put<Finding>(`/findings/${id}`, data),
  delete: (id: number) => apiClient.delete(`/findings/${id}`),
  uploadEvidence: (findingId: number, file: File, description?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (description) {
      formData.append('description', description)
    }
    return apiClient.post<Evidence>(`/findings/${findingId}/evidences`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  deleteEvidence: (evidenceId: number) => apiClient.delete(`/findings/evidences/${evidenceId}`),
  // Comments
  getComments: (findingId: number) => apiClient.get<FindingComment[]>(`/findings/${findingId}/comments`),
  createComment: (findingId: number, data: FindingCommentCreate) => 
    apiClient.post<FindingComment>(`/findings/${findingId}/comments`, data),
  deleteComment: (commentId: number) => apiClient.delete(`/findings/comments/${commentId}`),
}

