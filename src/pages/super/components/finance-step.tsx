import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ToggleGroup,
  ToggleGroupItem
} from '@/components'
import { useMount, useUnmount } from 'ahooks'
import { type CSSProperties, useContext, useRef } from 'react'
import { SuperStockContext } from '../ctx'

type DataType = {
  conditions: {
    key: string
    name: string
    items: {
      start: string
      end: string
      name: string
    }[]
  }[]
  fiscal_period: {
    key: string
    name: string
    items: {
      value: string
      name: string
    }[]
  }
}
const FinanceStep = () => {
  const ctx = useContext(SuperStockContext)
  const data = (ctx.data?.basic?.children?.finance.from_datas as unknown as Partial<DataType>) ?? {}

  const form = useRef<Record<string, string | string[]>>({})

  useMount(() => {
    ctx.register(
      'finance',
      7,
      () => ({ ...form.current }),
      () => Object.keys(form.current).length > 0
    )
  })

  useUnmount(() => {
    ctx.unregister('finance')
    form.current = {}
  })

  const onValueChange = (field: string, value: string) => {
    if (field === 'fiscal_period') {
      if (value) {
        form.current[field] = value
      } else {
        delete form.current[field]
      }
    } else {
      if (value === 'none') {
        delete form.current[field]
      } else {
        const v = data.conditions?.find(item => item.key === field)?.items.find(item => item.name === value)

        if (v) {
          form.current[field] = [v.start, v.end]
        }
      }
    }
  }

  return (
    <div className="min-h-24 flex border-0 border-b border-solid border-background items-stretch">
      <div className="w-36 px-4 flex items-center flex-shrink-0  border-t-0 border border-solid border-background">
        第三步：核心财务
      </div>
      <div className="p-4 w-full">
        <ToggleGroup
          onValueChange={v => onValueChange('fiscal_period', v)}
          type="single"
          style={{ '--toggle-active-bg': 'hsl(var(--stock-up-color))' } as CSSProperties}
        >
          {data.fiscal_period?.items.map(item => (
            <ToggleGroupItem className="w-16" key={item.name} value={item.value}>
              {item.name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="grid grid-cols-2 gap-4 w-full mt-8">
          {data.conditions?.map(item => (
            <div key={item.key} className="flex items-center text-sm">
              <span className="w-24">{item.name}</span>
              <Select onValueChange={v => onValueChange(item.key, v)}>
                <SelectTrigger className="w-[240px] ml-8">
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={'none'}>请选择</SelectItem>
                  {item.items.map(subItem => (
                    <SelectItem key={subItem.name} value={subItem.name}>
                      {subItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FinanceStep
