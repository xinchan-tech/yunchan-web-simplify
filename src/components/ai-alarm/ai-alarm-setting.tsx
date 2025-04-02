import { type StockCategory, addAlarm, getAlarmConditionsList, getAlarmTypes } from '@/api'
import { useToast, useZForm } from '@/hooks'
import StockSelectInput from '@/pages/alarm/components/stock-select-input'
import { cn } from '@/utils/style'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useBoolean, useUpdateEffect } from 'ahooks'
import to from 'await-to-js'
import { type CSSProperties, forwardRef, useEffect, useMemo, useState } from 'react'
import { FormProvider, useFormContext } from 'react-hook-form'
import { z } from 'zod'
import { JknIcon } from '../jkn/jkn-icon'
import { Button } from '../ui/button'
import { FormControl, FormField, FormItem, FormLabel } from '../ui/form'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'
import { AlarmStockPicker } from "./components/alarm-stock-picker"
import { Separator } from "../ui/separator"
import { StockCycleSelect } from "./components/alarm-period"
import { DatePicker } from "./components/date-picker"
import { FrequencySelect } from "./components/frequency-select"
import { NameInput } from "./components/name-input"
import { useConfig } from "@/store"

const formSchema = z.object({
  symbol: z.string({ message: '股票代码错误' }).min(1, '股票代码错误'),
  stockCycle: z.array(z.string()).min(1, '至少选择一个周期'),
  categoryIds: z.array(z.string()).min(1, '请选择报警类型'),
  categoryHdlyIds: z.array(z.string()).optional(),
  frequency: z.string({ message: '周期错误' }),
  name: z.string().optional(),
  date: z.string().optional()
})

interface AiAlarmSetting {
  code?: string
  onClose?: () => void
}

const AiAlarmSetting = (props: AiAlarmSetting) => {
  const form = useZForm(formSchema, {
    stockCycle: [],
    categoryHdlyIds: [],
    categoryIds: [],
    symbol: props.code ?? '',
    name: '',
    frequency: '1',
    date: ''
  })
  const [loading, { toggle }] = useBoolean(false)

  const { toast } = useToast()
  const queryClient = useQueryClient()

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

    toggle()

    const [err] = await to(addAlarm(params))

    if (err) {
      toast({ description: err.message })
      toggle()
      return
    }

    toast({ description: '添加成功' })
    toggle()
    queryClient.refetchQueries({
      queryKey: [getAlarmConditionsList.cacheKey],
    })
  }

  return (
    <div className="h-full w-full overflow-hidden flex flex-col">
      <FormProvider {...form}>
        <form className="px-8 mt-4">
          <FormField
            control={form.control}
            name="symbol"
            render={({ field }) => (
              <FormItem className="pb-4 flex items-center space-y-0">
                <FormLabel className="w-32">股票名称</FormLabel>
                <FormControl>
                  <AlarmStockPicker {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stockCycle"
            render={({ field }) => (
              <FormItem className="pb-4 flex items-start space-y-0">
                <FormLabel className="w-32 flex-shrink-0">报警周期</FormLabel>
                <FormControl>
                  <StockCycleSelect {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="text-base">报警类型</div>
          <Separator className="my-2 h-[1px] w-full" />
          <FormField
            control={form.control}
            name="categoryIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel />
                <FormControl>
                  <AlarmsTypeSelect {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryHdlyIds"
            render={({ field }) => (
              <FormItem className="pb-4 flex items-start space-y-0">
                <FormLabel className="w-32 flex-shrink-0">底部信号</FormLabel>
                <FormControl>
                  <StockHdlySelect {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="pb-4 flex space-y-0  items-center">
                <FormLabel className="w-32">报警名称</FormLabel>
                <FormControl >
                  <NameInput {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem className="pb-4 flex space-y-0 items-center">
                <FormLabel className="w-32">触发频率</FormLabel>
                <FormControl >
                  <FrequencySelect {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          {
            form.getValues('frequency') === '1' ? (
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="pb-4 flex space-y-0  items-center">
                    <FormLabel className="w-32">到期时间</FormLabel>
                    <FormControl >
                      <DatePicker {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            ) : null
          }
        </form>
      </FormProvider>
      <div className="text-right mt-auto mb-6 space-x-4 px-8">
        <Button className="w-24" variant="outline" onClick={props.onClose}>
          取消
        </Button>
        <Button className="w-24" loading={loading} onClick={onSubmit}>
          创建
        </Button>
      </div>
    </div>
  )
}

export default AiAlarmSetting



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
        {/* <div className="py-3 ml-3">
          {data?.children?.map(item => (
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
              {method?.id === item.id && props.value?.length && props.value.length > 0 ? (
                <div className="bg-stock-down rounded-full absolute -right-2 -top-2 w-4 h-4 text-xs">
                  {props.value?.length}
                </div>
              ) : null}
            </div>
          ))}
        </div> */}
        <div className="py-3">
          {method?.children?.map(item => (
            <div key={item.id} className="flex mb-4">
              <div
                className="flex-shrink-0 flex items-center text-sm w-32"
                style={{
                  color: item.name === '多头策略' ? 'hsl(var(--stock-up-color))' : 'hsl(var(--stock-down-color))'
                }}
              >
                {/* <JknIcon name={item.name === '多头策略' ? 'ic_price_up_green' : 'ic_price_down_red'} /> */}
                {item.name}
                {
                  item.name === '多头策略' ? '↑' : '↓'
                }
              </div>
              <ToggleGroup
                value={props.value}
                onValueChange={v => _onValueChange(v, item.name)}
                type="multiple"
                size="xl"
                hoverColor="#2E2E2E"
                activeColor={item.name === '多头策略' ? useConfig.getState().getStockColor(true, 'hex') : useConfig.getState().getStockColor(false, 'hex')}
                variant="ghost"
                className="flex-1 grid grid-cols-4 gap-3"
              >
                {(item.children as unknown as StockCategory[])?.map(child =>
                  child.name !== '' ? (
                    <ToggleGroupItem
                      disabled={!child.authorized}
                      className="w-full relative"

                      key={child.id}
                      value={child.id}
                    >
                      {!child.authorized && <JknIcon name="ic_lock" className="absolute right-0 top-0 w-3 h-3" />}
                      {child.name}
                    </ToggleGroupItem>
                  ) : null
                )}
              </ToggleGroup>
            </div>
          ))}
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
    <div className="flex items-center">
      <ToggleGroup
        value={props.value}
        type="multiple"
        size="xl"
        hoverColor="#2E2E2E"
        variant="ghost"
        className="flex-1 grid grid-cols-4 gap-3"
        activeColor={useConfig.getState().getStockColor(true, 'hex')}
        onValueChange={props.onChange}
      >
        {data?.children?.map(item => (
          <ToggleGroupItem disabled={!item.authorized} className=" relative" key={item.id} value={item.id}>
            {!item.authorized && <JknIcon name="ic_lock" className="absolute right-0 top-0 w-3 h-3" />}
            {item.name}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
})
