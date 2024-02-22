import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useGlobalStore = create(
    persist(
        (set) => ({
            loading: false,
            setLoading: (value) => set(() => ({ loading: value })),
            darkMode: true,
            setDarkMode: (value) => set(() => ({ darkMode: value })),
        }), {
        name: 'heythisischris-app-storage',
        partialize: (state) => ({
            darkMode: state.darkMode,
        })
    })
);