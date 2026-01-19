import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import { projectsApi, Project, ProjectCreate } from '../api/projects'
import { organizationsApi } from '../api/organizations'
import { usersApi } from '../api/users'
import { Plus, Edit, Trash2, Copy, FolderOpen } from 'lucide-react'
import { useConfirmDialog } from '../store/confirmDialogStore'

export default function Projects() {
  const { t } = useTranslation()
  const { user: currentUser } = useAuthStore()
  const { openDialog } = useConfirmDialog()
  const [projects, setProjects] = useState<Project[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [formData, setFormData] = useState<ProjectCreate>({
    name: '',
    description: '',
    organization_id: 0, // Will be set after organizations load
    user_ids: [],
  })

  useEffect(() => {
    loadProjects()
    loadOrganizations()
    loadUsers()
  }, [currentUser])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const response = await projectsApi.getAll()
      setProjects(response.data)
    } catch (error: any) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOrganizations = async () => {
    try {
      const response = await organizationsApi.getAll()
      setOrganizations(response.data)
      // Set default organization_id after organizations are loaded
      if (response.data.length > 0 && formData.organization_id === 0) {
        const defaultOrgId = currentUser?.organization_id || response.data[0].id
        setFormData(prev => ({ ...prev, organization_id: defaultOrgId }))
      }
    } catch (error) {
      console.error('Error loading organizations:', error)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate organization_id
    if (!formData.organization_id || formData.organization_id === 0) {
      alert('Lütfen bir organizasyon seçin')
      return
    }

    try {
      if (editing) {
        await projectsApi.update(editing.id, formData)
      } else {
        await projectsApi.create(formData)
      }
      setShowModal(false)
      setEditing(null)
      resetForm()
      loadProjects()
    } catch (error: any) {
      console.error('Error saving project:', error)
      alert(error.response?.data?.detail || 'Hata oluştu')
    }
  }

  const handleDelete = async (id: number) => {
    openDialog(
      t('projects.deleteConfirm'),
      async () => {
        try {
          await projectsApi.delete(id)
          loadProjects()
        } catch (error: any) {
          console.error('Error deleting project:', error)
          alert(error.response?.data?.detail || t('projects.deleteError'))
        }
      },
      t('common.delete')
    )
  }

  const handleCopy = async (id: number) => {
    const newName = prompt('Yeni proje adı:')
    if (!newName) return
    try {
      await projectsApi.copy(id, newName)
      loadProjects()
    } catch (error: any) {
      console.error('Error copying project:', error)
      alert(error.response?.data?.detail || 'Kopyalama hatası')
    }
  }

  const handleEdit = (project: Project) => {
    setEditing(project)
    setFormData({
      name: project.name,
      description: project.description || '',
      organization_id: project.organization_id,
      user_ids: [],
    })
    setShowModal(true)
  }

  const resetForm = () => {
    // Set default organization_id - use first available organization or current user's org
    const defaultOrgId = currentUser?.organization_id || (organizations.length > 0 ? organizations[0].id : 0)
    setFormData({
      name: '',
      description: '',
      organization_id: defaultOrgId,
      user_ids: [],
    })
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-100 dark:via-neutral-200 dark:to-neutral-100 bg-clip-text text-transparent">
            {t('nav.projects')}
          </h1>
        </div>
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
      </div>

      {loading ? (
        <div className="text-center py-12">{t('common.loading')}</div>
      ) : projects.length === 0 ? (
        <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <FolderOpen className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-500 mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">{t('common.noData')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 shadow-soft hover:shadow-lg transition-shadow">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{project.name}</h3>
                  {project.description && (
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">{project.description}</p>
                  )}
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleCopy(project.id)}
                    className="rounded p-1 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    title="Kopyala"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(project)}
                    className="rounded p-1 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="rounded p-1 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className={project.is_active ? 'text-success-600 dark:text-success-400' : 'text-neutral-400'}>
                  {project.is_active ? 'Aktif' : 'Pasif'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-neutral-800 p-6 shadow-large ring-1 ring-neutral-200 dark:ring-neutral-700">
            <h2 className="mb-4 text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {editing ? t('projects.edit') : t('projects.create')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {currentUser?.role === 'platform_admin' && organizations.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('projects.organization')} *</label>
                  <select
                    required
                    value={formData.organization_id || ''}
                    onChange={(e) => setFormData({ ...formData, organization_id: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2"
                  >
                    <option value="">{t('common.select')}</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {currentUser?.role !== 'platform_admin' && (
                <input type="hidden" value={formData.organization_id} />
              )}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('projects.name')}</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('common.description')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">{t('nav.users')}</label>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 p-2">
                  {users
                    .filter(u => !formData.organization_id || u.organization_id === formData.organization_id)
                    .map((user) => (
                      <label key={user.id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          checked={formData.user_ids?.includes(user.id)}
                          onChange={(e) => {
                            const userIds = formData.user_ids || []
                            if (e.target.checked) {
                              setFormData({ ...formData, user_ids: [...userIds, user.id] })
                            } else {
                              setFormData({ ...formData, user_ids: userIds.filter(id => id !== user.id) })
                            }
                          }}
                          className="h-4 w-4 rounded border-neutral-300 text-accent-600"
                        />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">{user.full_name} ({user.email})</span>
                      </label>
                    ))}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditing(null)
                  }}
                  className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-accent-600 px-4 py-2 text-white hover:bg-accent-700"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
