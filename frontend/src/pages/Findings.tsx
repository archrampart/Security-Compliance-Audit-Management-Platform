import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { findingsApi, Finding, FindingCreate, Severity, Status, Evidence, FindingComment } from '../api/findings'
import apiClient from '../api/client'
import { auditsApi } from '../api/audits'
import { projectsApi } from '../api/projects'
import { usersApi } from '../api/users'
import { useAuthStore } from '../store/authStore'
import { Plus, Edit, Trash2, AlertCircle, Upload, X, Image as ImageIcon, File, Download, User, Calendar, MessageSquare, Send, CheckCircle2 } from 'lucide-react'

export default function Findings() {
  const { t } = useTranslation()
  const { user: currentUser } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [findings, setFindings] = useState<Finding[]>([])
  const [audits, setAudits] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [selectedAudit, setSelectedAudit] = useState<number | null>(null)
  const [showMyFindings, setShowMyFindings] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved' | 'open' | 'in_progress' | 'closed'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Finding | null>(null)
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [evidenceDescription, setEvidenceDescription] = useState('')
  const [uploadingEvidence, setUploadingEvidence] = useState(false)
  const [showComments, setShowComments] = useState<number | null>(null)
  const [newComments, setNewComments] = useState<Record<number, string>>({})
  const [formData, setFormData] = useState<FindingCreate>({
    audit_id: 0,
    title: '',
    description: '',
    control_reference: '',
    severity: 'medium',
    status: 'open',
    recommendation: '',
    assigned_to_user_id: undefined,
    due_date: undefined,
  })

  // Bulk Selection State
  const [selectedFindings, setSelectedFindings] = useState<Set<number>>(new Set())

  // Bulk Selection Handlers
  const toggleSelectAll = () => {
    // Current filtered findings
    let currentFindings = findings.filter(f => {
      if (statusFilter === 'all') return true
      if (statusFilter === 'active') return !isResolved(f.status)
      return f.status === statusFilter
    })

    if (selectedFindings.size === currentFindings.length && currentFindings.length > 0) {
      setSelectedFindings(new Set())
    } else {
      setSelectedFindings(new Set(currentFindings.map(f => f.id)))
    }
  }

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedFindings)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedFindings(newSelected)
  }

  const handleBulkDelete = async () => {
    if (!confirm(t('findings.bulkDeleteConfirm') || `Are you sure you want to delete ${selectedFindings.size} findings?`)) return

    try {
      await Promise.all(Array.from(selectedFindings).map(id => findingsApi.delete(id)))
      setSelectedFindings(new Set())
      loadFindings()
      alert(t('findings.bulkDeleteSuccess') || 'Selected findings deleted successfully')
    } catch (error: any) {
      console.error('Error deleting findings:', error)
      alert(error.response?.data?.detail || t('findings.deleteError'))
    }
  }

  const severities: Severity[] = ['critical', 'high', 'medium', 'low', 'info']
  const statuses: Status[] = ['open', 'in_progress', 'resolved', 'closed']

  const severityColors = {
    critical: 'bg-error-100 text-error-800 border border-error-200',
    high: 'bg-warning-100 text-warning-800 border border-warning-200',
    medium: 'bg-info-100 text-info-800 border border-info-200',
    low: 'bg-success-100 text-success-800 border border-success-200',
    info: 'bg-neutral-100 text-neutral-700 border border-neutral-200',
  }

  const statusColors = {
    open: 'bg-blue-100 text-blue-800 border border-blue-200',
    in_progress: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    resolved: 'bg-green-100 text-green-800 border border-green-200',
    closed: 'bg-neutral-100 text-neutral-700 border border-neutral-200',
  }

  const isResolved = (status: Status) => status === 'resolved' || status === 'closed'

  useEffect(() => {
    loadProjects()
    loadUsers()
  }, [])

  useEffect(() => {
    loadAudits()
    // Reset selected audit and formData when project changes
    setSelectedAudit(null)
    setFormData(prev => ({ ...prev, audit_id: 0 }))
  }, [selectedProject])

  useEffect(() => {
    loadFindings()
    // Update formData when selectedAudit changes
    if (selectedAudit) {
      setFormData(prev => ({ ...prev, audit_id: selectedAudit }))
    }
  }, [selectedAudit, showMyFindings, statusFilter])

  const loadFindings = async () => {
    try {
      setLoading(true)
      const assignedToUserId = showMyFindings && currentUser ? currentUser.id : undefined
      const response = await findingsApi.getAll(selectedAudit || undefined, assignedToUserId)
      setFindings(response.data)
    } catch (error: any) {
      console.error('Error loading findings:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await usersApi.getAll()
      setUsers(response.data)
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadProjects = async () => {
    try {
      const response = await projectsApi.getAll()
      setProjects(response.data)
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const loadAudits = async () => {
    try {
      const response = await auditsApi.getAll(selectedProject || undefined)
      setAudits(response.data)
      // Set default audit_id after audits are loaded (if selectedAudit is set)
      if (selectedAudit && response.data.some(a => a.id === selectedAudit)) {
        setFormData(prev => ({ ...prev, audit_id: selectedAudit }))
      } else if (response.data.length > 0 && formData.audit_id === 0) {
        setFormData(prev => ({ ...prev, audit_id: response.data[0].id }))
      }
    } catch (error) {
      console.error('Error loading audits:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate audit_id
    if (!formData.audit_id || formData.audit_id === 0) {
      alert('Lütfen bir denetim seçin')
      return
    }

    try {
      // Prepare form data - convert due_date to ISO format if provided
      const submitData = {
        ...formData,
        due_date: formData.due_date ? `${formData.due_date}T00:00:00` : undefined,
      }

      if (editing) {
        await findingsApi.update(editing.id, submitData)
        // Reload finding to get updated data
        const updatedFinding = await findingsApi.getById(editing.id)
        setEditing(updatedFinding.data)
        // Keep modal open for evidence upload
      } else {
        const response = await findingsApi.create(submitData)
        // After creating, set as editing so user can add evidence
        const newFinding = await findingsApi.getById(response.data.id)
        setEditing(newFinding.data)
        // Keep modal open for evidence upload
      }
      loadFindings()
    } catch (error: any) {
      console.error('Error saving finding:', error)
      alert(error.response?.data?.detail || 'Hata oluştu')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('findings.deleteConfirm'))) return
    try {
      await findingsApi.delete(id)
      loadFindings()
    } catch (error: any) {
      console.error('Error deleting finding:', error)
      alert(error.response?.data?.detail || 'Silme hatası')
    }
  }

  const handleEdit = useCallback(async (finding: Finding) => {
    // Get full finding with evidences and comments
    try {
      const response = await findingsApi.getById(finding.id)
      const fullFinding = response.data
      setEditing(fullFinding)
      setFormData({
        audit_id: fullFinding.audit_id,
        title: fullFinding.title,
        description: fullFinding.description || '',
        control_reference: fullFinding.control_reference || '',
        severity: fullFinding.severity,
        status: fullFinding.status,
        recommendation: fullFinding.recommendation || '',
        assigned_to_user_id: fullFinding.assigned_to_user_id || undefined,
        due_date: fullFinding.due_date ? fullFinding.due_date.split('T')[0] : undefined,
      })
      setEvidenceFile(null)
      setEvidenceDescription('')
      setShowModal(true)

      // Set the audit filter if not already set
      if (fullFinding.audit_id && !selectedAudit) {
        setSelectedAudit(fullFinding.audit_id)
      }
    } catch (error: any) {
      console.error('Error loading finding:', error)
      // Fallback to basic finding data
      setEditing(finding)
      setFormData({
        audit_id: finding.audit_id,
        title: finding.title,
        description: finding.description || '',
        control_reference: finding.control_reference || '',
        severity: finding.severity,
        status: finding.status,
        recommendation: finding.recommendation || '',
        assigned_to_user_id: finding.assigned_to_user_id || undefined,
        due_date: finding.due_date ? finding.due_date.split('T')[0] : undefined,
      })
      setShowModal(true)

      // Set the audit filter if not already set
      if (finding.audit_id && !selectedAudit) {
        setSelectedAudit(finding.audit_id)
      }
    }
  }, [selectedAudit])

  // Check for finding_id in URL params and open it
  useEffect(() => {
    const findingIdParam = searchParams.get('finding_id')
    if (findingIdParam && findings.length > 0) {
      const findingId = parseInt(findingIdParam)
      if (!isNaN(findingId)) {
        // Find the finding in the list
        const finding = findings.find(f => f.id === findingId)
        if (finding) {
          handleEdit(finding)
          // Remove the parameter from URL
          setSearchParams({})
        } else {
          // If finding not in list, fetch it directly
          findingsApi.getById(findingId)
            .then(response => {
              handleEdit(response.data)
              setSearchParams({})
            })
            .catch(error => {
              console.error('Error loading finding:', error)
              setSearchParams({})
            })
        }
      }
    }
  }, [findings, searchParams, setSearchParams, handleEdit])

  const handleAddComment = async (findingId: number) => {
    const comment = newComments[findingId]?.trim()
    if (!comment) return

    try {
      await findingsApi.createComment(findingId, { comment })
      setNewComments(prev => ({ ...prev, [findingId]: '' }))
      // Reload finding to get updated comments
      if (editing?.id === findingId) {
        const updatedFinding = await findingsApi.getById(findingId)
        setEditing(updatedFinding.data)
      }
      loadFindings()
    } catch (error: any) {
      console.error('Error adding comment:', error)
      alert(error.response?.data?.detail || t('findings.commentError') || 'Comment error')
    }
  }

  const handleDeleteComment = async (commentId: number, findingId: number) => {
    if (!confirm('Bu yorumu silmek istediğinizden emin misiniz?')) return

    try {
      await findingsApi.deleteComment(commentId)
      // Reload finding to get updated comments
      // Reload finding to get updated comments
      if (editing?.id === findingId) {
        const updatedFinding = await findingsApi.getById(findingId)
        setEditing(updatedFinding.data)
      }
      loadFindings()
    } catch (error: any) {
      console.error('Error deleting comment:', error)
      alert(error.response?.data?.detail || t('findings.commentDeleteError') || 'Comment delete error')
    }
  }

  const resetForm = () => {
    setFormData({
      audit_id: 0,
      title: '',
      description: '',
      control_reference: '',
      severity: 'medium',
      status: 'open',
      recommendation: '',
      assigned_to_user_id: undefined,
      due_date: undefined,
    })
  }

  const isOverdue = (dueDate: string | undefined) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const isDueSoon = (dueDate: string | undefined) => {
    if (!dueDate) return false
    const due = new Date(dueDate)
    const now = new Date()
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    return due >= now && due <= threeDaysLater
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-100 dark:via-neutral-200 dark:to-neutral-100 bg-clip-text text-transparent">
            {t('nav.findings')}
          </h1>
        </div>
        {selectedAudit && (
          <button
            onClick={() => {
              setEditing(null)
              resetForm()
              setShowModal(true)
            }}
            className="btn-primary flex items-center space-x-2 shadow-md hover:shadow-lg"
          >
            <Plus className="h-5 w-5" />
            <span>{t('common.create')}</span>
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-4">
        {projects.length > 0 && (
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700 mb-2">{t('findings.filterProject')}</label>
            <select
              value={selectedProject || ''}
              onChange={(e) => setSelectedProject(e.target.value ? parseInt(e.target.value) : null)}
              className="select"
            >
              <option value="">{t('findings.allProjects')}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {audits.length > 0 && (
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700 mb-2">{t('findings.filterAudit')}</label>
            <select
              value={selectedAudit || ''}
              onChange={(e) => setSelectedAudit(e.target.value ? parseInt(e.target.value) : null)}
              className="select"
              disabled={selectedProject !== null && audits.length === 0}
            >
              <option value="">{t('findings.allAudits')}</option>
              {audits.map((audit) => (
                <option key={audit.id} value={audit.id}>
                  {audit.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700 mb-2">{t('findings.filterStatus')}</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'resolved' | 'open' | 'in_progress' | 'closed')}
            className="select"
          >
            <option value="all">{t('findings.allStatuses')}</option>
            <option value="active">{t('findings.activeStatuses')}</option>
            <option value="open">{t('status.open')}</option>
            <option value="in_progress">{t('status.in_progress')}</option>
            <option value="resolved">{t('findings.resolvedStatuses')}</option>
            <option value="closed">{t('status.closed')}</option>
          </select>
        </div>
        {currentUser && (
          <div className="flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showMyFindings}
                onChange={(e) => setShowMyFindings(e.target.checked)}
                className="rounded border-neutral-300"
              />
              <span className="text-sm font-medium text-neutral-700">{t('findings.myFindings')}</span>
            </label>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedFindings.size > 0 && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-accent-200 bg-accent-50 p-4 dark:border-accent-800 dark:bg-accent-900/20">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-accent-900 dark:text-accent-100">
              {selectedFindings.size} {t('common.selected')}
            </span>
            <button
              onClick={() => setSelectedFindings(new Set())}
              className="ml-2 text-sm text-accent-700 hover:text-accent-900 dark:text-accent-300 dark:hover:text-accent-100"
            >
              ({t('common.clearSelection') || 'Temizle'})
            </button>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleBulkDelete}
              className="flex items-center space-x-1 rounded bg-error-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-error-700"
            >
              <Trash2 className="h-4 w-4" />
              <span>{t('common.deleteSelected') || 'Seçilenleri Sil'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Select All Checkbox for Cards View */}
      {findings.length > 0 && (selectedAudit || showMyFindings) && (
        <div className="mb-4 flex items-center space-x-2 px-1">
          <input
            type="checkbox"
            id="selectAllFindings"
            checked={findings.length > 0 && selectedFindings.size > 0 && selectedFindings.size === findings.filter(f => {
              if (statusFilter === 'all') return true
              if (statusFilter === 'active') return !isResolved(f.status)
              return f.status === statusFilter
            }).length}
            onChange={toggleSelectAll}
            className="h-4 w-4 rounded border-neutral-300 text-accent-600 focus:ring-accent-500"
          />
          <label htmlFor="selectAllFindings" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
            {t('common.selectAll') || 'Tümünü Seç'}
          </label>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent-600 border-r-transparent"></div>
            <p className="mt-4 text-neutral-600 font-medium">{t('common.loading')}</p>
          </div>
        </div>
      ) : findings.length === 0 ? (
        <div className="card-elevated p-16 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-warning-100 to-error-100 flex items-center justify-center mb-6">
            <AlertCircle className="h-8 w-8 text-warning-600" />
          </div>
          <p className="text-lg font-semibold text-neutral-700 mb-2">{t('common.noData')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {findings
            .filter((finding) => {
              if (statusFilter === 'all') {
                return true
              } else if (statusFilter === 'active') {
                return !isResolved(finding.status)
              } else if (statusFilter === 'resolved') {
                return finding.status === 'resolved'
              } else if (statusFilter === 'open') {
                return finding.status === 'open'
              } else if (statusFilter === 'in_progress') {
                return finding.status === 'in_progress'
              } else if (statusFilter === 'closed') {
                return finding.status === 'closed'
              }
              return true
            })
            .sort((a, b) => {
              // Active findings first, then resolved ones
              const aResolved = isResolved(a.status)
              const bResolved = isResolved(b.status)
              if (aResolved !== bResolved) {
                return aResolved ? 1 : -1
              }
              return 0
            })
            .map((finding) => {
              const resolved = isResolved(finding.status)
              return (
                <div
                  key={finding.id}
                  className={`group relative overflow-hidden rounded-2xl border p-6 shadow-md transition-all duration-300 ${resolved
                    ? 'border-neutral-200/60 dark:border-neutral-700/60 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 opacity-75 hover:opacity-90 hover:shadow-lg'
                    : 'border-neutral-200 dark:border-neutral-700 bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 hover:shadow-xl hover:border-accent-200 dark:hover:border-accent-700 hover:-translate-y-1'
                    } ${selectedFindings.has(finding.id) ? 'ring-2 ring-accent-500 dark:ring-accent-400' : ''}`}
                >
                  <div className="absolute top-4 right-4 z-20">
                    <input
                      type="checkbox"
                      checked={selectedFindings.has(finding.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        toggleSelect(finding.id)
                      }}
                      className="h-5 w-5 rounded border-neutral-300 text-accent-600 focus:ring-accent-500 cursor-pointer"
                    />
                  </div>
                  {!resolved && (
                    <div className="absolute inset-0 bg-gradient-to-br from-accent-50/0 to-primary-50/0 dark:from-accent-900/0 dark:to-primary-900/0 group-hover:from-accent-50/20 dark:group-hover:from-accent-900/10 group-hover:to-primary-50/10 dark:group-hover:to-primary-900/10 transition-all duration-300 pointer-events-none rounded-2xl" />
                  )}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center space-x-3 flex-wrap">
                        <div className="flex items-center space-x-2">
                          {resolved && (
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0" />
                          )}
                          <h3 className={`text-lg font-semibold ${resolved ? 'line-through text-neutral-500 dark:text-neutral-500' : 'text-neutral-900 dark:text-neutral-100'}`}>
                            {finding.title}
                          </h3>
                        </div>
                        <span className={`badge shadow-sm ${severityColors[finding.severity]}`}>
                          {t(`severity.${finding.severity}`)}
                        </span>
                        <span className={`badge shadow-sm flex items-center space-x-1 ${statusColors[finding.status]}`}>
                          {resolved && <CheckCircle2 className="h-3 w-3" />}
                          <span>{t(`status.${finding.status}`)}</span>
                        </span>
                        {finding.assigned_to && (
                          <span className="flex items-center space-x-1 rounded-full bg-accent-100 dark:bg-accent-900/30 px-2 py-1 text-xs font-medium text-accent-800 dark:text-accent-300">
                            <User className="h-3 w-3" />
                            <span>{finding.assigned_to.full_name}</span>
                          </span>
                        )}
                        {finding.due_date && (
                          <span className={`flex items-center space-x-1 rounded-full px-2 py-1 text-xs font-medium ${isOverdue(finding.due_date)
                            ? 'bg-error-100 dark:bg-error-900/30 text-error-800 dark:text-error-300'
                            : isDueSoon(finding.due_date)
                              ? 'bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-300'
                              : 'bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-300'
                            }`}>
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(finding.due_date).toLocaleDateString('tr-TR')}</span>
                            {isOverdue(finding.due_date) && <span className="ml-1">({t('findings.overdue')})</span>}
                            {isDueSoon(finding.due_date) && !isOverdue(finding.due_date) && <span className="ml-1">({t('findings.dueSoon')})</span>}
                          </span>
                        )}
                      </div>
                      {finding.control_reference && (
                        <p className={`mb-2 text-sm ${resolved ? 'text-neutral-400 dark:text-neutral-500' : 'text-neutral-600 dark:text-neutral-400'}`}>
                          <strong>{t('findings.controlReference')}:</strong> {finding.control_reference}
                        </p>
                      )}
                      {finding.description && (
                        <p className={`mb-2 text-sm ${resolved ? 'text-neutral-400 dark:text-neutral-500' : 'text-neutral-700 dark:text-neutral-300'}`}>{finding.description}</p>
                      )}
                      {finding.recommendation && (
                        <div className={`mt-2 rounded p-3 ${resolved ? 'bg-neutral-100 dark:bg-neutral-800' : 'bg-info-50 dark:bg-info-900/20'}`}>
                          <p className={`text-sm font-medium ${resolved ? 'text-neutral-500 dark:text-neutral-400' : 'text-info-900 dark:text-info-300'}`}>{t('findings.recommendation')}:</p>
                          <p className={`text-sm ${resolved ? 'text-neutral-400 dark:text-neutral-500' : 'text-info-800 dark:text-info-400'}`}>{finding.recommendation}</p>
                        </div>
                      )}
                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('findings.evidences')}</p>
                          <button
                            onClick={() => handleEdit(finding)}
                            className="flex items-center space-x-1 rounded bg-accent-600 px-2 py-1 text-xs text-white hover:bg-accent-700"
                          >
                            <Upload className="h-3 w-3" />
                            <span>{t('findings.addEvidence')}</span>
                          </button>
                        </div>
                        {finding.evidences && finding.evidences.length > 0 ? (
                          <div className="space-y-2">
                            {finding.evidences.map((evidence) => (
                              <div key={evidence.id} className="flex items-center justify-between rounded border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-2">
                                <div className="flex items-center space-x-2">
                                  {evidence.file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                    <ImageIcon className="h-4 w-4 text-info-600 dark:text-info-400" />
                                  ) : (
                                    <File className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                                  )}
                                  <div>
                                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{evidence.file_name}</p>
                                    {evidence.description && (
                                      <p className="text-xs text-neutral-600 dark:text-neutral-400">{evidence.description}</p>
                                    )}
                                    {evidence.file_size && (
                                      <p className="text-xs text-neutral-500 dark:text-neutral-500">
                                        {(evidence.file_size / 1024).toFixed(2)} KB
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={async () => {
                                      try {
                                        const response = await apiClient.get(`/findings/evidences/${evidence.id}/download`, {
                                          responseType: 'blob',
                                        })
                                        const url = window.URL.createObjectURL(new Blob([response.data]))
                                        const link = document.createElement('a')
                                        link.href = url
                                        link.setAttribute('download', evidence.file_name)
                                        document.body.appendChild(link)
                                        link.click()
                                        link.remove()
                                        window.URL.revokeObjectURL(url)
                                      } catch (error: any) {
                                        console.error('Error downloading evidence:', error)
                                        alert(t('findings.downloadError'))
                                      }
                                    }}
                                    className="rounded p-1 text-info-600 dark:text-info-400 hover:bg-info-50 dark:hover:bg-info-900/30"
                                    title={t('common.download')}
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (confirm(t('findings.deleteEvidenceConfirm'))) {
                                        try {
                                          await findingsApi.deleteEvidence(evidence.id)
                                          loadFindings()
                                        } catch (error: any) {
                                          alert(error.response?.data?.detail || t('findings.deleteError'))
                                        }
                                      }
                                    }}
                                    className="rounded p-1 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/30"
                                    title={t('common.delete')}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-neutral-500">Henüz kanıt eklenmemiş</p>
                        )}
                      </div>

                      {/* Comments Section */}
                      <div className="mt-4">
                        <button
                          onClick={() => setShowComments(showComments === finding.id ? null : finding.id)}
                          className="flex items-center space-x-2 text-sm font-medium text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300"
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span>{t('common.comments') || 'Comments'} ({finding.comments?.length || 0})</span>
                        </button>
                        {showComments === finding.id && (
                          <div className="mt-3 space-y-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-4">
                            {finding.comments && finding.comments.length > 0 ? (
                              <div className="space-y-3">
                                {finding.comments.map((comment: FindingComment) => (
                                  <div key={comment.id} className="rounded bg-white dark:bg-neutral-700 p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <User className="h-3 w-3 text-neutral-500 dark:text-neutral-400" />
                                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                          {comment.user?.full_name || 'Bilinmeyen Kullanıcı'}
                                        </span>
                                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                          {new Date(comment.created_at).toLocaleString('tr-TR')}
                                        </span>
                                      </div>
                                      {(comment.user_id === currentUser?.id || currentUser?.role === 'platform_admin' || currentUser?.role === 'org_admin') && (
                                        <button
                                          onClick={() => handleDeleteComment(comment.id, finding.id)}
                                          className="rounded p-1 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/30"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-sm text-neutral-700 dark:text-neutral-200">{comment.comment}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-neutral-500">Henüz yorum yapılmamış</p>
                            )}
                            <div className="flex space-x-2">
                              <textarea
                                value={newComments[finding.id] || ''}
                                onChange={(e) => setNewComments(prev => ({ ...prev, [finding.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.ctrlKey) {
                                    handleAddComment(finding.id)
                                  }
                                }}
                                className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
                                rows={2}
                                placeholder={t('common.writeComment') || 'Write a comment... (Ctrl+Enter to send)'}
                              />
                              <button
                                onClick={() => handleAddComment(finding.id)}
                                disabled={!newComments[finding.id]?.trim()}
                                className="flex items-center space-x-2 rounded-lg bg-accent-600 px-3 py-2 text-sm text-white hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Send className="h-4 w-4" />
                                <span>Gönder</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2 mr-6">
                      <button
                        onClick={() => handleEdit(finding)}
                        className="rounded p-1 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(finding.id)}
                        className="rounded p-1 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white dark:bg-neutral-800 p-6 shadow-large ring-1 ring-neutral-200 dark:ring-neutral-700">
            <h2 className="mb-4 text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {editing ? t('findings.edit') : t('findings.create')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {audits.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{t('nav.audits')} <span className="text-error-500">*</span></label>
                  <select
                    required
                    value={formData.audit_id || ''}
                    onChange={(e) => setFormData({ ...formData, audit_id: parseInt(e.target.value) })}
                    className="input"
                  >
                    <option value="">{t('common.select')}</option>
                    {audits.map((audit: any) => (
                      <option key={audit.id} value={audit.id}>
                        {audit.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{t('common.name')}</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{t('findings.controlReference')}</label>
                <input
                  type="text"
                  value={formData.control_reference}
                  onChange={(e) => setFormData({ ...formData, control_reference: e.target.value })}
                  placeholder="E.g: A.5.1.1"
                  className="mt-1 block w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{t('common.severity') || 'Severity'}</label>
                  <select
                    required
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as Severity })}
                    className="input"
                  >
                    {severities.map((sev) => (
                      <option key={sev} value={sev}>
                        {t(`severity.${sev}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{t('common.status')}</label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Status })}
                    className="input"
                  >
                    {statuses.map((stat) => (
                      <option key={stat} value={stat}>
                        {t(`status.${stat}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{t('common.description')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{t('findings.recommendation')}</label>
                <textarea
                  value={formData.recommendation}
                  onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{t('common.assignedTo')}</label>
                  <select
                    value={formData.assigned_to_user_id || ''}
                    onChange={(e) => setFormData({ ...formData, assigned_to_user_id: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="input"
                  >
                    <option value="">{t('common.unassigned') || 'Unassigned'}</option>
                    {users.filter(u => u.is_active).map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{t('common.dueDate')}</label>
                  <input
                    type="date"
                    value={formData.due_date || ''}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value || undefined })}
                    className="input"
                  />
                </div>
              </div>

              {/* Kanıt Yükleme Bölümü */}
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700/50 p-4">
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{t('findings.addEvidence')}</label>
                <div className="space-y-3">
                  <div>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                      onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent-50 file:text-accent-700 hover:file:bg-accent-100"
                    />
                    {evidenceFile && (
                      <p className="mt-2 text-sm text-neutral-600">
                        Seçilen: {evidenceFile.name} ({(evidenceFile.size / 1024).toFixed(2)} KB)
                      </p>
                    )}
                  </div>
                  <div>
                    <textarea
                      value={evidenceDescription}
                      onChange={(e) => setEvidenceDescription(e.target.value)}
                      className="block w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm"
                      rows={2}
                      placeholder="Kanıt hakkında açıklama (opsiyonel)..."
                    />
                  </div>
                  {evidenceFile && editing && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setUploadingEvidence(true)
                          await findingsApi.uploadEvidence(editing.id, evidenceFile, evidenceDescription)
                          setEvidenceFile(null)
                          setEvidenceDescription('')
                          // Reload finding to get updated evidences
                          const updatedFinding = await findingsApi.getById(editing.id)
                          setEditing(updatedFinding.data)
                          alert('Kanıt başarıyla yüklendi!')
                        } catch (error: any) {
                          console.error('Error uploading evidence:', error)
                          alert(error.response?.data?.detail || 'Yükleme hatası')
                        } finally {
                          setUploadingEvidence(false)
                        }
                      }}
                      disabled={uploadingEvidence}
                      className="flex items-center space-x-2 rounded-lg bg-accent-600 px-3 py-2 text-sm text-white hover:bg-accent-700 disabled:opacity-50"
                    >
                      {uploadingEvidence ? (
                        <span>{t('common.loading')}</span>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          <span>Kanıtı Yükle</span>
                        </>
                      )}
                    </button>
                  )}
                  {!editing && evidenceFile && (
                    <p className="text-xs text-neutral-500 italic">
                      Not: Kanıt yüklemek için önce bulguyu kaydedin, sonra düzenleme modunda kanıt ekleyebilirsiniz.
                    </p>
                  )}
                  {/* Mevcut kanıtları göster - sadece düzenleme modunda */}
                  {editing && editing.evidences && editing.evidences.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-neutral-700">{t('findings.evidences')}:</p>
                      {editing.evidences.map((evidence: Evidence) => (
                        <div key={evidence.id} className="flex items-center justify-between rounded border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 p-2">
                          <div className="flex items-center space-x-2">
                            {evidence.file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                              <ImageIcon className="h-3 w-3 text-info-600" />
                            ) : (
                              <File className="h-3 w-3 text-neutral-600" />
                            )}
                            <span className="text-xs text-neutral-700 dark:text-neutral-300">{evidence.file_name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm('Bu kanıtı silmek istediğinizden emin misiniz?')) {
                                try {
                                  await findingsApi.deleteEvidence(evidence.id)
                                  // Reload finding to get updated evidences
                                  const updatedFinding = await findingsApi.getById(editing.id)
                                  setEditing(updatedFinding.data)
                                  loadFindings()
                                } catch (error: any) {
                                  alert(error.response?.data?.detail || 'Silme hatası')
                                }
                              }
                            }}
                            className="rounded p-1 text-error-600 hover:bg-error-50"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditing(null)
                    setEvidenceFile(null)
                    setEvidenceDescription('')
                    resetForm()
                  }}
                  className="btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editing ? t('common.update') : t('common.save')}
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditing(null)
                      setEvidenceFile(null)
                      setEvidenceDescription('')
                      resetForm()
                      loadFindings()
                    }}
                    className="rounded-lg bg-neutral-600 px-4 py-2 text-white hover:bg-neutral-700"
                  >
                    Kapat
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
