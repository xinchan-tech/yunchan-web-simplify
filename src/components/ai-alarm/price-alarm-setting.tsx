import { addAlarm, getAlarmConditionsList, getStockBaseCodeInfo } from '@/api'
import { useToast, useZForm } from '@/hooks'
import { stockUtils } from '@/utils/stock'
import { cn } from "@/utils/style"
import { useQuery, useQueryClient } from '@tanstack/react-query'
import to from 'await-to-js'
import Decimal from 'decimal.js'
import { nanoid } from 'nanoid'
import { forwardRef, useEffect, useState } from 'react'
import { FormProvider, useFormContext } from 'react-hook-form'
import { z } from 'zod'
import { JknIcon } from '../jkn/jkn-icon'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { FormControl, FormField, FormItem, FormLabel } from '../ui/form'
import { Input } from '../ui/input'
import { ScrollArea } from "../ui/scroll-area"
import { Separator } from "../ui/separator"
import { AlarmStockPicker } from "./components/alarm-stock-picker"
import { DatePicker } from "./components/date-picker"
import { FrequencySelect } from "./components/frequency-select"
import { NameInput } from "./components/name-input"

const formSchema = z.object({
  symbol: z.string({ message: '股票代码错误' }).min(1, '股票代码错误'),
  rise: z.array(z.string()).optional(),
  fall: z.array(z.string()).optional(),
  frequency: z.string({ message: '周期错误' }),
  name: z.string().optional(),
  date: z.string().optional()
})

interface PriceAlarmSetting {
  code?: string
  onClose?: () => void
}

export const PriceAlarmSetting = (props: PriceAlarmSetting) => {
  const form = useZForm(formSchema, {
    symbol: props.code ?? '',
    rise: [],
    fall: [],
    name: '',
    frequency: '1',
    date: ''
  })

  const symbol = form.watch('symbol')

  const query = useQuery({
    queryKey: [getStockBaseCodeInfo.cacheKey, symbol, ['total_share']],
    queryFn: () => getStockBaseCodeInfo({ symbol: symbol, extend: ['total_share'] }),
    enabled: !!symbol
  })

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

    if(!query.data) return

    const stock = stockUtils.toStock(query.data.stock, {
      extend: query.data.extend,
      symbol: query.data.symbol,
      name: query.data.name
    })

    const rise: number[] = []
    const fall: number[] = []

    form.getValues('rise')?.map(v => {
      const price = Decimal.create(v)
      if (price.gt(stock.close)) {
        rise.push(price.toNumber())
      }else{
        fall.push(price.toNumber())
      }
    })
    const params = {
      symbol: form.getValues('symbol'),
      type: 2,
      condition: {
        rise: rise,
        fall: fall,
        frequency: +form.getValues('frequency')
      },
      expire_time: form.getValues('date'),
      name: form.getValues('name')
    }

    if (rise.length + fall.length === 0) {
      toast({ description: '股价设置条件必须要一个以上' })
      return
    }

    const [err] = await to(addAlarm(params))

    if (err) {
      toast({ description: err.message })
      return
    }

    toast({ description: '添加成功' })
    queryClient.refetchQueries({
      queryKey: [getAlarmConditionsList.cacheKey],
    })
  }

  return (
    <div className="w-full overflow-hidden flex flex-col h-full ">
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
                  <FormLabel className="w-32 !font-normal text-secondary text-base">价格警报</FormLabel>
                  <FormControl className="flex-1">
                    <PriceSetting value={field.value} onChange={field.onChange} />
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
                <FormLabel className="w-32 text-base font-normal">触发频率</FormLabel>
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
                    <FormLabel className="w-32 text-base font-normal">到期时间</FormLabel>
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
  // mode: 'rise' | 'fall'
}
const PriceSetting = forwardRef((props: PriceSettingProps, _) => {
  const form = useFormContext()
  const symbol = form.watch('symbol')
  const [list, setList] = useState<{ checked: boolean; value: string; id: string }[]>([
    { checked: false, value: '', id: nanoid(8) }
  ])
  const query = useQuery({
    queryKey: [getStockBaseCodeInfo.cacheKey, symbol, ['total_share']],
    queryFn: () => getStockBaseCodeInfo({ symbol: symbol, extend: ['total_share'] }),
    enabled: !!symbol
  })

  useEffect(() => {
    if (query.data) {
      const stock = stockUtils.toStock(query.data.stock, {
        extend: query.data.extend,
        symbol: query.data.symbol,
        name: query.data.name
      })
      const up = Decimal.create(stock.close ?? 0)
        .mul(1.05)
        .toFixed(2)

      const down = Decimal.create(stock.close ?? 0)
        .mul(0.95)
        .toFixed(2)
        
      setList([{ checked: false, value: up, id: nanoid(8) }, { checked: false, value: down, id: nanoid(8) }])
    }
  }, [query.data])

  const calcPercent = (price: string) => {
    if (!query.data || !price) {
      return '-'
    }
    const stock = stockUtils.toStock(query.data.stock, {
      extend: query.data.extend,
      symbol: query.data.symbol,
      name: query.data.name
    })

    const r = Decimal.create(price).minus(stock.close).div(stock.close).mul(100).toNumber()
    return <span className={cn(r > 0 ? 'text-stock-up' : 'text-stock-down')}>{`${r > 0 ? '+' : ''}${r.toFixed(2)}%`}</span>
  }

  const onValueChange = (id: string, value: string) => {
    setList(list.map(item => (item.id === id ? { ...item, value } : item)))
  }
  
  useEffect(() => {
    props.onChange?.(list.filter(item => item.value).map(item => item.value))
  }, [list, props.onChange])

  const addListItem = () => {
    setList([...list, { checked: false, value: '', id: nanoid(8) }])
  }

  const removeListItem = (id: string) => {
    setList(list.filter(item => item.id !== id))
  }

  return (
    <div className="flex flex-col space-y-2 text-sm flex-1">
      {list.map((item, index) => (
        <div key={item.id} className="flex flex-col">
          <div className="flex items-center">
            <div className="border border-solid border-input rounded w-full flex items-center">
              <Input
                type="number"
                className="w-64 border-none flex-1"
                value={item.value}
                onChange={e => onValueChange(item.id, e.target.value)}
              />
              <Separator className="h-4 w-[1px] bg-border mx-2" />
              <span className={cn(
                'min-w-16 text-center',
              )}>{calcPercent(item.value)}</span>
            </div>
            {index === 0 ? (
              <JknIcon.Svg name="plus-circle" className="w-6 h-6 ml-2 text-tertiary hover:text-foreground cursor-pointer" onClick={addListItem} />
            ) : (
              <JknIcon.Svg name="delete" className="w-6 h-6 ml-2 text-tertiary hover:text-foreground cursor-pointer" onClick={() => removeListItem(item.id)} />
            )}
          </div>
        </div>
      ))}
    </div>
  )
})

