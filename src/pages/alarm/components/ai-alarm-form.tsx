import { AlarmType, type StockCategory, addAlarm, getAlarmTypes } from "@/api"
import { Button, CapsuleTabs, FormControl, FormField, FormItem, FormLabel, JknIcon, ToggleGroup, ToggleGroupItem } from "@/components"
import { useToast, useZForm } from "@/hooks"
import { cn } from "@/utils/style"
import { useQuery } from "@tanstack/react-query"
import { useUpdateEffect } from "ahooks"
import to from "await-to-js"
import { type CSSProperties, forwardRef, useEffect, useMemo, useState } from "react"
import { FormProvider, useFormContext } from "react-hook-form"
import { z } from "zod"
import AlarmList from "./alarm-list"
import StockSelectInput from "./stock-select-input"
import AlarmLog from "./alarm-log"
const formSchema = z.object({
  symbol: z.string({ message: '股票代码错误' }).min(1, '股票代码错误'),
  stockCycle: z.array(z.string()).min(1, '至少选择一个周期'),
  categoryIds: z.array(z.string()).min(1, '请选择报警类型'),
  categoryHdlyIds: z.array(z.string()).optional()
})
const AiAlarmForm = () => {
  const [active, setActive] = useState('1')

  return (
    <div className="h-[800px] overflow-hidden">
      <div className="p-1 border-0 border-b border-solid border-border">
        <CapsuleTabs activeKey={active} onChange={setActive}>
          <CapsuleTabs.Tab label="报警设置" value="1" />
          <CapsuleTabs.Tab label="报警列表" value="2" />
          <CapsuleTabs.Tab label="已触发报警" value="3" />
        </CapsuleTabs>
      </div>
      <div>
        {{
          1: <AiAlarmSetting />,
          2: <AlarmList type={AlarmType.AI} />,
          3: <AlarmLog type={AlarmType.AI} />
        }[active] ?? null}
      </div>
    </div>
  )
}

