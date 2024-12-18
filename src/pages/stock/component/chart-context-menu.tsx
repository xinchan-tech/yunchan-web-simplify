import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent, ContextMenuSeparator } from "@/components"
import { cn } from "@/utils/style"
import type { PropsWithChildren } from "react"
import { useKChartContext } from "../lib"
import { nanoid } from "nanoid"

interface ChartContextMenuProps {
  index: number
}

export const ChartContextMenu = (props: PropsWithChildren<ChartContextMenuProps>) => {
  const { state, setSecondaryIndicatorsCount } = useKChartContext()
  const chart = state[props.index]
  const onChangeSecondaryIndicators = (count: number) => () => {
    setSecondaryIndicatorsCount({ count, index: props.index, indicator: { id: '9', type: 'system', timeIndex: chart.timeIndex, symbol: chart.symbol, key: nanoid() } })
  }


  return (
    <ContextMenu>
      <ContextMenuTrigger className={cn(`chart-item-${props.index}`, 'overflow-hidden')}>
        {
          props.children
        }
      </ContextMenuTrigger>
      <ContextMenuContent className="w-32 border border-solid border-dialog-border">
        <ContextMenuSub>
          <ContextMenuSubTrigger>主图坐标</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-24 border border-solid border-dialog-border" sideOffset={10}>
            <ContextMenuItem>价格坐标</ContextMenuItem>
            <ContextMenuItem>涨幅坐标</ContextMenuItem>
            <ContextMenuItem>双边坐标</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger >附图数量</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-24 border border-solid border-dialog-border" sideOffset={10}>
            <ContextMenuItem onClick={onChangeSecondaryIndicators(0)}>0个窗口</ContextMenuItem>
            <ContextMenuItem onClick={onChangeSecondaryIndicators(1)}>1个窗口</ContextMenuItem>
            <ContextMenuItem onClick={onChangeSecondaryIndicators(2)}>2个窗口</ContextMenuItem>
            <ContextMenuItem onClick={onChangeSecondaryIndicators(3)}>3个窗口</ContextMenuItem>
            <ContextMenuItem onClick={onChangeSecondaryIndicators(4)}>4个窗口</ContextMenuItem>
            <ContextMenuItem onClick={onChangeSecondaryIndicators(5)}>5个窗口</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  )
}