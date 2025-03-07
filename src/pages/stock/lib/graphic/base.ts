import type { GraphicComponentOption } from 'echarts/components'
import type { EChartsType } from 'echarts/core'

export abstract class GraphicBase {
  id: string
  type: string
  graphic!: GraphicComponentOption
  isActive: boolean
  chart!: EChartsType
  hasCompleted: boolean
  abstract onMouseMove: (e: any) => void

  constructor() {
    this.id = ''
    this.type = ''
    this.isActive = true
    this.hasCompleted = false
  }

  abstract draw(): void

  abstract onClick(e: any): void
}
