import { getStockIndicators } from "@/api"
import { Button, Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Input, JknIcon, Label, Popover, PopoverContent, PopoverTrigger, RadioGroup, RadioGroupItem, ScrollArea, useModal } from "@/components"
import { useToast, useZForm } from "@/hooks"
import { useIndicator } from "@/store"
import { useQuery } from "@tanstack/react-query"
import Decimal from "decimal.js"
import { memo, useEffect, useState } from "react"
import { useFieldArray } from "react-hook-form"
import { z } from "zod"
import { useKChartStore } from "../lib"

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
  onIndicatorChange: (params: { value: string, index: number, type: string, name: string }) => void
}

export const SecondaryIndicator = memo((props: SecondaryIndicatorProps) => {
  const indicators = useQuery({
    queryKey: [getStockIndicators.cacheKey],
    queryFn: () => getStockIndicators(),
    select: data => data?.secondary ?? []
  })
  const [searchKey, setSearchKey] = useState('')
  const currentSecondaryIndicator = useKChartStore(s => s.state[props.mainIndex].secondaryIndicators[props.index])

  const _onChange = (v: string) => {

    const indicator = findIndicator(v)

    props.onIndicatorChange({ value: v, index: props.index, type: (indicator as any)?.db_type,  name: indicator?.name ?? '' })
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
    footer: null,
    closeIcon: true
  })



  const onOpenIndicatorParams = () => {
    indicatorParamsForm.modal.open()
  }


  return (
    <div>
      {
        indicatorParamsForm.context
      }
      <Popover>
        <PopoverTrigger asChild>
          <div className="px-2 py-1 rounded-sm hover:text-secondary cursor-pointer hover:border-dialog-border left-2 top-0 border border-solid border-border text-sm text-tertiary">
            <span>{name}</span>
            <JknIcon name="arrow_down" className="w-3 h-3 ml-1" />
          </div>
        </PopoverTrigger>
        <PopoverContent align="start" side="top" sideOffset={10} alignOffset={-10} className="w-fit p-0">
          <div className="text-sm">
            <div className="flex items-center pr-2">
              <div className="flex-1">
                <Input placeholder="搜索指标" className="border-none placeholder:text-tertiary" value={searchKey} onChange={(e) => setSearchKey(e.target.value)} />
              </div>
              <JknIcon onClick={onOpenIndicatorParams} name="ic_settings" className="w-4 h-4 cursor-pointer" />
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
                            <RadioGroupItem className="border-white/70" value={ele.id} id={`stock-secondary-indicator-${props.mainIndex}-${props.index}-${ele.id}`} />
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
)
const indicatorParamsSchema = z.object({
  params: z.array(z.object({
    min: z.string().optional(),
    max: z.string().optional(),
    default: z.string(),
    name: z.string(),
    value: z.string()
  }).refine((v) => {
    if (!v.value) return false

    if (v.min && Decimal.create(v.value).lt(v.min)) return

    if (v.max && Decimal.create(v.value).gt(v.max)) return false

    return true
  }, { message: '参数值不在范围内' }))
})

const IndicatorParamsForm = () => {
  const { indicatorParams, setIndicatorParams } = useIndicator()
  const form = useZForm(indicatorParamsSchema, {
    params: []
  })
  const [indicator, setIndicator] = useState(indicatorParams[0].id)
  const arrayFields = useFieldArray({
    control: form.control,
    name: 'params'
  })

  useEffect(() => {
    const params = indicatorParams.find(item => item.id === indicator)?.params ?? []
    form.setValue('params', params)
  }, [indicator, indicatorParams, form])

  const onResetDefault = () => {
    const params = indicatorParams.find(item => item.id === indicator)?.params ?? []
    form.setValue('params', params.map(item => ({ ...item, value: item.default })))
  }

  const { toast } = useToast()

  const submitParams = async () => {
    const valid = await form.trigger()

    if (!valid) {
      for (const err of Object.keys(form.formState.errors) as unknown as (keyof typeof form.formState.errors)[]) {
        toast({ description: (form.formState.errors[err] as any)[0].root.message })
        return
      }
    }

    const values = form.getValues()

    setIndicatorParams({
      id: indicator,
      params: values.params
    })

    toast({ description: '保存成功' })

  }

  return (
    <div className="flex text-sm">
      <div className="h-[50vh] overflow-y-auto">
        {
          indicatorParams.map((item) => (
            <div key={item.id} className="data-[state=active]:bg-accent hover:!bg-primary py-2 w-60 px-2 box-border" data-state={indicator === item.id ? 'active' : ''} onClick={() => setIndicator(item.id)} onKeyDown={() => { }}>
              {item.name}
            </div>
          ))
        }
      </div>
      <div className="w-96 h-[50vh] overflow-y-auto box-border p-4">
        <div className="mb-4">
          参数列表
        </div>
        <Form  {...form}>
          <form className="space-y-4">
            {
              arrayFields.fields.map((field, index) => {
                return (
                  <FormField
                    key={field.id}
                    control={form.control}
                    rules={{ min: 1 }}
                    name={`params.${index}.value`}
                    render={({ field }) => {
                      const name = arrayFields.fields[index].name
                      const param = indicatorParams.find(item => item.id === indicator)?.params.find(item => item.name === name)
                      return (
                        (
                          <FormItem>
                            <FormLabel className="font-normal">
                              参数名：&nbsp;&nbsp;{name} <span className="text-xs text-tertiary">(默认:{param?.default}, 最小:{param?.min}, 最大:{param?.max})</span>
                            </FormLabel>
                            <div className="flex items-center">
                              <span className="w-20">参数值：</span>
                              <FormControl>
                                <Input className="border-border" size="sm" {...field} />
                              </FormControl>
                            </div>
                            <FormDescription />
                            <FormMessage />
                          </FormItem>
                        )
                      )
                    }}
                  />
                )
              })
            }
          </form>
          <div className="hover:text-primary cursor-pointer mt-2 text-xs text-tertiary" onClick={onResetDefault} onKeyDown={() => { }}>恢复默认值</div>
        </Form>
        <div className=" text-center mt-4">
          <Button size="sm" className="w-24" onClick={submitParams}>保存</Button>
        </div>
      </div>
    </div>
  )
}