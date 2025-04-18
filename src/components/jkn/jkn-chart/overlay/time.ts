import type { Coordinate, LineAttrs, OverlayTemplate, Point, RectAttrs, TextAttrs } from '@/plugins/jkn-kline-chart'
import dayjs from 'dayjs'
import type { DrawOverlayParams } from "../types"
import { drawOverlayParamsToFigureStyle } from "../utils"
import { PolygonType } from "@/plugins/jkn-kline-chart"
import { colorUtil } from "@/utils/style"

function getRect(coordinates: Coordinate[]): RectAttrs {
  return {
    x: Math.min(coordinates[0].x, coordinates[1].x),
    y: Math.min(coordinates[0].y, coordinates[1].y),
    width: Math.abs(coordinates[1].x - coordinates[0].x),
    height: Math.abs(coordinates[1].y - coordinates[0].y)
  }
}

const getArrow = (rect: RectAttrs): LineAttrs[] => {
  const lines: LineAttrs[] = []

  //从矩形左中点画水平向右箭头
  // 从矩形左中点画水平向右箭头
  lines.push({
    coordinates: [
      {
        x: rect.x,
        y: rect.y + rect.height / 2
      },
      {
        x: rect.x + rect.width,
        y: rect.y + rect.height / 2
      }
    ]
  })
  lines.push({
    coordinates: [
      {
        x: rect.x + rect.width - 10,
        y: rect.y + rect.height / 2 - 5
      },
      {
        x: rect.x + rect.width,
        y: rect.y + rect.height / 2
      },
      {
        x: rect.x + rect.width - 10,
        y: rect.y + rect.height / 2 + 5
      }
    ]
  })
  //从矩形上中点画垂直向下箭头
  lines.push({
    coordinates: [
      {
        x: rect.x + rect.width / 2,
        y: rect.y
      },
      {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height
      }
    ]
  })
  lines.push({
    coordinates: [
      {
        x: rect.x + rect.width / 2 - 5,
        y: rect.y + rect.height - 10
      },
      {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height
      },
      {
        x: rect.x + rect.width / 2 + 5,
        y: rect.y + rect.height - 10
      }
    ]
  })

  return lines
}

const getText = (rect: RectAttrs, lines: number, day: number, height: number, percent: number): TextAttrs[] => {
  const texts: TextAttrs[] = []

  texts.push({
    text: `K线数: ${lines}, 天数: ${day}`,
    x: rect.x,
    y: rect.y + rect.height
  })

  texts.push({
    text: `${height.toFixed(2)} (${(percent * 100).toFixed(2)}%)`,
    x: rect.x,
    y: rect.y + rect.height + 14
  })

  return texts
}

export const TimeOverlay: OverlayTemplate<DrawOverlayParams> = {
  name: 'time',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  createPointFigures: ({ coordinates, chart, overlay }) => {
    if (coordinates.length < 2) {
      return []
    }

    const points = chart.convertFromPixel([
      { x: coordinates[0].x, y: coordinates[0].y },
      { x: coordinates[1].x, y: coordinates[0].y }
    ]) as Point[]
    const dataList = chart.getDataList().slice(points[0].dataIndex, points[1].dataIndex + 1)

    let kline = 1
    let day = 1

    if (dataList.length > 1) {
      const first = dataList[0]
      const last = dataList[dataList.length - 1]

      if (first) {
        kline = dataList.length
        day = Math.abs(dayjs(first.timestamp).diff(dayjs(last.timestamp), 'day'))
      }
    }

    const percent = Math.abs((coordinates[1].y - coordinates[0].y) / coordinates[0].y)
    const height = coordinates[0].y - coordinates[1].y

    const rect = getRect(coordinates)
    const lines = getArrow(rect)
    const texts = getText(rect, kline, day, height, percent)
    
    return [
      {
        type: 'rect',
        attrs: rect,
        styles: {
          ...drawOverlayParamsToFigureStyle('rect', overlay.extendData),
          color: colorUtil.rgbaToString(colorUtil.hexToRGBA(colorUtil.rgbToHex(colorUtil.parseRGBA(overlay.extendData.color)!), 0.2)),
          style: PolygonType.StrokeFill
        }
      },
      {
        type: 'line',
        attrs: lines,
        styles: drawOverlayParamsToFigureStyle('line', overlay.extendData)
      },
      {
        type: 'text',
        attrs: texts,
        styles: {
          ...drawOverlayParamsToFigureStyle('text', overlay.extendData),
          textAlign: 'left',
          textBaseline: 'top',
          backgroundColor: 'transparent'
        }
      }
    ]
  }
}
