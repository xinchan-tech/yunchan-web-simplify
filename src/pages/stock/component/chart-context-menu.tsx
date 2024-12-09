import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent, ContextMenuSeparator, ContextMenuCheckboxItem, ContextMenuRadioGroup, ContextMenuLabel, ContextMenuRadioItem } from "@/components"
import { cn } from "@/utils/style"
import type { PropsWithChildren } from "react"
import { useKChartContext } from "../lib"
import { curry } from 'lodash-es'

interface ChartContextMenuProps {
  index: number
}

export const ChartContextMenu = (props: PropsWithChildren<ChartContextMenuProps>) => {
  const { setState } = useKChartContext()

  const onChangeSecondaryIndicators = (count: number) => () => {
    setState(draft => {
      const current = draft.state[props.index - 1].secondaryIndicators
      let newIndicators = []
      if (current.length > count) {
        newIndicators = current.slice(0, count)
      } else {
        newIndicators = current.concat(Array(count - current.length).fill('9'))
      }

      draft.state[props.index - 1].secondaryIndicators = newIndicators
      if (props.index === 1) {
        draft.secondaryIndicators = newIndicators
      }
    })
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