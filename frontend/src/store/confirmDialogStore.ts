import { create } from 'zustand'

interface ConfirmDialogState {
    isOpen: boolean
    title: string
    message: string
    onConfirm: (() => void) | null
    onCancel: (() => void) | null
    openDialog: (message: string, onConfirm: () => void, title?: string) => void
    closeDialog: () => void
    confirm: () => void
    cancel: () => void
}

export const useConfirmDialog = create<ConfirmDialogState>((set, get) => ({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,

    openDialog: (message: string, onConfirm: () => void, title: string = 'Confirm') => {
        set({
            isOpen: true,
            title,
            message,
            onConfirm,
        })
    },

    closeDialog: () => {
        set({
            isOpen: false,
            title: '',
            message: '',
            onConfirm: null,
            onCancel: null,
        })
    },

    confirm: () => {
        const { onConfirm } = get()
        if (onConfirm) {
            onConfirm()
        }
        get().closeDialog()
    },

    cancel: () => {
        const { onCancel } = get()
        if (onCancel) {
            onCancel()
        }
        get().closeDialog()
    },
}))
