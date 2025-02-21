import { useStockList } from "@/store"
import { useMount, useUnmount } from "ahooks"
import { useEffect, useRef } from "react"
import { select, hierarchy, treemap, type Selection, type HierarchyRectangularNode } from 'd3'

import { getStringWidth } from "@/utils/string"
import Decimal from "decimal.js"
import { router } from "@/router"
import { debounce, } from "radash"

type TreeMapData = {
  name: string
  value?: number
  data?: number
  children?: TreeMapData[]
  x0?: number
  x1?: number
  y0?: number
  y1?: number
  color?: string
  size?: number
  img?: string
  plateId?: number | string
  titleWidth?: number
  /**
   * 图片顶部像素
   */
  iconTop?: number
  /**
   * symbol底部像素
   */
  symbolLabelTop?: number
  /**
   * symbol长度
   */
  symbolLabelLen?: number
  /**
   * price底部像素
   */
  priceLabelTop?: number
  [key: string]: unknown
}

interface TreeMapProps {
  data: TreeMapData[]
  parentLabel?: boolean
  loading?: boolean
}


const SINGLE_CHART_WIDTH = getStringWidth('树', '12px sans-serif')
const ELLIPSIS_WIDTH = getStringWidth('...', '12px sans-serif')

const TreeMap = (props: TreeMapProps) => {
  const listMap = useStockList(s => s.listMap)
  const chartRef = useRef<Selection<SVGSVGElement, unknown, null, undefined>>()
  const chartDomRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const sizeRef = useRef<{ width: number, height: number }>({ width: 0, height: 0 })

  useMount(() => {
    if (!chartDomRef.current) {
      console.warn('DOM element not found')
      return
    }

    const { clientWidth, clientHeight } = chartDomRef.current
    const svg = select(chartDomRef.current)
      .append('svg')
      .attr('width', clientWidth)
      .attr('height', clientHeight)

    chartRef.current = svg
  })

  useUnmount(() => {
    chartRef.current?.remove()
  })

  useEffect(() => {
    render(props.data)

    const resizeObserver = new ResizeObserver(debounce({ delay: 1000 }, (entries) => {
      const { width, height } = entries[0].contentRect
      chartRef.current?.attr('width', width).attr('height', height)
      if (sizeRef.current.width === width && sizeRef.current.height === height) {
        sizeRef.current.width = width
        sizeRef.current.height = height
        render(props.data)
      }

    }))

    resizeObserver.observe(chartDomRef.current!)

    return () => {
      resizeObserver.disconnect()
    }
  }, [props.data])

  const render = (data: TreeMapData[]) => {
    if (!chartDomRef.current) {
      console.warn('DOM element not found')
      return
    }

    if (!chartRef.current) {
      console.warn('chartRef.current not found')
      return
    }

    const { clientWidth, clientHeight } = chartDomRef.current
    const root = treemap<TreeMapData>().size([clientWidth, clientHeight]).padding(1).paddingTop(18)(hierarchy<TreeMapData>({ name: 'root', children: data }).sum(d => d.value ?? 0))
    chartRef.current.selectAll('*').remove()
    renderRect(root)
    renderTitles(root)
    renderIcon(root)
    renderLabel(root)
    renderPercent(root)
  }

  useUnmount(() => {
    chartRef.current?.remove()
  })


  const renderRect = (root: HierarchyRectangularNode<TreeMapData>) => {
    chartRef.current!.selectAll('rect').data(root.leaves()).enter().append('rect').attr('x', (d) => d.x0)
      .attr('y', (d) => d.y0)
      .attr('width', (d) => d.x1 - d.x0)
      .attr('height', (d) => d.y1 - d.y0)
      .attr('fill', d => d.data.color ?? 'transport').on('dblclick', (_, d) => {
        router.navigate(`/stock/trading?symbol=${d.data.name}`)
      })
  }

  const renderTitles = (root: HierarchyRectangularNode<TreeMapData>) => {
    if (root.height <= 1) {
      return
    }
    chartRef.current!.selectAll('titles').data(root.descendants().filter(d => d.depth === 1)).enter()
      .append("text")
      .attr("x", (d) => d.x0)
      .attr("y", (d) => d.y0 + 14)
      .text((d) => {
        const totalWidth = d.x1 - d.x0
        let title = `${d.data.name}`
        const percentTitle = ` ${Decimal.create(d.data.data).mul(100).toDP(3).toNumber()}%`
        const titleWidth = getStringWidth(title, '12px sans-serif')
        const percentWidth = getStringWidth(percentTitle, '12px sans-serif') + 2
        if (titleWidth + percentWidth < totalWidth) {
          d.data.titleWidth = titleWidth
          return d.data.name
        }

        const singleWidth = titleWidth / title.length

        while (title.length > 0 && singleWidth * title.length + percentWidth > totalWidth) {
          title = title.slice(0, -1)
        }
        const _title = title.length > 0 ? `${title}...` : ''

        d.data.titleWidth = getStringWidth(_title, '12px sans-serif')

        return _title
      })
      .attr("font-size", "12px")
      .attr("fill", () => 'white')

    chartRef.current!.selectAll('titles').data(root.descendants().filter(d => d.depth === 1)).enter()
      .append("text")
      .attr("x", (d) => d.x0 + (d.data.titleWidth ?? 0) + 2)
      .attr("y", (d) => d.y0 + 14)
      .text((d) => `${Decimal.create(d.data.data).mul(100).toDP(3).toNumber()}%`)
      .attr("font-size", "12px")
      .attr("fill", (d) => (d.data.data ?? 0) >= 0 ? 'hsl(var(--stock-up-color)' : 'hsl(var(--stock-down-color))')

  }

  const renderLabel = (root: HierarchyRectangularNode<TreeMapData>) => {
    chartRef.current!
      .selectAll("labels")
      .data(root.leaves().filter(d => !!d.data.symbolLabelTop))
      .enter()
      .append("text")
      .attr("x", (d) => {
        const rectWidth = d.x1 - d.x0
        if (rectWidth < 4) {
          d.data.symbolLabelLen = 0
          return 0
        }

        let textWidth = getStringWidth(d.data.name, '12px sans-serif')

        let count = d.data.name.length

        if (textWidth > rectWidth) {
          count = Math.floor((rectWidth - ELLIPSIS_WIDTH) / SINGLE_CHART_WIDTH)
          d.data.symbolLabelLen = count
          textWidth = getStringWidth(`${d.data.name.slice(0, count)}...`, '12px sans-serif')
        }

        return d.x0 + (d.x1 - d.x0) / 2 - textWidth / 2
      })    // +10 to adjust position (more right)
      .attr("y", (d) => d.data.symbolLabelTop!)
      .text((d) => {
        if (d.data.symbolLabelLen) {
          return `${d.data.name.slice(0, d.data.symbolLabelLen)}...`
        }

        if (d.data.symbolLabelLen === 0) {
          return ''
        }
        return d.data.name
      })
      .attr("font-size", "12px")
      .attr("fill", "white").on('dblclick', (_, d) => {
        router.navigate(`/stock/trading?symbol=${d.data.name}`)
      })
  }

  const renderIcon = (root: HierarchyRectangularNode<TreeMapData>) => {
    chartRef.current!
      .selectAll("icons")
      .data(root.leaves().filter(d => {
        const rectWidth = d.x1 - d.x0
        const rectHeight = d.y1 - d.y0
        d.data.iconTop = undefined
        d.data.symbolLabelTop = undefined
        d.data.priceLabelTop = undefined
        d.data.symbolLabelLen = undefined

        /**
         * label格式: icon + padding + label + padding + percent
         * padding = 2
         * labelHeight = 12 * 1.2
         * percentHeight = 10 * 1.2
         * 优先级： icon + label + percent > icon+percent > label + percent > icon > label
         */
        // let imgSize = Math.min(rectWidth / 2, rectHeight / 2)
        // const icon = listMap[d.data.name]

        // if (!icon?.[0]) {
        //   imgSize = 0
        // }
        const imgSize = 0

        const padding = 2
        const labelHeight = 12 * 1.2
        const percentHeight = 10 * 1.2

        let totalHeight = imgSize + (imgSize ? padding : 0) + labelHeight + padding + percentHeight

        if (imgSize !== 0) {
          if (totalHeight < rectHeight - 6) {
            // icon + label + percent 
            const top = d.y0 + (rectHeight - totalHeight) / 2
            d.data.iconTop = top
            d.data.symbolLabelTop = top + imgSize + padding + labelHeight
            d.data.priceLabelTop = top + imgSize + padding + labelHeight + padding + percentHeight
          } else if (totalHeight - labelHeight - padding < rectHeight - 6) {
            // icon + percent
            totalHeight = imgSize + padding + percentHeight
            const top = d.y0 + (rectHeight - totalHeight) / 2
            d.data.iconTop = top
            d.data.priceLabelTop = top + imgSize + percentHeight
          } else if (totalHeight - imgSize - padding < rectHeight - 6) {
            // label + percent
            totalHeight = labelHeight + padding + percentHeight
            const top = d.y0 + (rectHeight - totalHeight) / 2
            d.data.symbolLabelTop = top + labelHeight
            d.data.priceLabelTop = top + labelHeight + padding + percentHeight
          } else if (imgSize < rectHeight - 6) {
            // icon
            const top = d.y0 + (rectHeight - imgSize) / 2
            d.data.iconTop = top
          } else if (labelHeight < rectHeight - 6) {
            // label
            const top = d.y0 + (rectHeight - labelHeight) / 2
            d.data.symbolLabelTop = top
          }
        } else {
          if (totalHeight < rectHeight - 6) {
            // label + percent
            const top = d.y0 + (rectHeight - labelHeight) / 2
            d.data.symbolLabelTop = top + labelHeight / 2
            d.data.priceLabelTop = d.data.symbolLabelTop + padding + percentHeight
          } else if (labelHeight < rectHeight - 6) {
            // label
            const top = d.y0 + (rectHeight - labelHeight) / 2
            d.data.symbolLabelTop = top + labelHeight / 2 + 2
          } else if (percentHeight < rectHeight - 6) {
            // percent
            const top = d.y0 + (rectHeight - percentHeight) / 2
            d.data.priceLabelTop = top
          }
        }

        if (!d.data.iconTop) return false

        return false
        // if (!icon?.[0]) {
        //   return false
        // }

        // d.data.size = imgSize
        // d.data.img = import.meta.env.PUBLIC_BASE_ICON_URL + icon[0]
        // return true
      }))
      .enter()
      .append("image")
      .attr("x", (d) => d.x0 + (d.x1 - d.x0) / 2 - d.data.size! / 2)    // +10 to adjust position (more right)
      .attr("y", (d) => d.data.iconTop!)
      .attr("width", (d) => d.data.size!)
      .attr("height", (d) => d.data.size!)
      .attr('href', (d) => d.data.img!)
      .attr('clip-path', d => `inset(0% round ${d.data.size!}px)`).on('dblclick', (_, d) => {
        router.navigate(`/stock/trading?symbol=${d.data.name}`)
      })
  }

  const renderPercent = (root: HierarchyRectangularNode<TreeMapData>) => {
    chartRef.current!
      .selectAll("percent")
      .data(root.leaves().filter(d => !!d.data.priceLabelTop))
      .enter()
      .append("text")
      .text((d) => {
        const text = `${Decimal.create(d.data.data)}%`
        const textWidth = getStringWidth(text, '10px sans-serif')
        const rectWidth = d.x1 - d.x0

        if (textWidth > rectWidth) {
          return ''
        }

        return (Decimal.create(d.data.data).gt(0) ? '+' : '') + text
      })
      .attr("x", (d) => {
        const text = `${Decimal.create(d.data.data)}%`
        const textWidth = getStringWidth(text, '10px sans-serif')
        const rectWidth = d.x1 - d.x0

        return d.x0 + rectWidth / 2 - textWidth / 2
      })
      .attr("y", (d) => d.data.priceLabelTop!)
      .attr("font-size", "10px")
      // .attr("fill", d => (d.data.data ?? 0) >= 0 ? 'hsl(var(--stock-up-color)' : 'hsl(var(--stock-down-color))')
      .attr("fill", () => '#fff')
      .on('dblclick', (_, d) => {
        router.navigate(`/stock/trading?symbol=${d.data.name}`)
      })
  }

  return (
    <div className="w-full h-full overflow-hidden relative" >
      <div ref={chartDomRef} className="w-full h-full overflow-hidden" />
      <div className="absolute top-0 left-0" ref={tipRef} />
    </div>
  )
}



export default TreeMap