import type { StockCategory } from '@/api'
import { JknIcon, ToggleGroup, ToggleGroupItem } from '@/components'
import { appEvent } from '@/utils/event'
import { cn } from '@/utils/style'
import { useMount, useUnmount } from 'ahooks'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { SuperStockContext } from '../ctx'

/**
 * 自定义多头策略图标组件
 */
export const BullArrow = () => {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
    <svg width="10" height="16" viewBox="0 0 10 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.35355 2.64645C5.15829 2.45118 4.84171 2.45118 4.64645 2.64645L1.46447 5.82843C1.2692 6.02369 1.2692 6.34027 1.46447 6.53553C1.65973 6.7308 1.97631 6.7308 2.17157 6.53553L5 3.70711L7.82843 6.53553C8.02369 6.7308 8.34027 6.7308 8.53553 6.53553C8.7308 6.34027 8.7308 6.02369 8.53553 5.82843L5.35355 2.64645ZM4.5 13C4.5 13.2761 4.72386 13.5 5 13.5C5.27614 13.5 5.5 13.2761 5.5 13L4.5 13ZM4.5 3L4.5 13L5.5 13L5.5 3L4.5 3Z" fill="#22AB94" />
    </svg>
  )
}

/**
 * 自定义空头策略图标组件
 */
export const BearArrow = () => {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
    <svg width="10" height="16" viewBox="0 0 10 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.64645 13.3536C4.84171 13.5488 5.15829 13.5488 5.35355 13.3536L8.53553 10.1716C8.7308 9.97631 8.7308 9.65973 8.53553 9.46447C8.34027 9.2692 8.02369 9.2692 7.82843 9.46447L5 12.2929L2.17157 9.46447C1.97631 9.2692 1.65973 9.2692 1.46447 9.46447C1.2692 9.65973 1.2692 9.97631 1.46447 10.1716L4.64645 13.3536ZM5.5 3C5.5 2.72386 5.27614 2.5 5 2.5C4.72386 2.5 4.5 2.72386 4.5 3L5.5 3ZM5.5 13L5.5 3L4.5 3L4.5 13L5.5 13Z" fill="#F23645" />
    </svg>
  )
}

const MethodStep = () => {
  const ctx = useContext(SuperStockContext)
  const [method, setMethod] = useState<StockCategory>()
  const data = ctx.data?.technology?.children?.method.children as unknown as StockCategory[]
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
    const t = children.find(item => item.name === '空头策略') as any
    if (t.id === type) {

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
    ctx.register(
      'category_ids',
      3,
      () => [...selection.current],
      v => {
        if (selection.current.length === 0) {
          return v.category_ids_ext?.getData().length > 0
        }
        return selection.current.length > 0
      }
    )
  })

  useUnmount(() => {
    ctx.unregister('category_ids')
    selection.current = []
    lastType.current = undefined
    setValue([])
  })

  // 待优化 临时方案
  const isBear = useCallback((id: string) => {
    const t = children.find(item => item.name === '空头策略') as any
    return t?.children?.some((c: any) => c.id === id)
  }, [children])

  useEffect(() => {
    appEvent.on('cleanPickerStockMethod', () => {
      // magic number
      if (selection.current?.some(v => isBear(v))) {
        setValue([])
        selection.current = []
        lastType.current = undefined
      }
    })

    return () => {
      appEvent.off('cleanPickerStockMethod')
    }
  }, [isBear])

  return (
    <div className="mt-8 w-full">
      <div className="w-full pb-5 text-[18px] text-[#B8B8B8] font-[500]">
        选股方式
      </div>
      <div className="w-full pt-5 pb-8 flex flex-col border-x-0 border-y border-solid border-[#2E2E2E]">
        {children.map(item => (
          <div className='flex flex-row mt-5' key={item.id}>
            <div className='w-[132px] text-base font-[500] flex-shrink-0 flex-grow-0'
              style={{
                color: item.name === '多头策略' ? '#22AB94' : '#D61B5F'
              }}
            >
              <div className='flex flex-row'>
                <span>{item.name}</span>
                <span className='mt-1'>{item.name === '多头策略' ? <BullArrow /> : <BearArrow />}</span>
              </div>
            </div>
            <ToggleGroup
              className="flex-grow grid grid-cols-6 gap-[10px]"
              type="multiple"
              hoverColor='#2E2E2E'
              value={value}
              onValueChange={v => _onValueChange(v, item.id)}
            >
              {(item.children as unknown as StockCategory[])?.map(child =>
                child.name !== '' ? (
                  <ToggleGroupItem
                    disabled={!child.authorized}
                    key={child.id}
                    value={child.id}
                    data-item-name={item.name}
                    className={cn(
                      "w-full py-5 px-[14px] rounded-sm border border-[#2E2E2E] bg-transparent relative",
                      "data-[state=on]:bg-transparent",
                      "data-[state=on]:text-[#22AB94] data-[state=on]:border-[#22AB94]",
                      "data-[state=on]:[&:not([data-item-name='多头策略'])]:text-[#D61B5F]",
                      "data-[state=on]:[&:not([data-item-name='多头策略'])]:border-[#D61B5F]"
                    )}
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
  )
}

export default MethodStep
