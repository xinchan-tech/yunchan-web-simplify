/**
 * @author: Sieunyue
 * @date: 2025-02-05
 * @description: 画图工具
 */
import type { GraphicComponentOption } from 'echarts/components'
import type { EChartsType } from 'echarts/core'
import mitt from 'mitt'
import type { GraphicBase } from "./base"
import { LineGraphic } from "./line"

const graphics = new Map<string, GraphicBase>()


export const disposeGraphicTool = () => {}


export const createLine = (opts: LineGraphicOption): GraphicComponentOption => {
  
}

export const initGraphicTool = (chart: EChartsType) => {
  chart.getZr().on('click', e => {
    const trigger = e.target
    const active = Array.from(graphics.values()).find(g => g.isActive)
    if(active){
      active.onClick()
      return
    }

    if(trigger && graphics.has(trigger.parent.id.toString())) {
      const graphic = graphics.get(trigger.parent.id.toString())!
      graphic.onClick()
      return
    }
    
    const line = new LineGraphic({
      start: [e.offsetX, e.offsetY],
      chart
    })

    graphics.set(line.id, line)
  })

  chart.getZr().on('mousemove', e => {
    const active = Array.from(graphics.values()).find(g => g.isActive)
    if(active){
      active.onMouseMove(e)
    }
  })
}