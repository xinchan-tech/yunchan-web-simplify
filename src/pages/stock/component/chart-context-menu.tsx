
import {  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from "@/components"
import type { PropsWithChildren } from 'react'
import { chartManage, type ChartStore, MainYAxis } from "../lib"

interface ChartContextMenuProps {
  index: number
  // onChangeSecondaryCount: (count: number) => void
  // onChangeYAxis?: (type: Parameters<typeof kChartUtils.setYAxis>[0]['yAxis']) => void
}

export const ChartContextMenu = (props: PropsWithChildren<ChartContextMenuProps>) => {
  // const timeIndex = useKChartStore(s => s.state[props.index].timeIndex)
  // const symbol = useKChartStore(s => s.state[props.index].symbol)

  // const onChangeSecondaryIndicators = (count: number) => () => {
  //   kChartUtils.setSecondaryIndicatorsCount({ count, index: props.index, indicator: { id: '9', type: 'system', timeIndex, symbol, key: nanoid(), name: '买卖点位' } })
  //   setTimeout(() => {
  //     props.onChangeSecondaryCount(count)
  //   })
  // }

  // const _setYAxis = (type: Parameters<typeof kChartUtils.setYAxis>[0]['yAxis']) => () => {
  //   kChartUtils.setYAxis({ index: props.index, yAxis: type })
  //   // setTimeout(() => {
  //   //   props.onChangeYAxis(type)
  //   // })
  // }

  const _setYAxis = (type: ChartStore['yAxis']) => () => {
    chartManage.setYAxis(type)
  }

  return (
 
    <ContextMenu>
      <ContextMenuTrigger asChild >
        <div className="w-full h-full overflow-hidden flex flex-col">
        {
          props.children
        }
      </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-24 min-w-4 border border-solid border-dialog-border">
        <ContextMenuSub>
          <ContextMenuSubTrigger>主图坐标</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-24 min-w-4 border border-solid border-dialog-border" sideOffset={10}>
            <ContextMenuItem onClick={_setYAxis({ right: MainYAxis.Price })}>价格坐标</ContextMenuItem>
            <ContextMenuItem onClick={_setYAxis({ right: MainYAxis.Percentage })}>涨幅坐标</ContextMenuItem>
            <ContextMenuItem onClick={_setYAxis({ left: MainYAxis.Price, right: MainYAxis.Percentage })}>双边坐标</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>附图数量</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-24 min-w-4 border border-solid border-dialog-border" sideOffset={10}>
            {/* <ContextMenuItem onClick={onChangeSecondaryIndicators(0)}>0个窗口</ContextMenuItem>
            <ContextMenuItem onClick={onChangeSecondaryIndicators(1)}>1个窗口</ContextMenuItem>
            <ContextMenuItem onClick={onChangeSecondaryIndicators(2)}>2个窗口</ContextMenuItem>
            <ContextMenuItem onClick={onChangeSecondaryIndicators(3)}>3个窗口</ContextMenuItem>
            <ContextMenuItem onClick={onChangeSecondaryIndicators(4)}>4个窗口</ContextMenuItem>
            <ContextMenuItem onClick={onChangeSecondaryIndicators(5)}>5个窗口</ContextMenuItem> */}
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  )
}
