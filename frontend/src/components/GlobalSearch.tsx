import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, X, FileCheck, AlertCircle, Building2, FolderOpen } from 'lucide-react'
import { auditsApi } from '../api/audits'
import { findingsApi } from '../api/findings'
import { organizationsApi } from '../api/organizations'
import { projectsApi } from '../api/projects'

interface SearchResult {
    id: number
    type: 'audit' | 'finding' | 'organization' | 'project'
    title: string
    subtitle?: string
}

export default function GlobalSearch() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Debounced search
    useEffect(() => {
        if (query.length < 2) {
            setResults([])
            return
        }

        const timer = setTimeout(async () => {
            await performSearch(query)
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    const performSearch = async (searchQuery: string) => {
        setLoading(true)
        try {
            const [auditsRes, findingsRes, orgsRes, projectsRes] = await Promise.all([
                auditsApi.getAll(),
                findingsApi.getAll(),
                organizationsApi.getAll(),
                projectsApi.getAll()
            ])

            const searchResults: SearchResult[] = []
            const lowerQuery = searchQuery.toLowerCase()

            // Search audits
            auditsRes.data?.forEach((audit: any) => {
                if (audit.name.toLowerCase().includes(lowerQuery) ||
                    audit.description?.toLowerCase().includes(lowerQuery)) {
                    searchResults.push({
                        id: audit.id,
                        type: 'audit',
                        title: audit.name,
                        subtitle: audit.standard
                    })
                }
            })

            // Search findings
            findingsRes.data?.forEach((finding: any) => {
                if (finding.title.toLowerCase().includes(lowerQuery) ||
                    finding.description?.toLowerCase().includes(lowerQuery)) {
                    searchResults.push({
                        id: finding.id,
                        type: 'finding',
                        title: finding.title,
                        subtitle: finding.severity
                    })
                }
            })

            // Search organizations
            orgsRes.data?.forEach((org: any) => {
                if (org.name.toLowerCase().includes(lowerQuery)) {
                    searchResults.push({
                        id: org.id,
                        type: 'organization',
                        title: org.name,
                        subtitle: org.industry
                    })
                }
            })

            // Search projects
            projectsRes.data?.forEach((project: any) => {
                if (project.name.toLowerCase().includes(lowerQuery)) {
                    searchResults.push({
                        id: project.id,
                        type: 'project',
                        title: project.name,
                        subtitle: project.description
                    })
                }
            })

            setResults(searchResults.slice(0, 10))
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleResultClick = (result: SearchResult) => {
        setIsOpen(false)
        setQuery('')
        switch (result.type) {
            case 'audit':
                navigate(`/audits/${result.id}`)
                break
            case 'finding':
                navigate(`/findings`)
                break
            case 'organization':
                navigate(`/organizations`)
                break
            case 'project':
                navigate(`/projects`)
                break
        }
    }

    const getIcon = (type: SearchResult['type']) => {
        switch (type) {
            case 'audit':
                return <FileCheck className="h-4 w-4 text-info-600 dark:text-info-400" />
            case 'finding':
                return <AlertCircle className="h-4 w-4 text-warning-600 dark:text-warning-400" />
            case 'organization':
                return <Building2 className="h-4 w-4 text-accent-600 dark:text-accent-400" />
            case 'project':
                return <FolderOpen className="h-4 w-4 text-success-600 dark:text-success-400" />
        }
    }

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={t('search.placeholder') || 'Search audits, findings, projects...'}
                    className="w-64 pl-10 pr-8 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-accent-500 focus:ring-2 focus:ring-accent-200 dark:focus:ring-accent-800 transition-all duration-200"
                />
                {query && (
                    <button
                        onClick={() => {
                            setQuery('')
                            setResults([])
                            inputRef.current?.focus()
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    >
                        <X className="h-3 w-3 text-neutral-400" />
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            {isOpen && query.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-lg bg-white dark:bg-neutral-800 shadow-lg border border-neutral-200 dark:border-neutral-700 max-h-80 overflow-y-auto z-50">
                    {loading ? (
                        <div className="p-4 text-center text-neutral-500 dark:text-neutral-400 text-sm">
                            {t('search.searching') || 'Searching...'}
                        </div>
                    ) : results.length > 0 ? (
                        <div className="py-2">
                            {results.map((result, index) => (
                                <button
                                    key={`${result.type}-${result.id}`}
                                    onClick={() => handleResultClick(result)}
                                    className="w-full flex items-center space-x-3 px-4 py-2.5 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                                >
                                    {getIcon(result.type)}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                                            {result.title}
                                        </p>
                                        {result.subtitle && (
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                                {result.subtitle}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-xs text-neutral-400 dark:text-neutral-500 capitalize">
                                        {t(`search.types.${result.type}`) || result.type}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-neutral-500 dark:text-neutral-400 text-sm">
                            {t('search.noResults') || 'No results found'}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
