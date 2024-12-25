import { useStockList } from "@/store"
import { useMount, useSize, useUnmount, useUpdateEffect } from "ahooks"
import { useRef } from "react"
import { select, hierarchy, treemap, type Selection, type HierarchyRectangularNode } from 'd3'
import { numToFixed } from "@/utils/price"

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
  [key: string]: unknown
}

interface TreeMapProps {
  data: TreeMapData[]
  parentLabel?: boolean
  loading?: boolean
}

const IMG_LIMIT_MIN = 25

const TreeMap = (props: TreeMapProps) => {
  const stockList = useStockList()
  const chartRef = useRef<Selection<SVGSVGElement, unknown, null, undefined>>()
  const chartDomRef = useRef<HTMLDivElement>(null)
  const treeMapSize = useSize(chartDomRef)

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
    render()

    chartRef.current = svg
  })

  const render = () => {
    if (!chartDomRef.current) {
      console.warn('DOM element not found')
      return
    }

    if (!chartRef.current) {
      console.warn('chartRef.current not found')
      return
    }

    const { clientWidth, clientHeight } = chartDomRef.current
    const root = treemap<TreeMapData>().size([clientWidth, clientHeight]).padding(1).paddingTop(18)(hierarchy<TreeMapData>({ name: 'root', children: props.data }).sum(d => d.value ?? 0))
    chartRef.current.selectAll('*').remove()
    renderRect(root)
    renderTitles(root)
    renderIcon(root)
    renderLabel(root)
    renderPercent(root)

  }


  useUpdateEffect(() => {
    render()
  }, [treeMapSize])

  useUnmount(() => {
    chartRef.current?.remove()
  })


  useUpdateEffect(() => {
    // // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    render()

  }, [props.data])

  const renderRect = (root: HierarchyRectangularNode<TreeMapData>) => {
    chartRef.current!.selectAll('rect').data(root.leaves()).enter().append('rect').attr('x', (d) => d.x0)
      .attr('y', (d) => d.y0)
      .attr('width', (d) => d.x1 - d.x0)
      .attr('height', (d) => d.y1 - d.y0)
      .attr('fill', d => d.data.color ?? 'transport')
  }

  const renderTitles = (root: HierarchyRectangularNode<TreeMapData>) => {
    if (root.height <= 1) {
      return
    }
    chartRef.current!.selectAll('titles').data(root.descendants().filter(d => d.depth === 1)).enter()
      .append("text")
      .attr("x", (d) => d.x0)
      .attr("y", (d) => d.y0 + 14)
      .text((d) => d.data.name)
      .attr("font-size", "12px")
      .attr("fill", () => 'white')

    chartRef.current!.selectAll('titles').data(root.descendants().filter(d => d.depth === 1)).enter()
      .append("text")
      .attr("x", (d) => d.x0 + 13 * d.data.name.replace(' ', '').length)
      .attr("y", (d) => d.y0 + 14)
      .text((d) => `${numToFixed((d.data.data ?? 0) * 100)}%`)
      .attr("font-size", "12px")
      .attr("fill", (d) => (d.data.data ?? 0) >= 0 ? 'hsl(var(--stock-up-color)' : 'hsl(var(--stock-down-color))')
  }

  const renderLabel = (root: HierarchyRectangularNode<TreeMapData>) => {
    chartRef.current!
      .selectAll("labels")
      .data(root.leaves().filter(d => {
        if (!d.data.img) return true

        const offsetY = d.y0 + (d.y1 - d.y0) / 2 - d.data.size! / 2 - 6 + d.data.size!

        if ((d.y1 - offsetY) < 30) return false



        return true
      }))
      .enter()
      .append("text")
      .attr("x", (d) => {
        const textWidth = d.data.name.length * 12
        const rectWidth = d.x1 - d.x0
        if ((textWidth - rectWidth) < 20) {
          return rectWidth / 2 - textWidth / 3 + d.x0
        }

        return d.x0
      })    // +10 to adjust position (more right)
      .attr("y", (d) => {
        if (d.data.img) {
          return d.y0 + (d.y1 - d.y0) / 2 - d.data.size! / 2 - 6 + d.data.size! + 16
        }

        return d.y0 + (d.y1 - d.y0) / 2
      })
      .text((d) => d.data.name)
      .attr("font-size", "12px")
      .attr("fill", "white")
  }

  const renderIcon = (root: HierarchyRectangularNode<TreeMapData>) => {
    chartRef.current!
      .selectAll("icons")
      .data(root.leaves().filter(d => {
        const rectWidth = d.x1 - d.x0
        const rectHeight = d.y1 - d.y0

        const imgSize = Math.min(rectWidth / 2, rectHeight / 2)

        if (imgSize < IMG_LIMIT_MIN) return false

        const icon = stockList.list.find(item => item[1] === d.data.name)

        if (!icon?.[0]) return false

        d.data.size = imgSize
        d.data.img = import.meta.env.PUBLIC_BASE_ICON_URL + icon[0]
        return true
      }))
      .enter()
      .append("image")
      .attr("x", (d) => d.x0 + (d.x1 - d.x0) / 2 - d.data.size! / 2)    // +10 to adjust position (more right)
      .attr("y", (d) => d.y0 + (d.y1 - d.y0) / 2 - d.data.size! / 2 - 6)
      .attr("width", (d) => d.data.size!)
      .attr("height", (d) => d.data.size!)
      .attr('href', (d) => d.data.img!)
      .attr('clip-path', d => `inset(0% round ${d.data.size!}px)`)
  }

  const renderPercent = (root: HierarchyRectangularNode<TreeMapData>) => {
    chartRef.current!
      .selectAll("percent")
      .data(root.leaves())
      .enter()
      .append("text")
      .attr("x", (d) => {
        const textWidth = (numToFixed(d.data.data! * 100, 2)?.length ?? -1 + 1) * 10
        const rectWidth = d.x1 - d.x0

        return d.x0 + rectWidth / 2 - textWidth / 3
      })
      .attr("y", (d) => {
        if (d.data.img) {
          const offsetY = d.y0 + (d.y1 - d.y0) / 2 - d.data.size! / 2 - 6 + d.data.size!
          return d.y0 + (d.y1 - d.y0) / 2 - d.data.size! / 2 - 6 + d.data.size! + ((d.y1 - offsetY) < 30 ? 13 : 32)
        }

        return d.y0 + (d.y1 - d.y0) / 2 + 16
      })
      .text((d) => `${numToFixed(d.data.data! * 100, 2)}%`)
      .attr("font-size", "10px")
      .attr("fill", d => (d.data.data ?? 0) >= 0 ? 'hsl(var(--stock-up-color)' : 'hsl(var(--stock-down-color))')
  }

  return (
    <div ref={chartDomRef} className="w-full h-full overflow-hidden" />
  )
}

export default TreeMap