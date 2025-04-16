import { type StockCategory, addAlarm, getAlarmConditionsList, getAlarmTypes } from '@/api'
import { useToast, useZForm } from '@/hooks'
import { useConfig } from '@/store'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useBoolean, useUpdateEffect } from 'ahooks'
import to from 'await-to-js'
import { forwardRef, useEffect, useMemo, useState } from 'react'
import { FormProvider, useFormContext } from 'react-hook-form'
import { z } from 'zod'
import { JknIcon } from '../jkn/jkn-icon'
import { Button } from '../ui/button'
import { FormControl, FormField, FormItem, FormLabel } from '../ui/form'
import { Separator } from '../ui/separator'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'
import { StockCycleSelect } from './components/alarm-period'
import { AlarmStockPicker } from './components/alarm-stock-picker'
import { DatePicker } from './components/date-picker'
import { FrequencySelect } from './components/frequency-select'
import { NameInput } from './components/name-input'

const formSchema = z.object({
  symbol: z.string({ message: '股票代码错误' }).min(1, '股票代码错误'),
  stockCycle: z.array(z.string()).min(1, '至少选择一个周期'),
  categoryIds: z.array(z.string()).min(1, '请选择警报类型'),
  categoryHdlyIds: z.array(z.string()).optional(),
  frequency: z.string({ message: '周期错误' }),
  name: z.string().optional(),
  date: z.string().optional(),
  categoryType: z.string().optional()
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
    date: '',
    categoryType: '多头策略'
  })
  const [loading, { toggle }] = useBoolean(false)

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const categoryType = form.watch('categoryType')

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
        category_hdly_ids: form.getValues('categoryHdlyIds'),
        frequency: +form.getValues('frequency')
      },
      expire_time: form.getValues('date'),
      name: form.getValues('name')
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
      queryKey: [getAlarmConditionsList.cacheKey]
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
                <FormLabel className="w-32 text-base font-normal">股票名称</FormLabel>
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
              <FormItem className="pb-2 flex items-start space-y-0">
                <FormLabel className="w-32 flex-shrink-0 text-base font-normal">警报周期</FormLabel>
                <FormControl>
                  <StockCycleSelect {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="text-base">警报类型</div>
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
              <FormItem className="pb-3 flex items-start space-y-0">
                <FormLabel
                  className="w-32 flex-shrink-0 text-base font-normal"
                  style={{ color: categoryType === '多头策略' ? 'hsl(var(--stock-up-color))' : '#808080' }}
                >
                  底部信号
                </FormLabel>
                <FormControl>
                  <StockHdlySelect {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <Separator className="my-2 h-[1px] w-full" />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="pb-3 flex space-y-0  items-center">
                <FormLabel className="w-32 text-base font-normal">警报名称</FormLabel>
                <FormControl>
                  <NameInput {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem className="pb-3 flex space-y-0 items-center">
                <FormLabel className="w-32 text-base font-normal">触发频率</FormLabel>
                <FormControl>
                  <FrequencySelect {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          {form.getValues('frequency') === '1' ? (
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="pb-4 flex space-y-0  items-center">
                  <FormLabel className="w-32 text-base font-normal">到期时间</FormLabel>
                  <FormControl>
                    <DatePicker {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          ) : null}
        </form>
      </FormProvider>
      <div className="text-right mt-auto mb-6 space-x-2 px-8">
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
  const [type, setType] = useState('多头策略')
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

  const onChangeType = (_type: string) => {
    setType(_type)
    if (type !== _type) {
      props.onChange?.([])
    }
    form.setValue('categoryType', _type)

    if (_type === '空头策略') {
      form.setValue('categoryHdlyIds', [])
    }
    // const item = method?.children?.find(item => item.name === type)
    // if (item) {
    //   setMethod(item)
    //   props.onChange?.(props.value?.filter(v => !item.children.map(i => i.id).includes(v)) ?? [])
    // }
  }

  return (
    <>
      <div className="flex-1 flex flex-col">
        <div className="py-2">
          {method?.children?.map(item => (
            <div key={item.id} className="flex mb-4">
              <div
                className="flex-shrink-0 flex items-center text-base font-normal w-32 cursor-pointer"
                onClick={() => onChangeType(item.name)}
                onKeyDown={() => {}}
                style={{
                  color:
                    item.name === type
                      ? item.name === '多头策略'
                        ? 'hsl(var(--stock-up-color))'
                        : 'hsl(var(--stock-down-color))'
                      : '#808080'
                }}
              >
                {/* <JknIcon name={item.name === '多头策略' ? 'ic_price_up_green' : 'ic_price_down_red'} /> */}
                {item.name}
                {item.name === '多头策略' ? '↑' : '↓'}
              </div>
              {type === item.name ? (
                <ToggleGroup
                  value={props.value}
                  onValueChange={v => _onValueChange(v, item.name)}
                  type="multiple"
                  hoverColor="#2E2E2E"
                  activeColor={
                    item.name === '多头策略'
                      ? useConfig.getState().getStockColor(true, 'hex')
                      : useConfig.getState().getStockColor(false, 'hex')
                  }
                  variant="ghost"
                  className="flex-1 grid grid-cols-4 gap-2 h-[38px]"
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
              ) : (
                <div className="h-[38px]" />
              )}
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

  const form = useFormContext()

  const categoryType = form.watch('categoryType')

  // useUpdateEffect(() => {
  //   if (categoryHdlyIds.length > 0) {
  //     const arr = method?.children?.find(item => item.name === '空头策略')?.children?.map(item => item.id) ?? []
  //     props.onChange?.(props.value?.filter(v => !arr.includes(v)) ?? [])
  //   }
  // }, [categoryHdlyIds, props.onChange, method])

  return (
    <div className="flex items-center flex-1">
      <ToggleGroup
        value={props.value}
        type="multiple"
        hoverColor="#2E2E2E"
        variant="ghost"
        className="flex-1 grid grid-cols-2 gap-2 h-[38px]"
        activeColor={useConfig.getState().getStockColor(true, 'hex')}
        onValueChange={props.onChange}
      >
        {categoryType === '多头策略' ? (
          data?.children?.map(item => (
            <ToggleGroupItem disabled={!item.authorized} className=" relative" key={item.id} value={item.id}>
              {!item.authorized && <JknIcon name="ic_lock" className="absolute right-0 top-0 w-3 h-3" />}
              {item.name}
            </ToggleGroupItem>
          ))
        ) : (
          <div />
        )}
      </ToggleGroup>
    </div>
  )
})
