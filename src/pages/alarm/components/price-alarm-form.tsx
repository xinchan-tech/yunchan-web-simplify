import { addAlarm, AlarmType, getStockBaseCodeInfo } from "@/api"
import { Button, CapsuleTabs, Checkbox, FormControl, FormField, FormItem, FormLabel, Input, JknIcon, ToggleGroup, ToggleGroupItem } from "@/components"
import { useToast, useZForm } from "@/hooks"
import { useQuery } from "@tanstack/react-query"
import to from "await-to-js"
import { forwardRef, useEffect, useState } from "react"
import { FormProvider, useFormContext } from "react-hook-form"
import { z } from "zod"
import AlarmList from "./alarm-list"
import StockSelectInput from "./stock-select-input"
import { StockRecord } from "@/store"
import Decimal from "decimal.js"
import { nanoid } from "nanoid"
import AlarmLog from "./alarm-log"
const formSchema = z.object({
  symbol: z.string({ message: '股票代码错误' }).min(1, '股票代码错误'),
  rise: z.array(z.string()).optional(),
  fall: z.array(z.string()).optional(),
  frequency: z.string({ message: '周期错误' }),
})
const PriceAlarmForm = () => {
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
          1: <PriceAlarmSetting />,
          2: <AlarmList type={AlarmType.PRICE} />,
          3: <AlarmLog type={AlarmType.PRICE} />
        }[active] ?? null}
      </div>
    </div>
  )
}

const PriceAlarmSetting = () => {
  const form = useZForm(formSchema, {
    symbol: '',
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
    console.log(params)
    if((params.condition.rise.length + params.condition.fall.length) === 0){
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
        <form className="space-y-4 px-8 mt-4">
          <FormField control={form.control} name="symbol"
            render={({ field }) => (
              <FormItem className="pb-4 border-0 border-b border-solid border-dialog-border">
                <FormLabel>一、选择股票</FormLabel>
                <FormControl>
                  <StockSelectInput {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField control={form.control} name="rise"
            render={({ field }) => (
              <FormItem>
                <FormLabel>二、股价设置</FormLabel>
                <FormControl>
                  <PriceSetting mode="rise" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField control={form.control} name="fall"
            render={({ field }) => (
              <FormItem className="!mt-4 pb-4 border-0 border-b border-solid border-dialog-border">
                <FormControl>
                  <PriceSetting mode="fall" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField control={form.control} name="frequency"
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
        <Button className="w-24" onClick={onSubmit}>确定</Button>
        <div className="text-xs text-tertiary mt-2">报警设置说明：选择股票后输入股票价涨跌值，设置提醒频率即可添加报警</div>
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
  const [list, setList] = useState<{ checked: boolean, value: string, id: string }[]>([{ checked: false, value: '', id: nanoid(8) }])
  const query = useQuery({
    queryKey: [getStockBaseCodeInfo.cacheKey, symbol],
    queryFn: () => getStockBaseCodeInfo({ symbol: symbol, extend: ['total_share'] }),
    enabled: !!symbol
  })

  useEffect(() => {
    if (query.data) {
      const stock = new StockRecord(query.data.stock, query.data.extend)
      const r = new Decimal(stock.close).mul(props.mode === 'rise' ? 1.05 : 0.95).toFixed(2)
      console.log(r)
      setList([{ checked: false, value: r, id: nanoid(8) }])
    }
  }, [query.data, props.mode])

  const calcPercent = (price: string) => {
    if (!query.data || !price) {
      return '-'
    }
    const stock = new StockRecord(query.data.stock, query.data.extend)
    return `${props.mode === 'rise' ? '+' : ''}${new Decimal(price).minus(stock.close).div(stock.close).mul(100).toFixed(2)}%`
  }

  const onValueChange = (id: string, value: string) => {
    setList(list.map(item => item.id === id ? { ...item, value } : item))
  }

  const onCheckChange = (id: string, checked: boolean | string) => {
    setList(list.map(item => item.id === id ? { ...item, checked: checked === true } : item))
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
      {
        list.map((item, index) => (
          <div key={item.id} className="flex items-center space-x-2">
            <Checkbox
              checked={item.checked}
              onCheckedChange={(checked) => onCheckChange(item.id, checked)}
            />
            {
              props.mode === 'rise' ? (
                <>
                  <span>股价涨到</span>
                  <JknIcon name="ic_price_up_green" className="w-4 h-4" />
                  <Input type="number" className="w-32 border-border text-stock-up" size="sm" value={item.value} onChange={(e) => onValueChange(item.id, e.target.value)} />
                  <span className="text-stock-up w-24">{calcPercent(item.value)}</span>
                </>
              ) : (
                <>
                  <span>股价跌到</span>
                  <JknIcon name="ic_price_down_red" className="w-4 h-4" />
                  <Input type="number" className="w-32 border-border text-stock-down" size="sm" value={item.value} onChange={(e) => onValueChange(item.id, e.target.value)} />
                  <span className="text-stock-down w-24">{calcPercent(item.value)}</span>
                </>
              )
            }

            {
              index === 0 ? (
                <JknIcon name="add" className="w-4 h-4" onClick={addListItem} />
              ) : (
                <JknIcon name="ic_del_bg" className="w-4 h-4" onClick={() => removeListItem(item.id)} />
              )
            }
          </div>
        ))
      }
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
      <ToggleGroupItem className="w-32 " value='0'>
        仅提醒一次
      </ToggleGroupItem>
      <ToggleGroupItem className="w-32" value='1'>
        持续提醒
      </ToggleGroupItem>
    </ToggleGroup>
  )
})


export default PriceAlarmForm