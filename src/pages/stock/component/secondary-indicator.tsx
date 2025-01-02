import { Input, JknIcon, Label, Popover, PopoverContent, PopoverTrigger, RadioGroup, RadioGroupItem, ScrollArea, useModal } from "@/components"
import { getStockIndicators } from "@/api"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useKChartContext } from "../lib"
import { useIndicator } from "@/store"
import { useMount } from "ahooks"

interface SecondaryIndicatorProps {
  /**
   * 附图的序号
   * 从0开始
   */
  index: number
  /**
   * 主图的序号
   * 从0开始
   */
  mainIndex: number
  /**
   * 附图的指标
   */
  onIndicatorChange: (params: { value: string, index: number, type: string }) => void
}

export const SecondaryIndicator = (props: SecondaryIndicatorProps) => {
  const indicators = useQuery({
    queryKey: [getStockIndicators.cacheKey],
    queryFn: () => getStockIndicators(),
    select: data => data?.secondary ?? []
  })
  const [searchKey, setSearchKey] = useState('')
  const { state } = useKChartContext()

  const currentSecondaryIndicator = state[props.mainIndex].secondaryIndicators[props.index]

  const _onChange = (v: string) => {

    const indicator = findIndicator(v)

    props.onIndicatorChange({ value: v, index: props.index, type: (indicator as any)?.db_type })
  }

  const findIndicator = (id: string) => {
    for (const item of indicators.data ?? []) {
      for (const ele of item.indicators) {
        if (ele.id === id) {
          return ele
        }
      }
    }
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
        if (ele.id === currentSecondaryIndicator.id) {
          return ele.name
        }
      }
    }
  })()

  const indicatorParamsForm = useModal({
    content: <IndicatorParamsForm />,
    title: '指标参数编辑',
  })

  // useMount(() => {
  //   indicatorParamsForm.modal.open()
  // })

  return (
    <div>
      {
        indicatorParamsForm.context
      }
      <Popover>
        <PopoverTrigger className="" asChild>
          <div className="px-2 py-1 rounded-sm hover:text-secondary cursor-pointer hover:border-dialog-border left-2 top-0 border border-solid border-border text-sm text-tertiary">
            <span>{name}</span>
            <JknIcon onClick={() => indicatorParamsForm.modal.open()} name="arrow_down" className="w-3 h-3 ml-1" />
          </div>
        </PopoverTrigger>
        <PopoverContent align="start" side="top" sideOffset={10} alignOffset={-10} className="w-fit p-0">
          <div className="text-sm">
            <div className="flex items-center pr-2">
              <div className="flex-1">
                <Input placeholder="搜索指标" className="border-none placeholder:text-tertiary" value={searchKey} onChange={(e) => setSearchKey(e.target.value)} />
              </div>
              <JknIcon name="ic_settings" className="w-4 h-4 cursor-pointer" />
            </div>
            <div className="flex">
              {
                list?.map((item) => (
                  <div key={item.id} className="flex flex-col w-48">
                    <div className="border-0 border-b border-t border-solid border-border text-center py-1 bg-background">{item.name}</div>
                    <ScrollArea className="h-[300px]">
                      <RadioGroup value={currentSecondaryIndicator.id} onValueChange={_onChange}>
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
    </div>
  )
}


const IndicatorParamsForm = () => {
  const { indicatorParams } = useIndicator()

  return (
    <div>
      {
        indicatorParams.map((item) => (
          <div key={item.id}>
            <div>{item.id}</div>
            {
              item.params.map((ele) => (
                <div key={ele.name}>
                  <div>{ele.name}</div>
                  <div>{ele.value}</div>
                  <div>{ele.min}</div>
                  <div>{ele.max}</div>
                </div>
              ))
            }
          </div>
        ))
      }
    </div>
  )
}