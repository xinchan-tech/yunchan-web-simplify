import { useStockList } from '@/store'
import { useMount, useUnmount } from 'ahooks'
import { type HierarchyRectangularNode, type Selection, hierarchy, select, treemap } from 'd3'
import { useEffect, useRef } from 'react'

import { router } from '@/router'
import { getStringWidth } from '@/utils/string'
import Decimal from 'decimal.js'
import { debounce } from 'radash'
import { useLatestRef } from '@/hooks'

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
  // /**
  //  * symbol底部像素
  //  */
  // symbolLabelTop?: number
  // /**
  //  * symbol长度
  //  */
  // symbolLabelLen?: number
  // /**
  //  * price底部像素
  //  */
  // priceLabelTop?: number
  /**
   *
   */
  percentText: string
  percentSize: number
  symbolText: string
  symbolSize: number
  [key: string]: unknown
}

interface TreeMapProps {
  data: TreeMapData[]
  parentLabel?: boolean
  loading?: boolean
}

const SINGLE_CHART_WIDTH = getStringWidth('树', '12px sans-serif')
const ELLIPSIS_WIDTH = getStringWidth('...', '12px sans-serif')
const ONE_PX_WIDTH = getStringWidth('T', '1px sans-serif')

const TreeMap = (props: TreeMapProps) => {
  // const listMap = useStockList(s => s.listMap)
  const chartRef = useRef<Selection<SVGSVGElement, unknown, null, undefined>>()
  const chartDomRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const sizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 })
  const dataRef = useLatestRef(props.data)

  useMount(() => {
    if (!chartDomRef.current) {
      console.warn('DOM element not found')
      return
    }

    const { clientWidth, clientHeight } = chartDomRef.current
    const svg = select(chartDomRef.current).append('svg').attr('width', clientWidth).attr('height', clientHeight)

    chartRef.current = svg
  })

  useUnmount(() => {
    chartRef.current?.remove()
  })

  useEffect(() => {
    render(props.data)

    const resizeObserver = new ResizeObserver(
      debounce({ delay: 20 }, entries => {
        const { width, height } = entries[0].contentRect
        chartRef.current?.attr('width', width).attr('height', height)
        if (sizeRef.current.width !== width || sizeRef.current.height !== height) {
          sizeRef.current.width = width
          sizeRef.current.height = height
          render(dataRef.current)
        }
      })
    )

    resizeObserver.observe(chartDomRef.current!)

    return () => {
      resizeObserver.disconnect()
    }
  }, [props.data, dataRef])

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
    const root = treemap<TreeMapData>().size([clientWidth, clientHeight]).padding(1).paddingTop(24)(
      hierarchy<TreeMapData>({ name: 'root', children: data as any } as any).sum(d => d.value ?? 0)
    )
    chartRef.current.selectAll('*').remove()
    renderRect(root)
    renderTitles(root)
    // renderIcon(root)
    renderLabel(root)
    renderPercent(root)
  }

  useUnmount(() => {
    chartRef.current?.remove()
  })

  const renderRect = (root: HierarchyRectangularNode<TreeMapData>) => {
    chartRef
      .current!.selectAll('rect')
      .data(root.leaves())
      .enter()
      .append('rect')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('fill', d => d.data.color ?? 'transport')
      .on('click', (_, d) => {
        router.navigate(`/app/stock?symbol=${d.data.name}`)
      })
  }

  const renderTitles = (root: HierarchyRectangularNode<TreeMapData>) => {
    if (root.height <= 1) {
      return
    }
    chartRef
      .current!.selectAll('titles')
      .data(root.descendants().filter(d => d.depth === 1))
      .enter()
      .append('text')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0 + 16)
      .text(d => {
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
      .attr('font-size', '14px')
      .attr('style', 'user-select: none;')
      .attr('fill', () => '#B8B8B8')

    // chartRef.current!.selectAll('titles').data(root.descendants().filter(d => d.depth === 1)).enter()
    //   .append("text")
    //   .attr("x", (d) => d.x0 + (d.data.titleWidth ?? 0) + 2)
    //   .attr("y", (d) => d.y0 + 14)
    //   .text((d) => `${Decimal.create(d.data.data).mul(100).toDP(3).toNumber()}%`)
    //   .attr("font-size", "12px")
    //   .attr("fill", (d) => (d.data.data ?? 0) >= 0 ? 'hsl(var(--stock-up-color)' : 'hsl(var(--stock-down-color))')
  }

  const renderLabel = (root: HierarchyRectangularNode<TreeMapData>) => {
    chartRef
      .current!.selectAll('labels')
      .data(root.leaves())
      .enter()
      .append('text')
      .attr('x', d => {
        const text = d.data.name
        const rectWidth = d.x1 - d.x0
        const maxTextWidth = rectWidth * 0.6
        const rectHeight = d.y1 - d.y0

        let textSize = Math.max(Math.sqrt(maxTextWidth * rectHeight) / 6, 12)

        if (textSize < 12) {
          textSize = 12
        }

        if (textSize > 32) {
          textSize = 32
        }

        let textWidth = getStringWidth(text, `${textSize}px sans-serif`)
        if (textWidth > rectWidth) {
          textSize = (textSize * rectWidth) / textWidth
          textWidth = rectWidth
        }
        d.data.symbolSize = textSize
        d.data.symbolText = text
        return d.x0 + (rectWidth - textWidth) / 2
      }) // +10 to adjust position (more right)
      .attr('y', d => {
        return d.y0 + (d.y1 - d.y0) / 2 - 2
      })
      .text(d => {
        return d.data.name
      })
      .attr('font-size', d => `${d.data.symbolSize}px`)
      .attr('fill', 'white')
      .attr('style', 'user-select: none;')
      .on('click', (_, d) => {
        router.navigate(`/app/stock/trading?symbol=${d.data.name}`)
      })
  }

  const renderPercent = (root: HierarchyRectangularNode<TreeMapData>) => {
    chartRef
      .current!.selectAll('percent')
      .data(root.leaves())
      .enter()
      .append('text')
      .text(d => {
        const text = `${Decimal.create(d.data.data).gt(0) ? '+' : ''}${Decimal.create(d.data.data)}%`
        const rectWidth = d.x1 - d.x0
        const maxTextWidth = rectWidth * 0.4
        const rectHeight = (d.y1 - d.y0) * 0.8
        let textSize = Math.max(Math.sqrt(maxTextWidth * rectHeight) / 6, 10)
        if (textSize < 10) {
          textSize = 10
        }

        if (textSize > 20) {
          textSize = 20
        }
        d.data.percentSize = textSize
        d.data.percentText = text
        return text
      })
      .attr('x', d => {
        const text = d.data.percentText

        const rectWidth = d.x1 - d.x0
        const textSize = d.data.percentSize
        const textWidth = getStringWidth(text, `${textSize}px sans-serif`)
        return d.x0 + (rectWidth - textWidth) / 2
      })
      .attr('y', d => {
        return d.y0 + (d.y1 - d.y0) / 2 + d.data.percentSize + 4
      })
      .attr('font-size', d => `${d.data.percentSize}px`)
      // .attr("fill", d => (d.data.data ?? 0) >= 0 ? 'hsl(var(--stock-up-color)' : 'hsl(var(--stock-down-color))')
      .attr('fill', () => '#fff')
      .attr('style', 'user-select: none;') // corrected 'sty' to 'style' and added 'user-select: none;'
      .on('click', (_, d) => {
        router.navigate(`/app/stock/trading?symbol=${d.data.name}`)
      })
  }

  return (
    <div className="w-full h-full overflow-hidden relative">
      <div ref={chartDomRef} className="w-full overflow-hidden absolute -top-6 bottom-0 left-0 right-0" />
      <div className="absolute top-0 left-0" ref={tipRef} />
    </div>
  )
}

export default TreeMap
