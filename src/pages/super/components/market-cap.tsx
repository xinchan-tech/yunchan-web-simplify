import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components"
import { useContext, useRef } from "react"
import { SuperStockContext } from "../ctx"
import { useMount, useUnmount } from "ahooks"

type MarketCapItemType = {
  key: string
  name: string
  items: {
    start: string
    end: string
    name: string
    value?: string
  }[]
}
const MarketCap = () => {
  const ctx = useContext(SuperStockContext)
  const data = ((ctx.data?.basic?.children?.valuation.from_datas) ?? []) as unknown as MarketCapItemType[]
  const form = useRef<Record<string, string | string[]>>({})

  const onValueChange = (field: string, value: string) => {
    if (value === 'none') {
      delete form.current[field]
      return
    }

    if (['pb', 'pe', 'price', 'total_mv'].includes(field)) {
      const v = data.find(item => item.key === field)?.items.find(item => item.name === value)
      if(v){
        form.current[field] = [v.start, v.end]
      }

    } else {
      form.current[field] = value
    }


  }

  useMount(() => {
    ctx.register(
      'valuation',
      5,
      () => ({ ...form.current }),
      () => Object.keys(form.current).length > 0
    )
  })

  useUnmount(() => {
    ctx.unregister('valuation')
    form.current = {}
  })

  return (
    <div className="min-h-24 flex border-0 border-b border-solid border-background items-stretch">
      <div className="w-36 px-4 flex items-center flex-shrink-0  border-t-0 border border-solid border-background">
        第二步：估值指标
      </div>
      <div className="space-y-4 p-4">
        {
          data.map(item => (
            <div key={item.key} className="flex items-center text-sm">
              <span className="w-16">
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
                      <SelectItem
                        key={subItem.name}
                        value={
                          subItem.value ? subItem.value : subItem.name
                        }>
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

export default MarketCap