import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { auditsApi, Audit, AuditCreate, AuditStandard, AuditStatus } from '../api/audits'
import { projectsApi } from '../api/projects'
import { templatesApi } from '../api/templates'
import { Plus, Edit, Trash2, Copy, FileCheck, FileText, X } from 'lucide-react'


export default function Audits() {
  const { t, i18n } = useTranslation()
  const { user: currentUser } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [audits, setAudits] = useState<Audit[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Audit | null>(null)
  const [error, setError] = useState<string>('')
  const [formData, setFormData] = useState<AuditCreate>({
    name: '',
    description: '',
    standard: 'ISO27001',
    project_id: 0, // Will be set after projects load
    audit_date: '',
    template_id: undefined,
    status: 'planning',
    language: i18n.language || 'tr',  // Default to current language
  })

  // Bulk Selection State
  const [selectedAudits, setSelectedAudits] = useState<Set<number>>(new Set())

  // Bulk Selection Handlers
  const toggleSelectAll = () => {
    if (selectedAudits.size === audits.length) {
      setSelectedAudits(new Set())
    } else {
      setSelectedAudits(new Set(audits.map(a => a.id)))
    }
  }

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedAudits)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedAudits(newSelected)
  }

  const handleBulkDelete = async () => {
    if (!confirm(t('audits.bulkDeleteConfirm') || `Are you sure you want to delete ${selectedAudits.size} audits?`)) return

    try {
      // In a real scenario, backend should support bulk delete. 
      // For now, we'll do it sequentially or use Promise.all
      // Assuming we implement a bulk delete endpoint or just loop
      await Promise.all(Array.from(selectedAudits).map(id => auditsApi.delete(id)))
      setSelectedAudits(new Set())
      loadAudits()
      alert(t('audits.bulkDeleteSuccess') || 'Selected audits deleted successfully')
    } catch (error: any) {
      console.error('Error deleting audits:', error)
      alert(error.response?.data?.detail || t('audits.deleteError'))
    }
  }

  const standards: AuditStandard[] = ['ISO27001', 'PCI_DSS', 'KVKK', 'GDPR', 'NIST', 'CIS', 'SOC2', 'OWASP_TOP10', 'OWASP_ASVS', 'OWASP_API', 'OWASP_MOBILE', 'ISO27017', 'ISO27018', 'HIPAA', 'COBIT', 'ENISA', 'CMMC', 'FEDRAMP', 'ITIL', 'OTHER']
  const statuses: AuditStatus[] = ['planning', 'in_progress', 'completed', 'cancelled']

  const statusColors = {
    planning: 'bg-neutral-100 text-neutral-800',
    in_progress: 'bg-info-100 text-info-800',
    completed: 'bg-success-100 text-success-800',
    cancelled: 'bg-error-100 text-error-800',
  }

  const statusLabels = {
    planning: t('status.planning'),
    in_progress: t('status.in_progress'),
    completed: t('status.completed'),
    cancelled: t('status.cancelled'),
  }

  useEffect(() => {
    loadProjects()
    loadTemplates()
  }, [currentUser, i18n.language])

  useEffect(() => {
    loadAudits()
  }, [selectedProject])

  const loadAudits = async () => {
    try {
      setLoading(true)
      const response = await auditsApi.getAll(selectedProject || undefined)
      setAudits(response.data)
    } catch (error: any) {
      console.error('Error loading audits:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProjects = async () => {
    try {
      const response = await projectsApi.getAll()
      setProjects(response.data)
      // Set default project_id after projects are loaded
      if (response.data.length > 0 && formData.project_id === 0) {
        setFormData(prev => ({ ...prev, project_id: response.data[0].id }))
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const loadTemplates = async () => {
    try {
      const currentLang = i18n.language || 'tr'
      const response = await templatesApi.getAll(
        currentUser?.organization_id || undefined,
        currentLang
      )
      setTemplates(response.data)
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate project_id
    if (!formData.project_id || formData.project_id === 0) {
      setError(t('audits.selectProject'))
      return
    }

    try {
      // Prepare data for API - remove undefined values and handle date
      const apiData: any = {
        name: formData.name,
        description: formData.description || undefined,
        standard: formData.standard,
        project_id: formData.project_id,
      }

      // Only include audit_date if it's provided - convert to ISO datetime format
      if (formData.audit_date) {
        // Convert date string (YYYY-MM-DD) to ISO datetime format (YYYY-MM-DDTHH:mm:ss)
        apiData.audit_date = `${formData.audit_date}T00:00:00`
      }

      // Only include template_id if it's provided
      if (formData.template_id) {
        apiData.template_id = formData.template_id
        // Always include language if template is selected (default to current language or 'tr')
        apiData.language = formData.language || i18n.language || 'tr'
        console.log('Sending audit with language:', apiData.language, 'template_id:', apiData.template_id)
      }

      // Include status
      if (formData.status) {
        apiData.status = formData.status
      }

      if (editing) {
        await auditsApi.update(editing.id, apiData)
      } else {
        await auditsApi.create(apiData)
      }
      setShowModal(false)
      setEditing(null)
      setError('')
      resetForm()
      loadAudits()
    } catch (error: any) {
      console.error('Error saving audit:', error)
      let errorMessage = t('audits.error')
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      setError(errorMessage)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('audits.deleteConfirm'))) return
    try {
      await auditsApi.delete(id)
      loadAudits()
    } catch (error: any) {
      console.error('Error deleting audit:', error)
      alert(error.response?.data?.detail || t('common.delete') + ' ' + t('audits.error'))
    }
  }

  const handleCopy = async (id: number) => {
    const newName = prompt(t('audits.copyPrompt'))
    if (!newName) return
    try {
      await auditsApi.copy(id, newName)
      loadAudits()
    } catch (error: any) {
      console.error('Error copying audit:', error)
      alert(error.response?.data?.detail || t('audits.copy') + ' ' + t('audits.error'))
    }
  }

  const handleDownloadWord = async (id: number) => {
    try {
      const response = await auditsApi.generateWord(id)
      const url = window.URL.createObjectURL(new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }))
      const link = document.createElement('a')
      link.href = url
      // Get filename from response headers if available
      const contentDisposition = response.headers?.['content-disposition'] || response.headers?.['Content-Disposition']
      let filename = `denetim_raporu_${id}.docx`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '')
        }
      }
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Error generating Word:', error)
      alert(error.response?.data?.detail || t('audits.downloadWord') + ' ' + t('audits.error'))
    }
  }

  const handleEdit = useCallback((audit: Audit) => {
    setEditing(audit)
    setFormData({
      name: audit.name,
      description: audit.description || '',
      standard: audit.standard,
      project_id: audit.project_id,
      audit_date: audit.audit_date ? audit.audit_date.split('T')[0] : '',
      template_id: undefined,
      status: audit.status || 'planning',
      language: i18n.language || 'tr',
    })
    setShowModal(true)

    // Set the project filter if not already set
    if (audit.project_id && !selectedProject) {
      setSelectedProject(audit.project_id)
    }
  }, [i18n.language, selectedProject])

  const resetForm = () => {
    // Set default project_id - use first available project
    const defaultProjectId = projects.length > 0 ? projects[0].id : 0
    setFormData({
      name: '',
      description: '',
      standard: 'ISO27001',
      project_id: defaultProjectId,
      audit_date: '',
      template_id: undefined,
      status: 'planning',
      language: i18n.language || 'tr',
    })
  }

  // Check for audit_id in URL params and open it
  useEffect(() => {
    const auditIdParam = searchParams.get('audit_id')
    if (auditIdParam && audits.length > 0) {
      const auditId = parseInt(auditIdParam)
      if (!isNaN(auditId)) {
        // Find the audit in the list
        const audit = audits.find(a => a.id === auditId)
        if (audit) {
          handleEdit(audit)
          // Remove the parameter from URL
          setSearchParams({})
        } else {
          // If audit not in list, fetch it directly
          auditsApi.getById(auditId)
            .then(response => {
              handleEdit(response.data)
              setSearchParams({})
            })
            .catch(error => {
              console.error('Error loading audit:', error)
              setSearchParams({})
            })
        }
      }
    }
  }, [audits, searchParams, setSearchParams, handleEdit])

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-100 dark:via-neutral-200 dark:to-neutral-100 bg-clip-text text-transparent">
            {t('nav.audits')}
          </h1>
        </div>
        <button
          onClick={() => {
            setEditing(null)
            setError('')
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center space-x-2 shadow-md hover:shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>{t('common.create')}</span>
        </button>
      </div>

      {/* Bulk Actions Bar */}
      {selectedAudits.size > 0 ? (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-accent-200 bg-accent-50 p-4 dark:border-accent-800 dark:bg-accent-900/20">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-accent-900 dark:text-accent-100">
              {selectedAudits.size} {t('common.selected')}
            </span>
            <button
              onClick={() => setSelectedAudits(new Set())}
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
      ) : (
        projects.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-neutral-700 mb-2.5">{t('audits.filterProject')}</label>
            <select
              value={selectedProject || ''}
              onChange={(e) => setSelectedProject(e.target.value ? parseInt(e.target.value) : null)}
              className="select w-full max-w-xs"
            >
              <option value="">{t('audits.allProjects')}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent-600 border-r-transparent"></div>
            <p className="mt-4 text-neutral-600 font-medium">{t('common.loading')}</p>
          </div>
        </div>
      ) : audits.length === 0 ? (
        <div className="card-elevated p-16 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-accent-100 to-primary-100 flex items-center justify-center mb-6">
            <FileCheck className="h-8 w-8 text-accent-600" />
          </div>
          <p className="text-lg font-semibold text-neutral-700 mb-2">{t('common.noData')}</p>
        </div>
      ) : (
        <div className="table-container overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="table-header">
              <tr>
                <th className="table-cell w-10">
                  <input
                    type="checkbox"
                    checked={audits.length > 0 && selectedAudits.size === audits.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-neutral-300 text-accent-600 focus:ring-accent-500"
                  />
                </th>
                <th className="table-cell font-bold text-neutral-900 dark:text-neutral-100 uppercase text-xs tracking-wider">
                  {t('common.name')}
                </th>
                <th className="table-cell font-bold text-neutral-900 dark:text-neutral-100 uppercase text-xs tracking-wider">
                  {t('common.standard')}
                </th>
                <th className="table-cell font-bold text-neutral-900 dark:text-neutral-100 uppercase text-xs tracking-wider">
                  {t('common.project')}
                </th>
                <th className="table-cell font-bold text-neutral-900 dark:text-neutral-100 uppercase text-xs tracking-wider">
                  {t('common.date')}
                </th>
                <th className="table-cell font-bold text-neutral-900 dark:text-neutral-100 uppercase text-xs tracking-wider">
                  {t('common.status')}
                </th>
                <th className="table-cell font-bold text-neutral-900 dark:text-neutral-100 uppercase text-xs tracking-wider text-right">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {audits.map((audit) => {
                const project = projects.find(p => p.id === audit.project_id)
                return (
                  <tr key={audit.id} className={`table-row ${selectedAudits.has(audit.id) ? 'bg-accent-50 dark:bg-accent-900/10' : ''}`}>
                    <td className="table-cell">
                      <input
                        type="checkbox"
                        checked={selectedAudits.has(audit.id)}
                        onChange={() => toggleSelect(audit.id)}
                        className="h-4 w-4 rounded border-neutral-300 text-accent-600 focus:ring-accent-500"
                      />
                    </td>
                    <td className="table-cell">
                      <span className="font-semibold text-accent-700 dark:text-accent-400 hover:text-accent-800 dark:hover:text-accent-300 transition-colors">{audit.name}</span>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">{audit.standard}</span>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">{project?.name || audit.project_id}</span>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                        {audit.audit_date ? new Date(audit.audit_date).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'tr-TR') : '-'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${statusColors[audit.status || 'planning']} shadow-sm`}>
                        {statusLabels[audit.status || 'planning']}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex justify-end items-center space-x-1">
                        <button
                          onClick={() => handleDownloadWord(audit.id)}
                          className="rounded-lg p-2 text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/30 hover:shadow-sm transition-all duration-200"
                          title={t('audits.downloadWord')}
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleCopy(audit.id)}
                          className="rounded-lg p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:shadow-sm transition-all duration-200"
                          title={t('audits.copy')}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(audit)}
                          className="rounded-lg p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:shadow-sm transition-all duration-200"
                          title={t('common.edit')}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(audit.id)}
                          className="rounded-lg p-2 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/30 hover:shadow-sm transition-all duration-200"
                          title={t('common.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-neutral-800 shadow-2xl border border-neutral-200 dark:border-neutral-700 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-accent-50 to-primary-50 dark:from-neutral-800 dark:to-neutral-700 border-b border-neutral-200 dark:border-neutral-700 px-6 py-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-neutral-100 dark:to-neutral-300 bg-clip-text text-transparent">
                  {editing ? t('audits.edit') : t('audits.create')}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditing(null)
                    setError('')
                    resetForm()
                  }}
                  className="rounded-lg p-2 text-neutral-500 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200 hover:shadow-sm transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {error && (
                <div className="mb-6 rounded-xl bg-error-50 border border-error-200 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-error-700">{error}</span>
                    <button
                      type="button"
                      onClick={() => setError('')}
                      className="rounded-lg p-1 text-error-500 hover:bg-error-100 hover:text-error-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{t('common.project')} <span className="text-error-500">*</span></label>
                  <select
                    required
                    value={formData.project_id || ''}
                    onChange={(e) => setFormData({ ...formData, project_id: parseInt(e.target.value) })}
                    className="select"
                  >
                    <option value="">{t('common.select')}</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{t('audits.name')}</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('common.standard')}</label>
                  <select
                    required
                    value={formData.standard}
                    onChange={(e) => setFormData({ ...formData, standard: e.target.value as AuditStandard })}
                    className="input"
                  >
                    {standards.map((std) => (
                      <option key={std} value={std}>
                        {std}
                      </option>
                    ))}
                  </select>
                </div>
                {!editing && templates.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{t('audits.createFromTemplate')} <span className="text-neutral-500 font-normal">({t('common.optional')})</span></label>
                    <select
                      value={formData.template_id || ''}
                      onChange={(e) => {
                        const newTemplateId = e.target.value ? parseInt(e.target.value) : undefined
                        setFormData({
                          ...formData,
                          template_id: newTemplateId,
                          // Set default language when template is selected
                          language: newTemplateId ? (formData.language || i18n.language || 'tr') : formData.language
                        })
                      }}
                      className="input"
                    >
                      <option value="">{t('audits.dontUseTemplate')}</option>
                      {templates
                        .filter(t => t.standard === formData.standard)
                        .map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
                {!editing && formData.template_id && (
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{t('audits.templateLanguage')}</label>
                    <select
                      value={formData.language || 'tr'}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="input"
                    >
                      <option value="tr">{t('common.turkish')}</option>
                      <option value="en">{t('common.english')}</option>
                    </select>
                    <p className="mt-1 text-xs text-neutral-500">
                      {t('audits.templateLanguageDesc')}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{t('common.description')}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{t('audits.auditDate')}</label>
                    <input
                      type="date"
                      value={formData.audit_date}
                      onChange={(e) => setFormData({ ...formData, audit_date: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{t('common.status')}</label>
                    <select
                      value={formData.status || 'planning'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as AuditStatus })}
                      className="input"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditing(null)
                      setError('')
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
                    {t('common.save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
