import apiClient from './client'

export interface DashboardStats {
  total_projects: number
  total_audits: number
  total_findings: number
  open_findings: number
  urgent_findings: number
  my_findings: number
  overdue_findings: number
  due_soon_findings: number
  completion_rate: number
  audit_status_distribution: Record<string, number>
  severity_distribution: Record<string, number>
  status_distribution: Record<string, number>
}

export interface TimelinePoint {
  date: string
  count: number
}

export const analyticsApi = {
  getDashboardStats: (projectId?: number) => {
    const params = projectId ? `?project_id=${projectId}` : ''
    return apiClient.get<DashboardStats>(`/analytics/dashboard${params}`)
  },
  getFindingsTimeline: (days?: number, projectId?: number) => {
    const params = new URLSearchParams()
    if (days) params.append('days', days.toString())
    if (projectId) params.append('project_id', projectId.toString())
    const queryString = params.toString()
    return apiClient.get<TimelinePoint[]>(`/analytics/findings-timeline${queryString ? `?${queryString}` : ''}`)
  },
}





