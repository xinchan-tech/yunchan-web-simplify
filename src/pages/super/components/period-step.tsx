import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components"
import { useContext, useRef } from "react"
import { SuperStockContext } from "../ctx"
import { useMount, useUnmount } from "ahooks"

type PeriodStepItemType = {
  conditions: {
    key: string
    name: string
    items: {
      value: string
      name: string
    }[]
  }[]
}
const PeriodStep = () => {
  const ctx = useContext(SuperStockContext)
  const data = ((ctx.data?.basic?.children?.period.from_datas) ?? {}) as unknown as PeriodStepItemType

  const form = useRef<Record<string, string>>({})

  useMount(() => {
    ctx.register(
      'quantity_price',
      8,
      () => ({ ...form.current }),
      () => Object.keys(form.current).length > 0
    )
  })

  useUnmount(() => {
    ctx.unregister('quantity_price')
    form.current = {}
  })

  const onValueChange = (field: string, value: string) => {
    if(value === 'none'){
      delete form.current[field]
    }else{
      form.current[field] = value
    }
  }

  
  return (
    <div className="min-h-24 flex border-0 border-b border-solid border-background items-stretch">
      <div className="w-36 px-4 flex items-center flex-shrink-0  border-t-0 border border-solid border-background">
        第五步：量价指标
      </div>
      <div className="space-y-4 p-4">
        {
          data.conditions?.map(item => (
            <div key={item.key} className="flex items-center text-sm">
              <span className="w-12">
                {item.name}
              </span>
              <Select onValueChange={v => onValueChange(item.key, v)}>
                <SelectTrigger className="w-[280px] ml-8">
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={'none'}>
                    请选择
                  </SelectItem>
                  {
                    item.items.map(subItem => (
                      <SelectItem key={subItem.name} value={subItem.value}>
                        {subItem.name}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default PeriodStep