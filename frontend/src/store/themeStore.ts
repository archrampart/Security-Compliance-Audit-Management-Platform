import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeState {
    isDark: boolean
    toggleTheme: () => void
    setTheme: (dark: boolean) => void
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            isDark: false,
            toggleTheme: () => set((state) => {
                const newValue = !state.isDark
                // Update document class
                if (newValue) {
                    document.documentElement.classList.add('dark')
                } else {
                    document.documentElement.classList.remove('dark')
                }
                return { isDark: newValue }
            }),
            setTheme: (dark: boolean) => set(() => {
                if (dark) {
                    document.documentElement.classList.add('dark')
                } else {
                    document.documentElement.classList.remove('dark')
                }
                return { isDark: dark }
            }),
        }),
        {
            name: 'theme-storage',
            onRehydrateStorage: () => (state) => {
                // Apply theme on app load
                if (state?.isDark) {
                    document.documentElement.classList.add('dark')
                }
            },
        }
    )
)
