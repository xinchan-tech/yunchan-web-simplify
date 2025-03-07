import { addAlarm, getStockBaseCodeInfo } from '@/api'
import { useStockSearch, useToast, useZForm } from '@/hooks'
import { stockUtils } from '@/utils/stock'
import { useQuery } from '@tanstack/react-query'
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
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'
import { useStockList } from "@/store"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { JknVirtualList } from "../jkn/jkn-virtual-list"

const formSchema = z.object({
  symbol: z.string({ message: '股票代码错误' }).min(1, '股票代码错误'),
  rise: z.array(z.string()).optional(),
  fall: z.array(z.string()).optional(),
  frequency: z.string({ message: '周期错误' })
})

interface PriceAlarmSetting {
  code?: string
}

export const PriceAlarmSetting = (props: PriceAlarmSetting) => {
  const form = useZForm(formSchema, {
    symbol: props.code ?? '',
    rise: [],
    fall: [],
    frequency: '1'
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
      type: 2,
      condition: {
        rise: form.getValues('rise')?.map(v => +v) ?? [],
        fall: form.getValues('fall')?.map(v => +v) ?? [],
        frequency: +form.getValues('frequency')
      }
    }

    if (params.condition.rise.length + params.condition.fall.length === 0) {
      toast({ description: '股价设置条件必须要一个以上' })
      return
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
        <form className="px-8 mt-4">
          <FormField
            control={form.control}
            name="symbol"
            render={({ field }) => (
              <FormItem className="pb-4 flex items-center border-0 border-b border-solid border-dialog-border space-y-0">
                <FormLabel className="w-32">股票名称</FormLabel>
                <FormControl>
                  <StockSelect {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rise"
            render={({ field }) => (
              <FormItem>
                <FormLabel>二、股价设置</FormLabel>
                <FormControl>
                  <PriceSetting mode="rise" value={field.value} onChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fall"
            render={({ field }) => (
              <FormItem className="!mt-4 pb-4 border-0 border-b border-solid border-dialog-border">
                <FormControl>
                  <PriceSetting mode="fall" value={field.value} onChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>三、提醒频率</FormLabel>
                <FormControl>
                  <FrequencySelect {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </form>
      </FormProvider>
      <div className="text-center mt-8">
        <Button className="w-24" onClick={onSubmit}>
          确定
        </Button>
        <div className="text-xs text-tertiary mt-2">
          报警设置说明：选择股票后输入股票价涨跌值，设置提醒频率即可添加报警
        </div>
      </div>
    </div>
  )
}

interface StockSelectProps {
  value?: string
  onChange?: (value: string) => void
}

const StockSelect = ({ value, onChange }: StockSelectProps) => {
  const stockMap = useStockList(s => s.listMap)
  const [search, setSearch] = useState('A')
  const [result] = useStockSearch(search)
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center border border-input border-solid rounded-md px-5 py-2.5 flex-1">
          {
            value ? (
              <>
                <JknIcon.Stock symbol={value} className="w-6 h-6 mr-2" />
                <span>{value}</span>
                <span className="ml-2 text-tertiary text-xs">{stockMap[value]?.[2]}</span>
              </>
            ) : <span className="text-tertiary text-xs">--</span>
          }
          <JknIcon.Svg name="arrow-down" className="ml-auto text-tertiary" size={10} />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[458px]">
        <div>
          <div className="flex items-center border-b-primary px-4">
            <JknIcon.Svg name="search" className="w-6 h-6 text-tertiary" />
            <Input
              className="w-full placeholder:text-tertiary text-secondary border-none"
              placeholder="请输入股票代码"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div>
            <JknVirtualList
              className="h-[400px]"
              rowKey="1"
              data={result}
              itemHeight={50}
              renderItem={([_icon, symbol, name]) => (
                <div
                  key={symbol}
                  className="flex items-center px-2 cursor-pointer hover:bg-accent py-4"
                  onClick={() => {
                    onChange?.(symbol)
                  }}
                  onKeyDown={() => { }}
                >
                  <JknIcon.Stock symbol={symbol} className="w-6 h-6 mr-2" />
                  <span>{symbol}</span>
                  <span className="ml-2 text-tertiary text-xs">{name}</span>
                </div>
              )}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
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
      const r = Decimal.create(stock.close ?? 0)
        .mul(props.mode === 'rise' ? 1.05 : 0.95)
        .toFixed(2)
      setList([{ checked: false, value: r, id: nanoid(8) }])
    }
  }, [query.data, props.mode])

  const calcPercent = (price: string) => {
    if (!query.data || !price) {
      return '-'
    }
    const stock = stockUtils.toStock(query.data.stock, {
      extend: query.data.extend,
      symbol: query.data.symbol,
      name: query.data.name
    })
    return `${props.mode === 'rise' ? '+' : ''}${new Decimal(price).minus(stock.close).div(stock.close).mul(100).toFixed(2)}%`
  }

  const onValueChange = (id: string, value: string) => {
    setList(list.map(item => (item.id === id ? { ...item, value } : item)))
  }

  const onCheckChange = (id: string, checked: boolean | string) => {
    setList(list.map(item => (item.id === id ? { ...item, checked: checked === true } : item)))
  }

  useEffect(() => {
    props.onChange?.(list.filter(item => item.checked && item.value).map(item => item.value))
  }, [list, props.onChange])

  const addListItem = () => {
    setList([...list, { checked: false, value: '', id: nanoid(8) }])
  }

  const removeListItem = (id: string) => {
    setList(list.filter(item => item.id !== id))
  }

  return (
    <div className="flex flex-col space-y-2 text-sm">
      {list.map((item, index) => (
        <div key={item.id} className="flex items-center space-x-2">
          <Checkbox checked={item.checked} onCheckedChange={checked => onCheckChange(item.id, checked)} />
          {props.mode === 'rise' ? (
            <>
              <span>股价涨到</span>
              <JknIcon name="ic_price_up_green" className="w-4 h-4" />
              <Input
                type="number"
                className="w-32 border-border text-stock-up"
                size="sm"
                value={item.value}
                onChange={e => onValueChange(item.id, e.target.value)}
              />
              <span className="text-stock-up w-24">{calcPercent(item.value)}</span>
            </>
          ) : (
            <>
              <span>股价跌到</span>
              <JknIcon name="ic_price_down_red" className="w-4 h-4" />
              <Input
                type="number"
                className="w-32 border-border text-stock-down"
                size="sm"
                value={item.value}
                onChange={e => onValueChange(item.id, e.target.value)}
              />
              <span className="text-stock-down w-24">{calcPercent(item.value)}</span>
            </>
          )}

          {index === 0 ? (
            <JknIcon name="add" className="w-4 h-4" onClick={addListItem} />
          ) : (
            <JknIcon name="ic_del_bg" className="w-4 h-4" onClick={() => removeListItem(item.id)} />
          )}
        </div>
      ))}
    </div>
  )
})

interface FrequencySelectProps {
  value?: string
  onChange?: (value: string) => void
}
const FrequencySelect = forwardRef((props: FrequencySelectProps, _) => {
  return (
    <ToggleGroup value={props.value} type="single" onValueChange={props.onChange}>
      <ToggleGroupItem className="w-32 " value="0">
        仅提醒一次
      </ToggleGroupItem>
      <ToggleGroupItem className="w-32" value="1">
        持续提醒
      </ToggleGroupItem>
    </ToggleGroup>
  )
})
