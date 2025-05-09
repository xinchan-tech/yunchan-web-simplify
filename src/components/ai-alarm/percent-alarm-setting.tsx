import { addAlarm, getAlarmConditionsList, getStockBaseCodeInfo } from '@/api'
import { useToast, useZForm } from '@/hooks'
import { stockUtils } from '@/utils/stock'
import { cn } from '@/utils/style'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import to from 'await-to-js'
import Decimal from 'decimal.js'
import { nanoid } from 'nanoid'
import { forwardRef, useEffect, useState } from 'react'
import { FormProvider, useFormContext } from 'react-hook-form'
import { z } from 'zod'
import { JknIcon } from '../tc/jkn-icon'
import { Button } from '../ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { FormControl, FormField, FormItem, FormLabel } from '../ui/form'
import { Input } from '../ui/input'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'
import { AlarmStockPicker } from './components/alarm-stock-picker'
import { DatePicker } from './components/date-picker'
import { NameInput } from './components/name-input'
import { JknAlert } from "../tc/jkn-alert"

const formSchema = z.object({
  symbol: z.string({ message: '股票代码错误' }).min(1, '股票代码错误'),
  rise: z.array(z.string()).optional(),
  fall: z.array(z.string()).optional(),
  frequency: z.string({ message: '周期错误' }),
  name: z.string().optional(),
  date: z.string().optional()
})

interface PercentageAlarmSettingProps {
  code?: string
  onClose?: () => void
}

