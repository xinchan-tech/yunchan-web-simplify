type IndicatorParams = {
  id: string | number
  name: string
  params: {
    name: string
    value: string
    max?: string
    min?: string
  }[]
}

export const defaultIndicatorParams: IndicatorParams[] = [
  {
    id: '241',
    name: '黄蓝梯子(稳健版)',
    params: [
      {
        name: '蓝色梯子',
        value: '36',
        min: '1',
        max: '1000'
      },
      {
        name: '黄色梯子',
        value: '135',
        min: '1',
        max: '1000'
      }
    ]
  },
  {
    id: '242',
    name: '黄蓝梯子(极速版)',
    params: [
      {
        name: '蓝色梯子',
        value: '24',
        min: '1',
        max: '1000'
      },
      {
        name: '黄色梯子',
        value: '90',
        min: '1',
        max: '1000'
      }
    ]
  },
  {
    id: '243',
    name: 'MA系统',
    params: [
      { name: 'P1', value: '3', min: '0', max: '1000' },
      { name: 'P2', value: '5', min: '0', max: '1000' },
      { name: 'P3', value: '10', min: '0', max: '1000' },
      { name: 'P4', value: '20', min: '0', max: '1000' },
      { name: 'P5', value: '30', min: '0', max: '1000' },
      { name: 'P6', value: '60', min: '0', max: '1000' },
      { name: 'P7', value: '90', min: '0', max: '1000' },
      { name: 'P8', value: '100', min: '0', max: '1000' },
      { name: 'P9', value: '120', min: '0', max: '1000' },
      { name: 'P10', value: '250', min: '0', max: '1000' },
      { name: 'P11', value: '0', min: '0', max: '1000' },
      { name: 'P12', value: '0', min: '0', max: '1000' },
      { name: 'P13', value: '0', min: '0', max: '1000' },
      { name: 'P14', value: '0', min: '0', max: '1000' },
      { name: 'P15', value: '0', min: '0', max: '1000' }
    ]
  },
  {
    id: '127',
    name: '神奇九转',
    params: [
      { name: 'N', value: '15', min: '0', max: '1000' },
    ]
  },
  {
    id: '122',
    name: 'BOLL',
    params: [
      { name: 'SD', value: '120', min: '2', max: '120' },
      { name: 'WIDTH', value: '2', min: '0', max: '100' },
    ]
  },
  {
    id: '126',
    name: 'KC',
    params: [
      { name: 'P1', value: '20', min: '1', max: '1000' },
      { name: 'M', value: '14', min: '1', max: '1000' },
    ]
  },
  {
    id: '123',
    name: 'SAR',
    params: [
      { name: 'P1', value: '4', min: '0', max: '100' },
      { name: 'P2', value: '2', min: '0', max: '100' },
      { name: 'P3', value: '20', min: '0', max: '1000' },
    ]
  },
  {
    id: '125',
    name: 'IC',
    params: [
      { name: 'LONG', value: '44', min: '1', max: '300'},
      { name: 'MID', value: '22', min: '1', max: '300'},
      { name: 'SHORT', value: '7', min: '1', max: '300'},
    ]
  },
  {
    id: '219',
    name: 'AI大趋势',
    params: [
      { name: 'SHORT', value: '20', min: '2', max: '1000'},
      { name: 'LONG', value: '120', min: '2', max: '1000'},
      { name: 'MID', value: '60', min: '2', max: '1000'},
    ]
  }
]
