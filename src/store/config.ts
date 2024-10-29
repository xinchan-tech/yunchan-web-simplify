import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type Language = 'zh_CN' | 'en'

interface ConfigStore {
  language: Language
  hasSelected: boolean
  setHasSelected: () => void
  setLanguage: (language: Language) => void
}

export const useConfig = create<ConfigStore>()(
  persist(
    (set) => ({
      language: 'zh_CN',
      hasSelected: false,
      setLanguage: (language) => set(() => ({ language })),
      setHasSelected: () => set(() => ({ hasSelected: true }))
    }),
    { name: 'config', storage: createJSONStorage(() => localStorage) }
  )
)
