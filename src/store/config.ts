import { getCurrentIp } from '@/api'
import theme from '@/theme/variables.module.scss'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type Language = 'zh_CN' | 'en'

const red = '#F23645'
const green = '#089981'

const platform = (() => {
  return /windows|win32/i.test(navigator.userAgent)
    ? 'windows'
    : /macintosh|mac os x/i.test(navigator.userAgent)
      ? 'mac'
      : 'other'
})()

interface ConfigStore {
  language: Language
  ip: string
  refreshIp: () => void
  hasSelected: boolean
  consults: {
    name: string
    contact: string[]
  }[]
  platform: typeof platform
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
    gapShow: string
  }
  setSetting: (setting: Partial<ConfigStore['setting']>) => void
  getStockColor: (up?: boolean, format?: 'hex' | 'hsl') => string
  debug?: boolean
  setDebug: (value?: boolean) => void
}

export const useConfig = create<ConfigStore>()(
  persist(
    (set, get) => ({
      language: 'zh_CN',
      ip: 'CN',
      platform,
      hasSelected: false,
      consults: [],
      aiAlarmAutoNotice: true,
      debug: undefined,
      setting: {
        upOrDownColor: 'upGreenAndDownRed',
        operation: 'mouseForKLine',
        scale: 'mouseUpToEnlarge',
        priceBlink: '1',
        alarmTips: '1',
        alarmShow: '1',
        gapShow: '1'
      },
      setDebug: value => set(() => ({ debug: value })),
      setSetting: setting => set(s => ({ setting: { ...s.setting, ...setting } })),
      setAiAlarmAutoNotice: auto => set(() => ({ aiAlarmAutoNotice: auto })),
      setConsults: consults => set(() => ({ consults })),
      setLanguage: language => set(() => ({ language })),
      setHasSelected: () => set(() => ({ hasSelected: true })),
      refreshIp: () => {
        getCurrentIp().then(r => {
          set(() => ({ ip: r.country_code }))
        })
      },
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
