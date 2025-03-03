import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type IndicatorParams = {
  id: string
  name: string
  params: {
    name: string
    value: string
    default: string
    max?: string
    min?: string
  }[]
}
const defaultIndicatorParams: IndicatorParams[] = [
  // {
  //   id: '241',
  //   name: '黄蓝梯子(稳健版)',
  //   params: [
  //     {
  //       name: '蓝色梯子',
  //       value: '36',
  //       default: '36',
  //       min: '1',
  //       max: '1000'
  //     },
  //     {
  //       name: '黄色梯子',
  //       value: '135',
  //       default: '135',
  //       min: '1',
  //       max: '1000'
  //     }
  //   ]
  // },
  // {
  //   id: '242',
  //   name: '黄蓝梯子(极速版)',
  //   params: [
  //     {
  //       name: '蓝色梯子',
  //       value: '24',
  //       default: '24',
  //       min: '1',
  //       max: '1000'
  //     },
  //     {
  //       name: '黄色梯子',
  //       value: '90',
  //       default: '90',
  //       min: '1',
  //       max: '1000'
  //     }
  //   ]
  // },
  // {
  //   id: '243',
  //   name: 'MA系统',
  //   params: [
  //     { name: 'P1', value: '3', default: '3', min: '0', max: '1000' },
  //     { name: 'P2', value: '5', default: '5', min: '0', max: '1000' },
  //     { name: 'P3', value: '10', default: '10', min: '0', max: '1000' },
  //     { name: 'P4', value: '20', default: '20', min: '0', max: '1000' },
  //     { name: 'P5', value: '30', default: '30', min: '0', max: '1000' },
  //     { name: 'P6', value: '60', default: '60', min: '0', max: '1000' },
  //     { name: 'P7', value: '90', default: '90', min: '0', max: '1000' },
  //     { name: 'P8', value: '100', default: '100', min: '0', max: '1000' },
  //     { name: 'P9', value: '120', default: '120', min: '0', max: '1000' },
  //     { name: 'P10', value: '250', default: '250', min: '0', max: '1000' },
  //     { name: 'P11', value: '0', default: '0', min: '0', max: '1000' },
  //     { name: 'P12', value: '0', default: '0', min: '0', max: '1000' },
  //     { name: 'P13', value: '0', default: '0', min: '0', max: '1000' },
  //     { name: 'P14', value: '0', default: '0', min: '0', max: '1000' },
  //     { name: 'P15', value: '0', default: '0', min: '0', max: '1000' }
  //   ]
  // },
  // {
  //   id: '127',
  //   name: '神奇九转',
  //   params: [{ name: 'N', value: '15', default: '15', min: '0', max: '1000' }]
  // },
  // {
  //   id: '122',
  //   name: 'BOLL',
  //   params: [
  //     { name: 'SD', value: '120', default: '120', min: '2', max: '120' },
  //     { name: 'WIDTH', value: '2', default: '2', min: '0', max: '100' }
  //   ]
  // },
  // {
  //   id: '126',
  //   name: 'KC',
  //   params: [
  //     { name: 'P1', value: '20', default: '20', min: '1', max: '1000' },
  //     { name: 'M', value: '14', default: '14', min: '1', max: '1000' }
  //   ]
  // },
  // {
  //   id: '123',
  //   name: 'SAR',
  //   params: [
  //     { name: 'P1', value: '4', default: '4', min: '0', max: '100' },
  //     { name: 'P2', value: '2', default: '2', min: '0', max: '100' },
  //     { name: 'P3', value: '20', default: '20', min: '0', max: '1000' }
  //   ]
  // },
  // {
  //   id: '125',
  //   name: 'IC',
  //   params: [
  //     { name: 'LONG', value: '44', default: '44', min: '1', max: '300' },
  //     { name: 'MID', value: '22', default: '22', min: '1', max: '300' },
  //     { name: 'SHORT', value: '7', default: '7', min: '1', max: '300' }
  //   ]
  // },
  // {
  //   id: '219',
  //   name: 'AI大趋势',
  //   params: [
  //     { name: 'SHORT', value: '20', default: '20', min: '2', max: '1000' },
  //     { name: 'LONG', value: '120', default: '120', min: '2', max: '1000' },
  //     { name: 'MID', value: '60', default: '60', min: '2', max: '1000' }
  //   ]
  // },
  // {
  //   id: '111',
  //   name: 'MACD',
  //   params: [
  //     { name: 'SHORT', value: '12', default: '12', min: '2', max: '200' },
  //     { name: 'LONG', value: '26', default: '26', min: '2', max: '200' },
  //     { name: 'M', value: '9', default: '9', min: '2', max: '200' }
  //   ]
  // },
  // {
  //   id: '134',
  //   name: 'KDJ',
  //   params: [
  //     { name: 'P1', value: '9', default: '9', min: '2', max: '90' },
  //     { name: 'P2', value: '3', default: '3', min: '2', max: '30' },
  //     { name: 'P3', value: '3', default: '3', min: '2', max: '30' }
  //   ]
  // },
  // {
  //   id: '135',
  //   name: 'RSI',
  //   params: [
  //     { name: 'P1', value: '6', default: '6', min: '2', max: '120' },
  //     { name: 'P2', value: '12', default: '12', min: '2', max: '250' },
  //     { name: 'P3', value: '24', default: '24', min: '2', max: '500' }
  //   ]
  // },
  // {
  //   id: '141',
  //   name: 'CCI',
  //   params: [{ name: 'N', value: '14', default: '14', min: '2', max: '100' }]
  // },
  // {
  //   id: '130',
  //   name: 'WWSR',
  //   params: [{ name: 'N', value: '14', default: '14', min: '2', max: '100' }]
  // },
  // {
  //   id: '145',
  //   name: 'PSY',
  //   params: [
  //     { name: 'N', value: '12', default: '12', min: '2', max: '100' },
  //     { name: 'M', value: '6', default: '6', min: '2', max: '100' }
  //   ]
  // },
  // {
  //   id: '140',
  //   name: 'BIAS',
  //   params: [
  //     { name: 'N1', value: '6', default: '6', min: '2', max: '250' },
  //     { name: 'N2', value: '12', default: '12', min: '2', max: '250' },
  //     { name: 'N3', value: '24', default: '24', min: '2', max: '250' }
  //   ]
  // },
  // {
  //   id: '138',
  //   name: 'DMA',
  //   params: [
  //     { name: 'SHORT', value: '10', default: '10', min: '2', max: '60' },
  //     { name: 'LONG', value: '50', default: '50', min: '2', max: '250' },
  //     { name: 'M', value: '10', default: '10', min: '2', max: '100' }
  //   ]
  // },
  // {
  //   id: '142',
  //   name: 'DMI',
  //   params: [
  //     { name: 'N', value: '14', default: '14', min: '2', max: '90' },
  //     { name: 'M', value: '6', default: '6', min: '2', max: '60' }
  //   ]
  // },
  // {
  //   id: '143',
  //   name: 'MTM',
  //   params: [
  //     { name: 'N', value: '12', default: '12', min: '2', max: '120' },
  //     { name: 'M', value: '6', default: '6', min: '2', max: '60' }
  //   ]
  // },
  // {
  //   id: '144',
  //   name: 'OSC',
  //   params: [
  //     { name: 'N', value: '20', default: '20', min: '2', max: '100' },
  //     { name: 'M', value: '6', default: '6', min: '2', max: '60' }
  //   ]
  // },
  // {
  //   id: '146',
  //   name: 'VR',
  //   params: [
  //     { name: 'N', value: '26', default: '26', min: '2', max: '100' },
  //     { name: 'M', value: '6', default: '6', min: '2', max: '100' }
  //   ]
  // },
  // {
  //   id: '147',
  //   name: 'ARBR',
  //   params: [{ name: 'N', value: '26', default: '26', min: '2', max: '120' }]
  // },
  // {
  //   id: '137',
  //   name: 'CR',
  //   params: [
  //     { name: 'N', value: '26', default: '26', min: '2', max: '100' },
  //     { name: 'M1', value: '5', default: '5', min: '0', max: '100' },
  //     { name: 'M2', value: '10', default: '10', min: '0', max: '100' },
  //     { name: 'M3', value: '20', default: '20', min: '0', max: '100' },
  //     { name: 'M4', value: '60', default: '60', min: '0', max: '100' },
  //     { name: 'M', value: '6', default: '6', min: '0', max: '100' }
  //   ]
  // },
  // {
  //   id: '139',
  //   name: 'EMV',
  //   params: [
  //     { name: 'N', value: '14', default: '14', min: '2', max: '90' },
  //     { name: 'N1', value: '9', default: '9', min: '2', max: '60' }
  //   ]
  // },
  // {
  //   id: '132',
  //   name: 'MAVOL',
  //   params: [
  //     { name: 'N1', value: '5', default: '5', min: '0', max: '1000' },
  //     { name: 'N2', value: '10', default: '10', min: '0', max: '1000' },
  //     { name: 'N3', value: '20', default: '20', min: '0', max: '1000' }
  //   ]
  // }
]

