import { X } from 'lucide-react'
import { useConfirmDialog } from '../store/confirmDialogStore'
import { useTranslation } from 'react-i18next'

export function ConfirmDialog() {
    const { isOpen, title, message, confirm, cancel } = useConfirmDialog()
    const { t } = useTranslation()

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl bg-white dark:bg-neutral-800 shadow-2xl border border-neutral-200 dark:border-neutral-700 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        {title}
                    </h3>
                    <button
                        onClick={cancel}
                        className="rounded-lg p-1 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <p className="text-neutral-700 dark:text-neutral-300 mb-6">
                    {message}
                </p>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={cancel}
                        className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={confirm}
                        className="px-4 py-2 rounded-lg bg-error-600 text-white hover:bg-error-700 transition-colors"
                    >
                        {t('common.delete')}
                    </button>
                </div>
            </div>
        </div>
    )
}
