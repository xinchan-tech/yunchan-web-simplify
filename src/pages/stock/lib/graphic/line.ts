import { uid } from 'radash'
import { GraphicBase } from './base'
import { EChartsType } from 'echarts/core'
import { throttle } from 'radash'

type LineGraphicOption = {
  start: [number, number]
  chart: EChartsType
}

export class LineGraphic extends GraphicBase {
  start: { x: number; y: number }
  end: { x: number; y: number }
  constructor(opts: LineGraphicOption) {
    super()
    this.type = 'line'
    this.id = uid(6)
    this.isActive = true
    this.chart = opts.chart
    this.hasCompleted = false
    this.start = {
      x: opts.start[0],
      y: opts.start[1]
    }
    this.end = {
      x: opts.start[0],
      y: opts.start[1]
    }
    this.graphic = {
      type: 'group',
      id: this.id,
      children: [
        {
          type: 'circle',
          id: `${this.id}-circle-start`,
          $action: 'replace',
          shape: {
            cx: opts.start[0],
            cy: opts.start[1],
            r: 4
          },
          style: {
            fill: '#fff'
          }
        },
        {
          type: 'circle',
          id: `${this.id}-circle-end`,
          $action: 'replace',
          shape: {
            cx: opts.start[0],
            cy: opts.start[1],
            r: 4
          },
          style: {
            fill: '#fff'
          }
        },
        {
          type: 'line',
          id: `${this.id}-line`,
          $action: 'replace',
          shape: {
            x1: opts.start[0],
            y1: opts.start[1],
            x2: opts.start[0],
            y2: opts.start[1]
          },
          style: {
            stroke: '#fff'
          }
        }
      ]
    }

    this.chart.setOption({
      graphic: this.graphic
    })
  }

  draw(): void {}

  onClick(e): void {
    console.log(e)
  }

  onMouseMove = throttle({ interval: 0.2 }, e => {
    if (!this.isActive) return

    if (this.hasCompleted) return


    const end = this.graphic.children.find(g => g.id === `${this.id}-circle-end`)
    const line = this.graphic.children.find(g => g.id === `${this.id}-line`)

    end.shape.cx = e.offsetX
    end.shape.cy = e.offsetY
    //计算两点角度
    const angle = Math.atan2(e.offsetY - this.start.y, e.offsetX - this.start.x)

    // 计算直线起点, 经过start点, 与角度angle的直线
    const lineStartX = 0
    const lineStartY = lineStartX * Math.tan(angle)
    // 计算直线终点, 经过end点, 与角度angle的直线
    const endStartX = 1000
    const endStartY = endStartX * Math.tan(angle)

    line.shape.x1 = lineStartX
    line.shape.y1 = lineStartY

    line.shape.x2 = endStartX
    line.shape.y2 = endStartY

    if (!end) return

  

    this.chart.setOption({
      graphic: this.graphic
    })
  })
}
