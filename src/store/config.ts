import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import theme from '@/theme/variables.module.scss'

type Language = 'zh_CN' | 'en'

const red = '#ff3f4d'
const green = '#009e45'

interface ConfigStore {
  language: Language
  hasSelected: boolean
  consults: {
    name: string
    contact: string[]
  }[]
  aiAlarmAutoNotice: boolean
  setAiAlarmAutoNotice: (auto: boolean) => void
  setConsults: (consults: ConfigStore['consults']) => void
  setHasSelected: () => void
  setLanguage: (language: Language) => void
  setting: {
    // 涨跌颜色
    upOrDownColor: 'upGreenAndDownRed' | 'upRedAndDownGreen'
    // 操作设置
    operation: 'mouseForKLine' | 'keyboardForKLine'
    scale: 'mouseUpToEnlarge' | 'mouseDownToEnlarge'
    priceBlink: '1' | '0'
    alarmTips: '1' | '0'
    alarmShow: '1' | '0'
    // 缺口设置
    gapShow: '1' | '0'
  }
  setSetting: (setting: Partial<ConfigStore['setting']>) => void
  getStockColor: (up?: boolean, format?: 'hex' | 'hsl') => string
}

export const useConfig = create<ConfigStore>()(
  persist(
    (set, get) => ({
      language: 'zh_CN',
      hasSelected: false,
      consults: [],
      aiAlarmAutoNotice: true,
      setting: {
        upOrDownColor: 'upGreenAndDownRed',
        operation: 'mouseForKLine',
        scale: 'mouseUpToEnlarge',
        priceBlink: '1',
        alarmTips: '1',
        alarmShow: '1',
        gapShow: '1'
      },
      setSetting: setting => set(s => ({ setting: { ...s.setting, ...setting } })),
      setAiAlarmAutoNotice: auto => set(() => ({ aiAlarmAutoNotice: auto })),
      setConsults: consults => set(() => ({ consults })),
      setLanguage: language => set(() => ({ language })),
      setHasSelected: () => set(() => ({ hasSelected: true })),
      getStockColor: (up = true, format = 'hsl') =>
        up
          ? get().setting.upOrDownColor === 'upGreenAndDownRed'
            ? format === 'hsl'
              ? `${theme.colorStockGreen}`
              : green
            : format === 'hsl'
              ? `${theme.colorStockRed}`
              : red
          : get().setting.upOrDownColor === 'upGreenAndDownRed'
            ? format === 'hsl'
              ? `${theme.colorStockRed}`
              : red
            : format === 'hsl'
              ? `${theme.colorStockGreen}`
              : green
    }),
    { name: 'config', storage: createJSONStorage(() => localStorage) }
  )
)
