import { useStockSearch } from '@/hooks'
import { useStockList } from '@/store'
import { cn } from '@/utils/style'
import { useBoolean, useLocalStorageState, useVirtualList } from 'ahooks'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { JknIcon } from '../jkn/jkn-icon'
import { Input, type InputProps } from '../ui/input'
import { Popover, PopoverAnchor, PopoverContent } from '../ui/popover'
import { ScrollArea } from '../ui/scroll-area'

export { StockPicker } from './picker'

interface StockSelectProps extends Omit<InputProps, 'onChange'> {
  onChange?: (symbol: string) => void
}

const StockSelect = ({ onChange, className, width, ...props }: StockSelectProps) => {
  const [open, { setTrue, setFalse }] = useBoolean(false)
  const stockList = useStockList()
  const [keyword, setKeyword] = useState('')
  const virtualListRef = useRef<VirtualStockListIns>(null)
  const [history, setHistory] = useLocalStorageState<typeof stockList.list>('stock-search-history', {
    defaultValue: []
  })

  const _onClick = (symbol: string) => {
    setFalse()

    setTimeout(() => {
      const s = stockList.list.find(item => item[1] === symbol)

      if (s) {
        setHistory(_s => {
          const newHistory = _s?.filter(item => item[1] !== symbol) ?? []
          newHistory.unshift(s)
          if(newHistory.length > 10){
            newHistory.pop()
          }
          return newHistory
        })
        onChange?.(symbol)
      }
    }, 200)
  }

  const _onClean = () => {
    setFalse()

    setTimeout(() => {
      setHistory([])
    }, 200)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const symbol = virtualListRef.current?.getFirstSymbol() 
      if(symbol){
        _onClick(symbol)
      }
    }
  }

  const onSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value)
    if (e.target.value && !open) {
      setTrue()
    }
  }

  return (
    <div className="w-48" style={{ width }}>
      <Popover
        modal
        open={open}
        onOpenChange={v => {
          !v && setFalse()
        }}
      >
        <PopoverAnchor asChild>
          <div className={cn('rounded-sm flex items-center px-2 bg-muted h-[38px]', className)}>
            <JknIcon.Svg className="w-5 h-5" color="#B8B8B8" name="search" />
            <Input
              value={keyword}
              onChange={onSearch}
              onKeyDown={onKeyDown}
              className="border-none placeholder:text-[#B8B8B8] text-base"
              size="sm"
              onClick={() => setTrue()}
              placeholder="搜索股票"
              {...props}
            />
          </div>
        </PopoverAnchor>
        <PopoverContent align="start" className="w-48 bg-muted" onOpenAutoFocus={e => e.preventDefault()}>
          {history?.length && !keyword ? (
            <div>
              <div className="flex items-center justify-between px-2 py-2 border-0 border-b border-solid border-border">
                <div className="text-sm">最近搜索</div>
                <JknIcon name="del" onClick={_onClean} className="w-4 h-4 cursor-pointer" />
              </div>
              <div className="">
                {history?.map(ele => (
                  <div
                    className="h-[49px] px-2 border-b-primary flex items-center hover:bg-accent cursor-pointer"
                    key={ele[1]}
                    onClick={() => _onClick(ele[1])}
                    onKeyDown={() => { }}
                  >
                    <div className="flex-shrink-0">
                      {ele[0] ? (
                        <JknIcon stock={ele[0]} className="h-8 w-8 mr-3" />
                      ) : (
                        <div className="h-8 w-8 mr-3 leading-8 text-center rounded-full bg-black">
                          {ele[1].slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-sm">{ele[1]}</div>
                      <div className="w-full overflow-hidden text-sm text-ellipsis whitespace-nowrap text-tertiary">
                        {ele[3]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <VirtualStockList keyword={keyword} onClick={_onClick} ref={virtualListRef} />
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

interface VirtualStockListProps {
  onClick?: (symbol: string) => void
  keyword?: string
}

interface VirtualStockListIns {
  getFirstSymbol: () => Nullable<string>
}

const VirtualStockList = forwardRef<VirtualStockListIns, VirtualStockListProps>((props, ref) => {
  const [data] = useStockSearch(props.keyword ?? '')

  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const [list] = useVirtualList(data, {
    containerTarget: () => containerRef.current?.querySelector('[data-radix-scroll-area-viewport]'),
    wrapperTarget: wrapperRef,
    itemHeight: 50,
    overscan: 20
  })

  useImperativeHandle(ref, () => ({
    getFirstSymbol: () => list[0]?.data[1] ?? null
  }), [list])
  
  return (
    <ScrollArea ref={containerRef} className="h-[500px]">
      <div ref={wrapperRef}>
        {list.map(ele => (
          <div
            className="h-[49px] px-2 border-0 border-b border-solid border-border flex items-center hover:bg-accent cursor-pointer w-48 box-border overflow-hidden"
            key={ele.index}
            onClick={() => props.onClick?.(ele.data[1])}
            onKeyDown={() => { }}
          >
            <div className="flex-shrink-0">
              {ele.data[0] ? (
                <JknIcon stock={ele.data[0]} className="h-8 w-8 mr-3" />
              ) : (
                <div className="h-8 w-8 mr-3 leading-8 text-center rounded-full bg-black">
                  {ele.data[1].slice(0, 1)}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm">{ele.data[1]}</div>
              <div className="w-full overflow-hidden text-sm text-ellipsis whitespace-nowrap text-tertiary">
                {ele.data[3]}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
})

export default StockSelect
