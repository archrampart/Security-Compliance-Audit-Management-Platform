import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { auditsApi, Audit, AuditStatus } from '../api/audits'
import { projectsApi } from '../api/projects'
import { FileText, Download, Calendar, Building2, FolderOpen, Search, Filter } from 'lucide-react'

export default function Reports() {
    const { t } = useTranslation()
    const [audits, setAudits] = useState<Audit[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedProject, setSelectedProject] = useState<number | null>(null)
    const [downloading, setDownloading] = useState<number | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<AuditStatus | 'all'>('all')

    useEffect(() => {
        loadProjects()
        loadAudits()
    }, [])

    useEffect(() => {
        loadAudits()
    }, [selectedProject])

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
            setLoading(true)
            const response = await auditsApi.getAll(selectedProject || undefined)
            setAudits(response.data)
        } catch (error) {
            console.error('Error loading audits:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadWord = async (auditId: number) => {
        try {
            setDownloading(auditId)
            const response = await auditsApi.downloadWordReport(auditId)

            // Create blob and download
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `audit_report_${auditId}.docx`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error: any) {
            console.error('Error downloading report:', error)
            alert(error.response?.data?.detail || t('reports.downloadError'))
        } finally {
            setDownloading(null)
        }
    }

    const statusColors = {
        planning: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300',
        in_progress: 'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-400',
        completed: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400',
        cancelled: 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400',
    }

    const statusLabels: Record<string, string> = {
        planning: t('status.planning'),
        in_progress: t('status.in_progress'),
        completed: t('status.completed'),
        cancelled: t('status.cancelled'),
    }

    const filteredAudits = useMemo(() => {
        return audits.filter(audit => {
            const matchesSearch = audit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                audit.project?.name.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesStatus = statusFilter === 'all' || audit.status === statusFilter
            return matchesSearch && matchesStatus
        })
    }, [audits, searchTerm, statusFilter])

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-100 dark:via-neutral-200 dark:to-neutral-100 bg-clip-text text-transparent">
                    {t('nav.reports')}
                </h1>
                <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                    {t('reports.description') || 'Download audit reports in Word format'}
                </p>
            </div>

            {/* Filters */}
            <div className="mb-6 space-y-4 md:space-y-0 md:flex md:items-center md:space-x-4 bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
                {/* Search */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder={t('common.search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                </div>

                <div className="flex items-center space-x-4">
                    {/* Project Filter */}
                    <div className="flex items-center space-x-2 min-w-[200px]">
                        <FolderOpen className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                        <select
                            value={selectedProject || ''}
                            onChange={(e) => setSelectedProject(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">{t('common.allProjects') || 'All Projects'}</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center space-x-2 min-w-[200px]">
                        <Filter className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as AuditStatus | 'all')}
                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">{t('findings.allStatuses') || 'All Statuses'}</option>
                            <option value="planning">{t('status.planning')}</option>
                            <option value="in_progress">{t('status.in_progress')}</option>
                            <option value="completed">{t('status.completed')}</option>
                            <option value="cancelled">{t('status.cancelled')}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Reports List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-600"></div>
                </div>
            ) : filteredAudits.length === 0 ? (
                <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-12 text-center">
                    <FileText className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-500 mb-4" />
                    <p className="text-neutral-600 dark:text-neutral-400">{t('reports.noReports') || 'No reports available'}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-2">
                        {t('reports.noReportsHint') || 'Audits matchings your filters will appear here'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredAudits.map((audit) => (
                        <div
                            key={audit.id}
                            className="rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3">
                                        <FileText className="h-6 w-6 text-accent-600 dark:text-accent-400" />
                                        <div>
                                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                                {audit.name}
                                            </h3>
                                            <div className="flex items-center space-x-4 mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                                                <span className="flex items-center">
                                                    <Building2 className="h-4 w-4 mr-1" />
                                                    {audit.project?.name}
                                                </span>
                                                <span className="flex items-center">
                                                    <Calendar className="h-4 w-4 mr-1" />
                                                    {audit.audit_date ? new Date(audit.audit_date).toLocaleDateString() : '-'}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[audit.status]}`}>
                                                    {statusLabels[audit.status]}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center space-x-4 text-sm">
                                        <span className="text-neutral-600 dark:text-neutral-400">
                                            {t('common.standard')}: <span className="font-medium text-neutral-900 dark:text-neutral-100">{audit.standard}</span>
                                        </span>
                                        <span className="text-neutral-600 dark:text-neutral-400">
                                            {t('audits.findings')}: <span className="font-medium text-neutral-900 dark:text-neutral-100">{audit.findings_count || 0}</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handleDownloadWord(audit.id)}
                                        disabled={downloading === audit.id}
                                        className="flex items-center space-x-2 rounded-lg bg-accent-600 px-4 py-2 text-white hover:bg-accent-700 disabled:opacity-50 transition-colors"
                                    >
                                        {downloading === audit.id ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ) : (
                                            <Download className="h-4 w-4" />
                                        )}
                                        <span>{t('reports.downloadWord') || 'Download Word'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