const AiAlarmSetting = () => {
  const form = useZForm(formSchema, {
    stockCycle: [],
    categoryHdlyIds: [],
    categoryIds: [],
    symbol: ''
  })


  const { toast } = useToast()

  const onSubmit = async () => {
    const valid = await form.trigger()

    if (!valid) {
      for (const err of Object.keys(form.formState.errors) as unknown as (keyof typeof form.formState.errors)[]) {
        toast({ description: form.formState.errors[err]?.message })
        return
      }
    }

    const params = {
      symbol: form.getValues('symbol'),
      type: 0,
      stock_cycle: form.getValues('stockCycle'),
      condition: {
        category_ids: form.getValues('categoryIds'),
        category_hdly_ids: form.getValues('categoryHdlyIds')
      }
    }

    const [err] = await to(addAlarm(params))

    if (err) {
      toast({ description: err.message })
      return
    }

    toast({ description: '添加成功' })
  }


  return (
    <div>
      <FormProvider {...form}>
        <form className="space-y-4 px-8">
          <FormField control={form.control} name="symbol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>一、选择股票</FormLabel>
                <FormControl>
                  <StockSelectInput {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField control={form.control} name="stockCycle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>二、报警周期</FormLabel>
                <FormControl>
                  <StockCycleSelect {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField control={form.control} name="categoryIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>三、报警类型</FormLabel>
                <FormControl>
                  <AlarmsTypeSelect {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField control={form.control} name="categoryHdlyIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>四、底部策略</FormLabel>
                <FormControl>
                  <StockHdlySelect {...field} />
                </FormControl>
              </FormItem>
            )}
          />

        </form>
      </FormProvider>
      <div className="text-center mt-4">
        <Button className="w-24" onClick={onSubmit}>确定</Button>
      </div>
    </div>
  )
}




interface StockCycleSelectProps {
  value?: string[]
  onChange?: (value: string[]) => void
}
const StockCycleSelect = forwardRef((props: StockCycleSelectProps, _) => {
  const query = useQuery({
    queryKey: [getAlarmTypes.cacheKey],
    queryFn: () => getAlarmTypes()
  })

  return (
    <ToggleGroup value={props.value} type="multiple" onValueChange={props.onChange}>
      {
        query.data?.stock_kline.map(item => (
          <ToggleGroupItem disabled={!item.authorized} className="w-20 relative" key={item.id} value={item.value}>
            {
              !item.authorized && <JknIcon name="ic_lock" className="absolute right-0 top-0 w-3 h-3" />
            }
            {item.name}
          </ToggleGroupItem>
        ))
      }
    </ToggleGroup>
  )
})


interface AlarmsTypeSelectProps {
  value?: string[]
  onChange?: (value: string[]) => void
}
const AlarmsTypeSelect = forwardRef((props: AlarmsTypeSelectProps, _) => {
  const query = useQuery({
    queryKey: [getAlarmTypes.cacheKey],
    queryFn: () => getAlarmTypes()
  })
  const [method, setMethod] = useState<Awaited<ReturnType<typeof getAlarmTypes>>['stocks'][0]>()



  const data = useMemo(() => query.data?.stocks.find(item => item.name === '报警类型'), [query.data])


  const form = useFormContext()

  const categoryHdlyIds = form.watch('categoryHdlyIds')

  useUpdateEffect(() => {
    if (categoryHdlyIds.length > 0) {
      const arr = method?.children?.find(item => item.name === '空头策略')?.children?.map(item => item.id) ?? []
      props.onChange?.(props.value?.filter(v => !arr.includes(v)) ?? [])
    }
  }, [categoryHdlyIds, props.onChange, method])


  useEffect(() => {
    if (data?.children && data.children?.length > 0) {
      setMethod(data.children[0])
    }
  }, [data])



  const _onValueChange = (e: string[], type: string) => {
    if (type === '空头策略') {
      form.setValue('categoryHdlyIds', [])
    }

    props.onChange?.(e)
  }

  return (
    <>
      <div className="flex-1 flex flex-col">
        <div className="py-3 ml-3">
          {
            data?.children?.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'h-10 leading-10 w-40 mb-2 relative text-center rounded-sm text-secondary transition-all cursor-pointer bg-accent',
                  method?.id === item.id && 'bg-primary text-foreground'
                )}
                onClick={() => setMethod(item)}
                onKeyDown={() => { }}
              >
                {item.name}
                {
                  method?.id === item.id && props.value?.length && props.value.length > 0 ? (
                    <div className="bg-stock-down rounded-full absolute -right-2 -top-2 w-4 h-4 text-xs">
                      {props.value?.length}
                    </div>
                  ) : null
                }
              </div>
            ))
          }
        </div>
        <div className="py-3 border-0 border-t border-solid border-background">
          {
            method?.children?.map((item) => (
              <div key={item.id} className="flex mb-4">
                <div
                  className="flex-shrink-0 px-4 flex items-center text-sm"
                  style={{ color: item.name === '多头策略' ? 'hsl(var(--stock-up-color))' : 'hsl(var(--stock-down-color))' }}
                >
                  <JknIcon name={item.name === '多头策略' ? 'ic_price_up_green' : 'ic_price_down_red'} />
                  {item.name}
                </div>
                <ToggleGroup value={props.value} onValueChange={v => _onValueChange(v, item.name)} style={{
                  '--toggle-active-bg': item.name === '多头策略' ? 'hsl(var(--stock-up-color))' : 'hsl(var(--stock-down-color))',
                } as CSSProperties} type="multiple" className="flex-1 flex">
                  {(item.children as unknown as StockCategory[])?.map((child) => (
                    child.name !== '' ? (
                      <ToggleGroupItem disabled={!child.authorized} className="w-28 relative" key={child.id} value={child.id}>
                        {
                          !child.authorized && <JknIcon name="ic_lock" className="absolute right-0 top-0 w-3 h-3" />
                        }
                        {child.name}
                      </ToggleGroupItem>
                    ) : null
                  ))}
                </ToggleGroup>
              </div>
            ))
          }
        </div>
      </div>
    </>
  )
})


interface StockHdlySelectProps {
  value?: string[]
  onChange?: (value: string[]) => void
}
const StockHdlySelect = forwardRef((props: StockHdlySelectProps, _) => {
  const query = useQuery({
    queryKey: [getAlarmTypes.cacheKey],
    queryFn: () => getAlarmTypes()
  })

  const data = useMemo(() => query.data?.stocks.find(item => item.name === '底部叠加'), [query.data])

  return (
    <ToggleGroup activeColor="hsl(var(--stock-up-color))" value={props.value} type="multiple" onValueChange={props.onChange}>
      {
        data?.children?.map(item => (
          <ToggleGroupItem disabled={!item.authorized} className="w-20 relative" key={item.id} value={item.id}>
            {
              !item.authorized && <JknIcon name="ic_lock" className="absolute right-0 top-0 w-3 h-3" />
            }
            {item.name}
          </ToggleGroupItem>
        ))
      }
    </ToggleGroup>
  )
})


export default AiAlarmForm