import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import { usersApi, User, UserCreate } from '../api/users'
import { organizationsApi } from '../api/organizations'
import { Plus, Edit, Trash2, User as UserIcon } from 'lucide-react'
import { useConfirmDialog } from '../store/confirmDialogStore'

export default function Users() {
  const { t } = useTranslation()
  const { user: currentUser } = useAuthStore()
  const { openDialog } = useConfirmDialog()
  const [users, setUsers] = useState<User[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [formData, setFormData] = useState<UserCreate>({
    email: '',
    full_name: '',
    password: '',
    role: 'auditor',
    organization_id: currentUser?.organization_id || undefined,
    is_active: true,
  })

  useEffect(() => {
    loadUsers()
    if (currentUser?.role === 'platform_admin') {
      loadOrganizations()
    }
  }, [currentUser])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await usersApi.getAll()
      setUsers(response.data)
    } catch (error: any) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOrganizations = async () => {
    try {
      const response = await organizationsApi.getAll()
      setOrganizations(response.data)
    } catch (error) {
      console.error('Error loading organizations:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        const { password, ...updateData } = formData
        await usersApi.update(editing.id, updateData)
      } else {
        await usersApi.create(formData)
      }
      setShowModal(false)
      setEditing(null)
      setFormData({
        email: '',
        full_name: '',
        password: '',
        role: 'auditor',
        organization_id: currentUser?.organization_id || undefined,
        is_active: true,
      })
      loadUsers()
    } catch (error: any) {
      console.error('Error saving user:', error)
      alert(error.response?.data?.detail || t('users.errorOccurred'))
    }
  }

  const handleDelete = async (id: number) => {
    openDialog(
      t('users.deleteConfirm'),
      async () => {
        try {
          await usersApi.delete(id)
          loadUsers()
        } catch (error: any) {
          console.error('Error deleting user:', error)
          alert(error.response?.data?.detail || t('users.deleteError'))
        }
      },
      t('common.delete')
    )
  }

  const handleEdit = (user: User) => {
    setEditing(user)
    setFormData({
      email: user.email,
      full_name: user.full_name,
      password: '',
      role: user.role,
      organization_id: user.organization_id || undefined,
      is_active: user.is_active,
    })
    setShowModal(true)
  }

  const canManageUsers = currentUser?.role === 'platform_admin' || currentUser?.role === 'org_admin'

  if (!canManageUsers) {
    return (
      <div className="rounded-lg bg-warning-50 p-4 text-warning-800">
        {t('users.noAccess')}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-100 dark:via-neutral-200 dark:to-neutral-100 bg-clip-text text-transparent">
            {t('nav.users')}
          </h1>
        </div>
        <button
          onClick={() => {
            setEditing(null)
            setFormData({
              email: '',
              full_name: '',
              password: '',
              role: 'auditor',
              organization_id: currentUser?.organization_id || undefined,
              is_active: true,
            })
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
      ) : users.length === 0 ? (
        <div className="rounded-lg bg-neutral-50 p-12 text-center">
          <UserIcon className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
          <p className="text-neutral-600">{t('common.noData')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="border-b border-neutral-200 dark:border-neutral-700 px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {t('users.fullName')}
                </th>
                <th className="border-b border-neutral-200 dark:border-neutral-700 px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {t('users.email')}
                </th>
                <th className="border-b border-neutral-200 dark:border-neutral-700 px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {t('users.role')}
                </th>
                <th className="border-b border-neutral-200 dark:border-neutral-700 px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {t('users.status')}
                </th>
                <th className="border-b border-neutral-200 dark:border-neutral-700 px-4 py-3 text-right text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {t('users.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700">
                  <td className="border-b border-neutral-100 dark:border-neutral-700 px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100">
                    {user.full_name}
                  </td>
                  <td className="border-b border-neutral-100 dark:border-neutral-700 px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                    {user.email}
                  </td>
                  <td className="border-b border-neutral-100 dark:border-neutral-700 px-4 py-3 text-sm">
                    <span className="rounded-full bg-info-100 dark:bg-info-900/30 px-2 py-1 text-xs text-info-800 dark:text-info-300">
                      {user.role === 'platform_admin' ? t('users.platformAdmin') :
                        user.role === 'org_admin' ? t('users.orgAdmin') : t('users.auditor')}
                    </span>
                  </td>
                  <td className="border-b border-neutral-100 dark:border-neutral-700 px-4 py-3 text-sm">
                    <span className={user.is_active ? 'text-success-600 dark:text-success-400' : 'text-neutral-400'}>
                      {user.is_active ? t('users.active') : t('users.inactive')}
                    </span>
                  </td>
                  <td className="border-b border-neutral-100 dark:border-neutral-700 px-4 py-3 text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="rounded p-1 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {user.id !== currentUser?.id ? (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="rounded p-1 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/30"
                          title={t('users.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          disabled
                          className="rounded p-1 text-neutral-400 cursor-not-allowed opacity-50"
                          title={t('users.cannotDeleteOwnAccount')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-neutral-800 p-6 shadow-large ring-1 ring-neutral-200 dark:ring-neutral-700">
            <h2 className="mb-4 text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {editing ? t('users.edit') : t('users.create')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('users.email')}</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('users.fullName')}</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2"
                />
              </div>
              {!editing && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('auth.password')}</label>
                  <input
                    type="password"
                    required={!editing}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('users.role')}</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="mt-1 block w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2"
                  disabled={currentUser?.role !== 'platform_admin' && formData.role === 'platform_admin'}
                >
                  {currentUser?.role === 'platform_admin' && (
                    <option value="platform_admin">{t('users.platformAdmin')}</option>
                  )}
                  <option value="org_admin">{t('users.orgAdmin')}</option>
                  <option value="auditor">{t('users.auditor')}</option>
                </select>
              </div>
              {currentUser?.role === 'platform_admin' && organizations.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('users.organization')}</label>
                  <select
                    value={formData.organization_id || ''}
                    onChange={(e) => setFormData({ ...formData, organization_id: e.target.value ? parseInt(e.target.value) : undefined })}
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
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-neutral-300 text-accent-600"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-neutral-700 dark:text-neutral-300">
                  {t('users.active')}
                </label>
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
