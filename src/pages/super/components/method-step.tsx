import { type CSSProperties, useContext, useEffect, useRef, useState } from "react"
import { SuperStockContext } from "../ctx"
import type { StockCategory } from "@/api"
import { cn } from "@/utils/style"
import { JknIcon, ToggleGroup, ToggleGroupItem } from "@/components"
import { useMount, useUnmount } from "ahooks"
import { appEvent } from "@/utils/event"

const MethodStep = () => {
  const ctx = useContext(SuperStockContext)
  const [method, setMethod] = useState<StockCategory>()
  const data = (ctx.data?.technology?.children?.method.children) as unknown as StockCategory[]
  const [value, setValue] = useState<string[]>([])
  const selection = useRef<string[]>([])
  const lastType = useRef<string>()
  useEffect(() => {
    if (data && data.length > 0) {
      setMethod(data[0])
    }
  }, [data])


  const children = (method?.children ?? []) as unknown as StockCategory[]

  const _onValueChange = (e: string[], type: string) => {
    if(type === '32'){
      appEvent.emit('cleanPickerStockFactor')
    }
    
    if (e.length <= 0) {
      setValue([])
      selection.current = []
      return
    }

    if (!lastType.current || lastType.current === type) {
      setValue(e)
      selection.current = e
      lastType.current = type
      return
    }

    const lastData = e[e.length - 1]

    setValue([lastData])
    selection.current = [lastData]
    lastType.current = type

  }

  useMount(() => {
    ctx.register('category_ids', 3, () => [...selection.current], (v) => {
      if(selection.current.length === 0){
        return v.category_ids_ext?.getData().length > 0
      }
      return selection.current.length > 0
    })
  })

  useUnmount(() => {
    ctx.unregister('category_ids')
    selection.current = []
    lastType.current = undefined
    setValue([])
  })

  // 待优化 临时方案
  useMount(() => {
    appEvent.on('cleanPickerStockMethod', () => {
      // magic number
      if(lastType.current === '32'){
        setValue([])
        selection.current = []
        lastType.current = undefined
      }
    })
  })

  useUnmount(() => {
    appEvent.off('cleanPickerStockMethod')
    
  })

  return (
    <div className="min-h-64 flex  border-0 border-b border-solid border-background items-stretch">
      <div className="w-36 px-4 flex items-center flex-shrink-0 border border-t-0 border-solid border-background">
        第三步：选股方式
      </div>
      <div className="flex-1 flex flex-col">
        <div className="py-3 ml-3">
          {
            data?.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'h-10 leading-10 w-40 mb-2 text-center rounded-sm text-secondary transition-all cursor-pointer bg-accent relative',
                  method?.id === item.id && 'bg-primary text-foreground'
                )}
                onClick={() => setMethod(item)}
                onKeyDown={() => { }}
              >
                {item.name}
                {
                  value.length > 0 ? (
                    <span className="absolute -right-2 -top-2 w-4 h-4 leading-4 rounded-full text-xs text-white bg-[#ff4757]">
                      {
                        value.length
                      }
                    </span>
                  ) : null
                }
              </div>
            ))
          }
        </div>
        <div className="py-3 border-0 border-t border-solid border-background">
          {
            children.map((item) => (
              <div key={item.id} className="flex mb-4">
                <div
                  className="flex-shrink-0 px-4 flex items-center text-sm"
                  style={{ color: item.name === '多头策略' ? 'hsl(var(--stock-up-color))' : 'hsl(var(--stock-down-color))' }}
                >
                  <JknIcon name={item.name === '多头策略' ? 'ic_price_up_green' : 'ic_price_down_red'} />
                  {item.name}
                </div>
                <ToggleGroup value={value} onValueChange={v => _onValueChange(v, item.id)} style={{
                  '--toggle-active-bg': item.name === '多头策略' ? 'hsl(var(--stock-up-color))' : 'hsl(var(--stock-down-color))',
                } as CSSProperties} type="multiple" className="flex-1 flex">
                  {(item.children as unknown as StockCategory[])?.map((child) => (
                    child.name !== '' ? (
                      <ToggleGroupItem disabled={!child.authorized} className="w-36 relative" key={child.id} value={child.id}>
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
    </div>
  )
}

export default MethodStep