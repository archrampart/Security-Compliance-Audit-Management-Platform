import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import { templatesApi, Template, TemplateCreate, TemplateItemCreate } from '../api/templates'
import { AuditStandard } from '../api/audits'
import { organizationsApi } from '../api/organizations'
import { Plus, Edit, Trash2, FileText, ChevronDown, ChevronRight, Copy } from 'lucide-react'
import { Severity, Status } from '../api/findings'
import { useConfirmDialog } from '../store/confirmDialogStore'

export default function Templates() {
  const { t, i18n } = useTranslation()
  const { user: currentUser } = useAuthStore()
  const { openDialog } = useConfirmDialog()
  const [templates, setTemplates] = useState<Template[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)
  const [expandedTemplates, setExpandedTemplates] = useState<Set<number>>(new Set())
  const [formData, setFormData] = useState<TemplateCreate>({
    name: '',
    description: '',
    standard: 'ISO27001',
    organization_id: currentUser?.organization_id || undefined,
    items: [],
  })

  const standards: AuditStandard[] = ['ISO27001', 'PCI_DSS', 'KVKK', 'GDPR', 'NIST', 'CIS', 'SOC2', 'OWASP_TOP10', 'OWASP_ASVS', 'OWASP_API', 'OWASP_MOBILE', 'ISO27017', 'ISO27018', 'HIPAA', 'COBIT', 'ENISA', 'CMMC', 'FEDRAMP', 'ITIL', 'OTHER']

  useEffect(() => {
    loadTemplates()
    if (currentUser?.role === 'platform_admin') {
      loadOrganizations()
    }
  }, [currentUser, i18n.language])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const currentLang = i18n.language || 'tr'
      const response = await templatesApi.getAll(
        currentUser?.role === 'platform_admin' ? undefined : (currentUser?.organization_id || undefined),
        currentLang
      )
      setTemplates(response.data)
    } catch (error: any) {
      console.error('Error loading templates:', error)
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

    // Prevent editing of system templates
    if (editing && editing.is_system) {
      alert('❌ Sistem şablonu düzenlenemez!\n\nBu şablon varsayılan kontrol listesi olduğu için korunmaktadır. Sistem şablonlarını düzenleyemezsiniz.')
      return
    }

    try {
      if (editing) {
        await templatesApi.update(editing.id, formData)
      } else {
        await templatesApi.create(formData)
      }
      setShowModal(false)
      setEditing(null)
      resetForm()
      loadTemplates()
    } catch (error: any) {
      console.error('Error saving template:', error)
      const errorMessage = error.response?.data?.detail || 'Hata oluştu'
      // Check if backend also returned error about system template
      if (errorMessage.includes('Sistem şablonu') || errorMessage.includes('sistem şablonu')) {
        alert(`❌ ${errorMessage}`)
      } else {
        alert(errorMessage)
      }
    }
  }

  const handleDelete = async (id: number) => {
    const template = templates.find(t => t.id === id)

    // Double check: prevent deletion of system templates
    if (template && template.is_system) {
      alert('❌ Sistem şablonu silinemez!\n\nBu şablon varsayılan kontrol listesi olduğu için korunmaktadır. Sistem şablonlarını silemezsiniz.')
      return
    }

    // Additional check for undefined is_system (shouldn't happen but just in case)
    if (template && template.is_system === true) {
      alert('❌ Sistem şablonu silinemez!\n\nBu şablon varsayılan kontrol listesi olduğu için korunmaktadır.')
      return
    }

    openDialog(
      t('templates.deleteConfirm'),
      async () => {
        try {
          await templatesApi.delete(id)
          loadTemplates()
        } catch (error: any) {
          console.error('Error deleting template:', error)
          const errorMessage = error.response?.data?.detail || t('templates.deleteError')
          // If backend returns error about system template, show it
          if (errorMessage.includes('Sistem şablonu') || errorMessage.includes('sistem şablonu')) {
            alert(`❌ ${errorMessage}`)
          } else {
            alert(`❌ ${errorMessage}`)
          }
        }
      },
      t('common.delete')
    )
  }

  const handleCopy = async (template: Template) => {
    const defaultName = i18n.language === 'en'
      ? `${template.name} (Copy)`
      : `${template.name} (Kopya)`

    const newName = prompt(t('templates.copyPrompt'), defaultName)

    if (!newName || newName.trim() === '') {
      return
    }

    try {
      await templatesApi.copy(template.id, newName.trim())
      loadTemplates()
      alert(t('templates.copySuccess'))
    } catch (error: any) {
      console.error('Error copying template:', error)
      const errorMessage = error.response?.data?.detail || t('templates.copyError')
      alert(`❌ ${errorMessage}`)
    }
  }

  const handleEdit = (template: Template) => {
    // Prevent editing of system templates
    if (template.is_system) {
      alert('❌ Sistem şablonu düzenlenemez!\n\nBu şablon varsayılan kontrol listesi olduğu için korunmaktadır. Sistem şablonlarını düzenleyemezsiniz.')
      return
    }

    setEditing(template)
    setFormData({
      name: template.name,
      description: template.description || '',
      standard: template.standard,
      organization_id: template.organization_id,
      items: template.items.map(item => ({
        order_number: item.order_number,
        control_reference: item.control_reference || '',
        default_title: item.default_title,
        default_description: item.default_description || '',
        default_severity: item.default_severity,
        default_status: item.default_status,
        default_recommendation: item.default_recommendation || '',
      })),
    })
    setShowModal(true)
  }

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedTemplates)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedTemplates(newExpanded)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      standard: 'ISO27001',
      organization_id: currentUser?.organization_id || undefined,
      items: [],
    })
  }

  const addItem = () => {
    const currentItems = formData.items || []
    setFormData({
      ...formData,
      items: [
        ...currentItems,
        {
          order_number: currentItems.length + 1,
          control_reference: '',
          default_title: '',
          default_description: '',
          default_severity: 'medium',
          default_status: 'open',
          default_recommendation: '',
        },
      ],
    })
  }

  const removeItem = (index: number) => {
    const currentItems = formData.items || []
    const newItems = currentItems.filter((_, i) => i !== index)
    setFormData({ ...formData, items: newItems })
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...(formData.items || [])]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData({ ...formData, items: newItems })
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-100 dark:via-neutral-200 dark:to-neutral-100 bg-clip-text text-transparent">
            {t('nav.templates')}
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
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent-600 border-r-transparent"></div>
            <p className="mt-4 text-neutral-600 font-medium">{t('common.loading')}</p>
          </div>
        </div>
      ) : templates.length === 0 ? (
        <div className="card-elevated p-16 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-accent-100 to-primary-100 flex items-center justify-center mb-6">
            <FileText className="h-8 w-8 text-accent-600" />
          </div>
          <p className="text-lg font-semibold text-neutral-700 mb-2">{t('common.noData')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <div key={template.id} className="card-elevated group hover:shadow-xl transition-all duration-300 dark:bg-neutral-800 dark:border-neutral-700">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleExpand(template.id)}
                        className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                      >
                        {expandedTemplates.has(template.id) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </button>
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{i18n.language === 'en' && template.name_en ? template.name_en : template.name}</h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {t('templates.standard')}: {template.standard} | {template.items.length} {t('templates.controls')}
                        </p>
                      </div>
                    </div>
                    {(template.description || template.description_en) && (
                      <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{i18n.language === 'en' && template.description_en ? template.description_en : template.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-2 items-center">
                    {template.is_system && (
                      <span className="text-xs bg-info-100 dark:bg-info-900/30 text-info-800 dark:text-info-300 px-2 py-1 rounded">
                        {t('templates.systemTemplate')}
                      </span>
                    )}
                    {template.is_system ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleCopy(template)
                          }}
                          className="rounded-lg p-2 text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/30 hover:shadow-sm transition-all duration-200"
                          title={t('templates.copy')}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            alert('❌ ' + t('templates.cannotEdit') + '!\n\n' + t('templates.systemTemplateDesc'))
                          }}
                          className="rounded p-1 text-neutral-400 cursor-not-allowed opacity-50"
                          title={i18n.language === 'en' ? 'System template cannot be edited' : 'Sistem şablonu düzenlenemez'}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            alert('❌ ' + t('templates.cannotDelete') + '!\n\n' + t('templates.systemTemplateDeleteDesc'))
                          }}
                          className="rounded p-1 text-neutral-400 cursor-not-allowed opacity-50"
                          title={i18n.language === 'en' ? 'System template cannot be deleted' : 'Sistem şablonu silinemez'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(template)}
                          className="rounded p-1 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                          title={t('common.edit')}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDelete(template.id)
                          }}
                          className="rounded p-1 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/30"
                          title={t('common.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {expandedTemplates.has(template.id) && (
                <div className="border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 p-4">
                  <div className="space-y-2">
                    {template.items.map((item) => (
                      <div key={item.id} className="rounded bg-white dark:bg-neutral-800 p-3 text-sm border border-neutral-100 dark:border-neutral-700">
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">
                          #{item.order_number} - {item.default_title}
                        </div>
                        {item.control_reference && (
                          <div className="text-neutral-600 dark:text-neutral-400">Ref: {item.control_reference}</div>
                        )}
                        <div className="mt-1 flex space-x-2">
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            Severity: {t(`severity.${item.default_severity}`)}
                          </span>
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            Status: {t(`status.${item.default_status}`)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <TemplateModal
          formData={formData}
          setFormData={setFormData}
          editing={editing}
          organizations={organizations}
          standards={standards}
          currentUser={currentUser}
          addItem={addItem}
          removeItem={removeItem}
          updateItem={updateItem}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowModal(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function TemplateModal({
  formData,
  setFormData,
  editing,
  organizations,
  standards,
  currentUser,
  addItem,
  removeItem,
  updateItem,
  onSubmit,
  onClose,
}: any) {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white dark:bg-neutral-800 p-6 shadow-large ring-1 ring-neutral-200 dark:ring-neutral-700">
        <h2 className="mb-4 text-xl font-bold dark:text-neutral-100">
          {editing ? t('templates.edit') : t('templates.create')}
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          {currentUser?.role === 'platform_admin' && organizations.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Organizasyon</label>
              <select
                value={formData.organization_id || ''}
                onChange={(e) => setFormData({ ...formData, organization_id: e.target.value ? parseInt(e.target.value) : undefined })}
                className="input"
              >
                <option value="">{t('common.select')}</option>
                {organizations.map((org: any) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Şablon Adı</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-2 text-neutral-900 dark:text-neutral-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Standart</label>
            <select
              required
              value={formData.standard}
              onChange={(e) => setFormData({ ...formData, standard: e.target.value as AuditStandard })}
              className="mt-1 block w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-2 text-neutral-900 dark:text-neutral-100"
            >
              {standards.map((std: string) => (
                <option key={std} value={std}>
                  {std}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Açıklama</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-2 text-neutral-900 dark:text-neutral-100"
              rows={2}
            />
          </div>
          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Kontrol Listesi</label>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center space-x-1 rounded-lg bg-accent-600 px-3 py-1 text-sm text-white hover:bg-accent-700"
              >
                <Plus className="h-4 w-4" />
                <span>Kontrol Ekle</span>
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {(formData.items || []).map((item: TemplateItemCreate, index: number) => (
                <div key={index} className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Kontrol #{item.order_number}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="rounded p-1 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Kontrol Referansı</label>
                      <input
                        type="text"
                        value={item.control_reference}
                        onChange={(e) => updateItem(index, 'control_reference', e.target.value)}
                        placeholder="A.5.1.1"
                        className="input text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Sıra No</label>
                      <input
                        type="number"
                        value={item.order_number}
                        onChange={(e) => updateItem(index, 'order_number', parseInt(e.target.value))}
                        className="input text-sm"
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Başlık</label>
                    <input
                      type="text"
                      required
                      value={item.default_title}
                      onChange={(e) => updateItem(index, 'default_title', e.target.value)}
                      className="input text-sm"
                    />
                  </div>
                  <div className="mt-2">
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Açıklama</label>
                    <textarea
                      value={item.default_description}
                      onChange={(e) => updateItem(index, 'default_description', e.target.value)}
                      className="input text-sm"
                      rows={2}
                    />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Severity</label>
                      <select
                        value={item.default_severity}
                        onChange={(e) => updateItem(index, 'default_severity', e.target.value as Severity)}
                        className="input text-sm"
                      >
                        <option value="critical">Kritik</option>
                        <option value="high">Yüksek</option>
                        <option value="medium">Orta</option>
                        <option value="low">Düşük</option>
                        <option value="info">Bilgi</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Status</label>
                      <select
                        value={item.default_status}
                        onChange={(e) => updateItem(index, 'default_status', e.target.value as Status)}
                        className="input text-sm"
                      >
                        <option value="open">Açık</option>
                        <option value="in_progress">Devam Ediyor</option>
                        <option value="resolved">Çözüldü</option>
                        <option value="closed">Kapatıldı</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Öneri</label>
                    <textarea
                      value={item.default_recommendation}
                      onChange={(e) => updateItem(index, 'default_recommendation', e.target.value)}
                      className="input text-sm"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
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
  )
}