interface IndicatorStore {
  indicatorParams: IndicatorParams[]
  setIndicatorParams: (params: { id: string; params: IndicatorParams['params'] }) => void
  isDefaultIndicatorParams: (indicatorId: string) => boolean
  getIndicatorQueryParams: (indicatorId: string) => NormalizedRecord<number>
  mergeIndicatorParams: (params: IndicatorParams[]) => void
  formula: Record<string, string>
  setFormula: (params: Record<string, string>) => void
}

export const useIndicator = create<IndicatorStore>()(
  persist(
    (set, get) => ({
      indicatorParams: defaultIndicatorParams,
      setIndicatorParams: params =>
        set(s => ({
          indicatorParams: s.indicatorParams.map(item =>
            item.id === params.id ? { ...item, params: params.params } : item
          )
        })),
      isDefaultIndicatorParams: indicatorId => {
        const indicator = defaultIndicatorParams.find(item => item.id === indicatorId)
        if (!indicator) {
          return false
        }
        return JSON.stringify(indicator) === JSON.stringify(get().indicatorParams.find(item => item.id === indicatorId))
      },
      getIndicatorQueryParams: indicatorId => {
        const params = get().indicatorParams.find(item => item.id === indicatorId)?.params
        if (!params) return {}

        return params.reduce(
          (acc, item) => {
            acc[item.name] = Number.parseFloat(item.value)
            return acc
          },
          {} as NormalizedRecord<number>
        )
      },
      mergeIndicatorParams: params =>
        set(s => {
          const newIndicatorParams = params.map(item => {
            const oldParams = s.indicatorParams.find(oldItem => oldItem.id === item.id)?.params ?? []
            return {
              ...item,
              params: item.params.map(paramItem => {
                const oldParamItem = oldParams.find(oldParamItem => oldParamItem.name === paramItem.name)
                return {
                  ...paramItem,
                  value: oldParamItem?.value ?? paramItem.default
                }
              })
            }
          })
          return { indicatorParams: newIndicatorParams }
        }),
      formula: {},
      setFormula: params => set({ formula: params })
    }),
    {
      name: 'indicator',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
