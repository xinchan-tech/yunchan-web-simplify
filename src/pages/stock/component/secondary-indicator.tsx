import { Input, JknIcon, Label, Popover, PopoverContent, PopoverTrigger, RadioGroup, RadioGroupItem, ScrollArea } from "@/components"
import { getStockIndicators } from "@/api"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useKChartContext } from "../lib"

interface SecondaryIndicatorProps {
  /**
   * 附图的序号
   * 从1开始
   */
  index: number
  /**
   * 主图的序号
   * 从1开始
   */
  mainIndex: number
  /**
   * 附图的指标
   */
  onIndicatorChange: (params: { value: string, index: number }) => void
}

export const SecondaryIndicator = (props: SecondaryIndicatorProps) => {
  const indicators = useQuery({
    queryKey: [getStockIndicators.cacheKey],
    queryFn: () => getStockIndicators(),
    select: data => data?.secondary ?? []
  })
  const [searchKey, setSearchKey] = useState('')
  const { state, setState } = useKChartContext()

  const currentSecondaryIndicator = state[props.mainIndex - 1].secondaryIndicators[props.index - 1]

  const _onChange = (v: string) => {
    setState(d => { d.state[props.mainIndex - 1].secondaryIndicators[props.index - 1] = v })
    props.onIndicatorChange({ value: v, index: props.index })
  }

  const list = (() => {
    const res = []

    for (const item of indicators.data ?? []) {
      res.push({ ...item, indicators: item.indicators.filter(ele => ele.name?.includes(searchKey)) })
    }

    return res
  })()

  const name = (() => {
    for (const item of indicators.data ?? []) {
      for (const ele of item.indicators) {
        if (ele.id === currentSecondaryIndicator) {
          return ele.name
        }
      }
    }
  })()

  return (
    <Popover>
      <PopoverTrigger className="" asChild>
        <div className="px-2 py-1 rounded-sm hover:text-secondary cursor-pointer hover:border-dialog-border left-2 top-0 border border-solid border-border text-sm text-tertiary">
          <span>{name}</span>
          <JknIcon name="arrow_down" className="w-3 h-3 ml-1" />
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" sideOffset={10} alignOffset={-10} className="w-fit p-0">
        <div className="text-sm">
          <Input placeholder="搜索指标" className="border-none placeholder:text-tertiary" value={searchKey} onChange={(e) => setSearchKey(e.target.value)} />
          <div className="flex">
            {
              list?.map((item) => (
                <div key={item.id} className="flex flex-col w-48">
                  <div className="border-0 border-b border-t border-solid border-border text-center py-1 bg-background">{item.name}</div>
                  <ScrollArea className="h-[300px]">
                    <RadioGroup value={currentSecondaryIndicator} onValueChange={_onChange}>
                      {item.indicators.map((ele) => (
                        <div
                          className="hover:bg-primary cursor-pointer px-2 flex items-center w-full"
                          key={ele.id}
                          onKeyDown={() => { }}
                        >
                          <RadioGroupItem value={ele.id} id={`stock-secondary-indicator-${props.mainIndex}-${props.index}-${ele.id}`} />
                          <Label className="ml-2 flex-1 py-3" htmlFor={`stock-secondary-indicator-${props.mainIndex}-${props.index}-${ele.id}`}>
                            {ele.name}
                          </Label>
                        </div>
                      ))}

                    </RadioGroup>
                  </ScrollArea>
                </div>
              ))
            }
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}