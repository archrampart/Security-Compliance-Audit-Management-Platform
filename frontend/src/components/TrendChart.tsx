import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '../store/themeStore'
import { TrendingUp } from 'lucide-react'

interface TrendData {
    date: string
    critical: number
    high: number
    medium: number
    low: number
    total: number
}

interface TrendChartProps {
    findings: Array<{ severity: string; created_at: string }>
}

export default function TrendChart({ findings }: TrendChartProps) {
    const { t } = useTranslation()
    const { isDark } = useThemeStore()
    const [data, setData] = useState<TrendData[]>([])

    useEffect(() => {
        // Group findings by date (last 30 days)
        const today = new Date()
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

        const dateMap = new Map<string, TrendData>()

        // Initialize all dates
        for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0]
            dateMap.set(dateStr, {
                date: dateStr,
                critical: 0,
                high: 0,
                medium: 0,
                low: 0,
                total: 0
            })
        }

        // Count findings by date
        findings.forEach(finding => {
            const dateStr = new Date(finding.created_at).toISOString().split('T')[0]
            const existing = dateMap.get(dateStr)
            if (existing) {
                existing.total++
                if (finding.severity === 'critical') existing.critical++
                else if (finding.severity === 'high') existing.high++
                else if (finding.severity === 'medium') existing.medium++
                else if (finding.severity === 'low') existing.low++
            }
        })

        // Convert to array and sort
        const chartData = Array.from(dateMap.values())
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-14) // Last 14 days for better visibility
            .map(item => ({
                ...item,
                date: new Date(item.date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })
            }))

        setData(chartData)
    }, [findings])

    const colors = {
        critical: '#ef4444',
        high: '#f97316',
        medium: '#3b82f6',
        low: '#22c55e',
        total: '#8b5cf6'
    }

    const gridColor = isDark ? '#374151' : '#e5e7eb'
    const textColor = isDark ? '#9ca3af' : '#6b7280'

    if (data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                {t('dashboard.noData') || 'No data available'}
            </div>
        )
    }

    return (
        <div className="rounded-xl bg-white dark:bg-neutral-800 p-6 shadow-medium border border-neutral-200 dark:border-neutral-700 transition-colors duration-300">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-accent-600 dark:text-accent-400" />
                {t('dashboard.findingsTrend') || 'Findings Trend (Last 14 Days)'}
            </h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: textColor, fontSize: 12 }}
                            axisLine={{ stroke: gridColor }}
                            tickLine={{ stroke: gridColor }}
                        />
                        <YAxis
                            tick={{ fill: textColor, fontSize: 12 }}
                            axisLine={{ stroke: gridColor }}
                            tickLine={{ stroke: gridColor }}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                                borderColor: isDark ? '#374151' : '#e5e7eb',
                                borderRadius: '8px',
                                color: isDark ? '#f3f4f6' : '#1f2937'
                            }}
                            labelStyle={{ color: isDark ? '#f3f4f6' : '#1f2937', fontWeight: 'bold' }}
                        />
                        <Legend
                            wrapperStyle={{ paddingTop: '10px' }}
                            formatter={(value) => <span style={{ color: textColor }}>{t(`severity.${value}`) || value}</span>}
                        />
                        <Line
                            type="monotone"
                            dataKey="critical"
                            stroke={colors.critical}
                            strokeWidth={2}
                            dot={{ fill: colors.critical, strokeWidth: 2, r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="high"
                            stroke={colors.high}
                            strokeWidth={2}
                            dot={{ fill: colors.high, strokeWidth: 2, r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="medium"
                            stroke={colors.medium}
                            strokeWidth={2}
                            dot={{ fill: colors.medium, strokeWidth: 2, r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="low"
                            stroke={colors.low}
                            strokeWidth={2}
                            dot={{ fill: colors.low, strokeWidth: 2, r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