export const PercentageAlarmSetting = (props: PercentageAlarmSettingProps) => {
  const form = useZForm(formSchema, {
    symbol: props.code ?? '',
    rise: [],
    fall: [],
    name: '',
    frequency: '0',
    date: ''
  })

  const symbol = form.watch('symbol')

  const query = useQuery({
    queryKey: [getStockBaseCodeInfo.cacheKey, symbol, ['total_share']],
    queryFn: () => getStockBaseCodeInfo({ symbol: symbol, extend: ['total_share'] }),
    enabled: !!symbol
  })

  // const { toast } = useToast()

  const queryClient = useQueryClient()

  const onSubmit = async () => {
    const valid = await form.trigger()

    if (!valid) {
      for (const err of Object.keys(form.formState.errors) as unknown as (keyof typeof form.formState.errors)[]) {
        JknAlert.error(form.formState.errors[err]?.message ?? '')
        return
      }
    }

    if (!query.data) return

    const stock = stockUtils.toStock(query.data.stock, {
      extend: query.data.extend,
      symbol: query.data.symbol,
      name: query.data.name
    })

    const floatParams: { price: number; type: number; change_value: number }[] = []
    const base = stock.close

    form.getValues('rise')?.forEach(v => {
      if (!v) return
      let price: Decimal
      let type = 2
      if (v.endsWith('%')) {
        price = Decimal.create(v.replace('%', '')).div(-100)
        type = 1
      } else {
        price = Decimal.create(v).mul(-1)
      }

      floatParams.push({
        price: base,
        type,
        change_value: price.toNumber()
      })
    })

    form.getValues('fall')?.forEach(v => {
      if (!v) return
      let price: Decimal
      let type = 2
      if (v.endsWith('%')) {
        price = Decimal.create(v.replace('%', '')).div(100)
        type = 1
      } else {
        price = Decimal.create(v)
      }

      floatParams.push({
        price: base,
        type,
        change_value: price.toNumber()
      })
    })

    const params = {
      symbol: form.getValues('symbol'),
      type: 4,
      expire_time: form.getValues('date'),
      name: form.getValues('name'),
      condition: {
        float_params: floatParams
      }
    }

    if (floatParams.length === 0) {
      JknAlert.error('浮动警报设置条件必须要一个以上')
      return
    }

    const [err] = await to(addAlarm(params))

    if (err) {
      JknAlert.error(err.message)
      return
    }

    JknAlert.success('添加成功')
    queryClient.refetchQueries({
      queryKey: [getAlarmConditionsList.cacheKey]
    })
    form.setValue('fall', null as any)
    form.setValue('rise', null as any)
  }

  return (
    <div className="w-full overflow-hidden flex flex-col h-full">
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

          <div className="text-base">条件</div>
          <Separator className="my-2 h-[1px] w-full" />
          <ScrollArea className="h-[280px]">
            <FormField
              control={form.control}
              name="rise"
              render={({ field }) => (
                <FormItem className="pb-4 flex space-y-0">
                  <FormLabel className="w-32 text-secondary text-base font-normal pt-2">
                    <span className="text-stock-up">
                      上涨追踪
                      <JknIcon.Svg name="stock-up" size={12} />
                    </span>
                  </FormLabel>
                  <FormControl className="flex-1">
                    <PriceSetting mode="fall" value={field.value} onChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fall"
              render={({ field }) => (
                <FormItem className="pb-4 flex space-y-0">
                  <FormLabel className="w-32 text-secondary text-base font-normal pt-2">
                    <span className="text-stock-down">
                      下跌追踪
                      <JknIcon.Svg name="stock-down" size={12} />
                    </span>
                  </FormLabel>
                  <FormControl className="flex-1">
                    <PriceSetting mode="rise" value={field.value} onChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </ScrollArea>

          <Separator className="my-2 h-[1px] w-full" />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="pb-4 flex space-y-0  items-center">
                <FormLabel className="w-32 text-base font-normal">警报名称</FormLabel>
                <FormControl>
                  <NameInput {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          {/* 
          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem className="pb-4 flex space-y-0 items-center">
                <FormLabel className="w-32 text-base font-normal">触发频率</FormLabel>
                <FormControl >
                  <FrequencySelect {...field} />
                </FormControl>
              </FormItem>
            )}
          /> */}

          {/* {
            form.getValues('frequency') === '1' ? (
            
            ) : null
          } */}
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
        </form>
      </FormProvider>
      <div className="text-right space-x-2 px-8 mb-6 mt-auto">
        <Button className="w-24" variant="outline" onClick={() => props.onClose?.()}>
          取消
        </Button>
        <Button className="w-24" onClick={onSubmit}>
          创建
        </Button>
      </div>
    </div>
  )
}

interface PriceSettingProps {
  value?: string[]
  onChange?: (value: string[]) => void
  mode: 'rise' | 'fall'
}
const PriceSetting = forwardRef((props: PriceSettingProps, _) => {
  const form = useFormContext()
  const symbol = form.watch('symbol')
  const [list, setList] = useState<{ value: string; id: string; type: 'price' | 'percent', checked: boolean }[]>([
    { value: '', id: nanoid(8), type: 'percent', checked: false }
  ])
  const query = useQuery({
    queryKey: [getStockBaseCodeInfo.cacheKey, symbol, ['total_share']],
    queryFn: () => getStockBaseCodeInfo({ symbol: symbol, extend: ['total_share'] }),
    enabled: !!symbol,
    select: data =>
      data
        ? stockUtils.toStock(data.stock, {
          extend: data.extend,
          symbol: data.symbol,
          name: data.name
        })
        : null
  })
  console.log(list)
  useEffect(() => {
    console.log(props.value)
    if (!props.value) {
      setList([{ value: '', id: nanoid(8), type: 'percent', checked: false }])
    }
  }, [props.value])

  useEffect(() => {
    if (query.data) {
      const v = '5'

      setList([{ value: v, id: nanoid(8), type: 'percent', checked: false }])
    }
  }, [query.data])

  const onValueChange = (id: string, value: string) => {
    if (value === '-' || Number.parseFloat(value) < 0) {
      setList(list.map(item => (item.id === id ? { ...item, value: '', checked: false } : item)))
      return
    }
    setList(list.map(item => (item.id === id ? { ...item, value, checked: value === '' ? item.checked : true } : item)))
  }

  const onCheckedValue = (id: string) => {
    setList(list.map(item => (item.id === id ? { ...item, checked: !item.checked } : item)))
  }

  const onChangeType = (id: string, type: 'price' | 'percent') => {
    setList(list.map(item => (item.id === id ? { ...item, type } : item)))
  }

  useEffect(() => {
    props.onChange?.(
      list.filter(item => item.checked).map(item => (item.type === 'percent' ? item.value ? `${item.value}%` : '' : item.value))
    )
  }, [list, props.onChange])

  const addListItem = () => {
    setList([...list, { value: '', id: nanoid(8), type: 'percent', checked: false }])
  }

  const removeListItem = (id: string) => {
    setList(list.filter(item => item.id !== id))
  }

  const calcPrice = (price: string, type: 'price' | 'percent') => {
    if (type === 'percent') {
      const v = Decimal.create(query.data?.close ?? 0)
        .mul(1 + (props.mode === 'rise' ? 1 : -1) * (+price / 100))
        .toNumber()

      return <span className={cn(props.mode === 'rise' ? 'text-stock-up' : 'text-stock-down')}>{v.toFixed(2)}</span>
    }

    const v = Decimal.create(query.data?.close ?? 0)
      .plus((props.mode === 'rise' ? 1 : -1) * +price)
      .toNumber()

    return <span className={cn(props.mode === 'rise' ? 'text-stock-up' : 'text-stock-down')}>{v.toFixed(2)}</span>
  }

  return (
    <div className="flex flex-col space-y-2 text-sm flex-1">
      {list.map((item, index) => (
        <div key={item.id} className="flex flex-col">
          <div className={cn('text-tertiary flex items-center space-x-2 my-2')}>
            <JknIcon.Checkbox checked={item.checked} onClick={() => onCheckedValue(item.id)} className="rounded-none" />
            <div className="!ml-auto flex items-center rounded-sm  text-xs px-1 py-0.5 hover:bg-accent cursor-pointer text-secondary !mr-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <span>{item.type === 'price' ? '价格差额' : '涨跌比例'}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    data-checked={item.type === 'percent'}
                    onClick={() => onChangeType(item.id, 'percent')}
                  >
                    <span>按涨跌比例</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem data-checked={item.type === 'price'} onClick={() => onChangeType(item.id, 'price')}>
                    <span>按价格差额</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <JknIcon.Svg name="arrow-down" className="size-3" />
            </div>
          </div>
          <div className="flex items-center overflow-hidden w-full">
            <div className="border border-solid border-input rounded flex items-center pr-2 box-border">
              <span className="text-center text-tertiary pl-2">
                {props.mode === 'fall' ? (
                  item.type === 'price' ? (
                    <span>按回撤价格</span>
                  ) : (
                    <span>按回撤比例</span>
                  )
                ) : item.type === 'price' ? (
                  <span>按反弹价格</span>
                ) : (
                  <span>按反弹比例</span>
                )}
              </span>
              <Separator className="h-4 w-[1px] bg-border ml-2" />
              <Input
                type="number"
                min={0}
                className={cn('border-none flex-1', props.mode === 'rise' ? 'text-stock-up' : 'text-stock-down')}
                value={item.value}
                onChange={e => onValueChange(item.id, e.target.value)}
              />
              <span className="text-tertiary">{item.type === 'percent' ? '%' : ''}</span>
              <Separator className="h-4 w-[1px] bg-border mx-2" />
              <span className="text-tertiary min-w-16 text-center">
                {props.mode === 'fall' ? '最低触发价' : '最高触发价'}
                &nbsp;
                {calcPrice(item.value, item.type)}
              </span>
            </div>

            {index === 0 ? (
              <JknIcon.Svg
                name="plus-circle"
                className="w-6 h-6 ml-2 text-tertiary hover:text-foreground cursor-pointer flex-shrink-0"
                onClick={addListItem}
              />
            ) : (
              <JknIcon.Svg
                name="delete"
                className="w-6 h-6 ml-2 text-tertiary hover:text-foreground cursor-pointer flex-shrink-0"
                onClick={() => removeListItem(item.id)}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  )
})
