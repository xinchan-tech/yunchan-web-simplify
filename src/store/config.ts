import dayjs, { type Dayjs } from "dayjs"
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type Language = 'zh_CN' | 'en'

let timer: number | null = null
let strTimer: number | null = null

interface ConfigStore {
  language: Language
  hasSelected: boolean
  usTime: number
  usTimeStr?: Dayjs
  setUsTime: (usTime: number) => void
  setUsTimeStr: (usTimeStr: string) => void
  setHasSelected: () => void
  setLanguage: (language: Language) => void
  openStatus: number
}

export const useConfig = create<ConfigStore>()(
  persist(
    (set, get) => ({
      language: 'zh_CN',
      usTime: 0,
      usTimeStr: undefined,
      setUsTime: (usTime) => {
        if(timer){
          clearTimeout(timer)
        }

        set(() => ({ usTime }))

        timer = setInterval(() => {
          set(() => ({ usTime: get().usTime + 1 * 1000 }))
        }, 1000)
      },
      setUsTimeStr: (usTimeStr) => {
        if(strTimer){
          clearTimeout(strTimer)
        }

        set(() => ({ usTimeStr: dayjs(usTimeStr)}))

        strTimer = setInterval(() => {
          set(() => ({ usTimeStr: get().usTimeStr?.add(1, 'second') }))
        }, 1000)
      },
      hasSelected: false,
      setLanguage: (language) => set(() => ({ language })),
      setHasSelected: () => set(() => ({ hasSelected: true }))
    }),
    { name: 'config', storage: createJSONStorage(() => localStorage) }
  )
)
