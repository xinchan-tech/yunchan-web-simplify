import { getAllStocks } from '@/api'
import { useStockList } from '@/store'
import { cn } from '@/utils/style'
import { useQuery } from '@tanstack/react-query'
import { useBoolean, useVirtualList } from 'ahooks'
import pako from 'pako'
import { useEffect, useMemo, useRef, useState } from 'react'
import { JknIcon } from '../jkn/jkn-icon'
import { Input, type InputProps } from '../ui/input'
import { Popover, PopoverAnchor, PopoverContent } from '../ui/popover'
import { ScrollArea } from '../ui/scroll-area'
import { Trie } from './trie-tree'
import { useStockSearch } from "@/hooks"

interface StockSelectProps extends Omit<InputProps, 'onChange'> {
  onChange?: (symbol: string) => void
}

const StockSelect = ({ onChange, className, width, ...props }: StockSelectProps) => {
  const [open, { setTrue, setFalse }] = useBoolean(false)
  const stockList = useStockList()
  const [keyword, setKeyword] = useState('')

  const _onClick = (symbol: string) => {
    setFalse()

    setTimeout(() => {
      const s = stockList.list.find(item => item[1] === symbol)

      if (s) {
        stockList.appendHistory([s])
        onChange?.(symbol)
      }
    }, 200)
  }

  const _onClean = () => {
    setFalse()

    setTimeout(() => {
      stockList.cleanHistory()
    }, 200)
  }

  return (
    <div className="w-48" style={{ width }}>
      <Popover modal open={open} onOpenChange={v => !v && setFalse()}>
        <PopoverAnchor asChild>
          <div
            className={cn(
              'border border-solid border-dialog-border rounded-sm flex items-center px-2 bg-accent',
              className
            )}
          >
            <JknIcon className="w-4 h-4" name="ic_search" />
            <Input
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              className="border-none placeholder:text-tertiary"
              size="sm"
              onClick={() => setTrue()}
              placeholder="请输入股票代码"
              {...props}
            />
          </div>
        </PopoverAnchor>
        <PopoverContent align="start" onOpenAutoFocus={e => e.preventDefault()}>
          {stockList.history.length > 0 && !keyword ? (
            <div>
              <div className="flex items-center justify-between px-2 py-2 border-0 border-b border-solid border-border">
                <div className="text-sm">最近搜索</div>
                <JknIcon name="del" onClick={_onClean} className="w-4 h-4 cursor-pointer" />
              </div>
              <ScrollArea className="h-[300px]">
                {stockList.history.map(ele => (
                  <div
                    className="h-[49px] px-2 border-0 border-b border-solid border-border flex items-center hover:bg-accent cursor-pointer"
                    key={ele[1]}
                    onClick={() => _onClick(ele[1])}
                    onKeyDown={() => {}}
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
              </ScrollArea>
            </div>
          ) : (
            <VirtualStockList keyword={keyword} onClick={_onClick} />
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

const VirtualStockList = (props: VirtualStockListProps) => {
  const [data] = useStockSearch(props.keyword ?? '')

  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const [list] = useVirtualList(data, {
    containerTarget: () => containerRef.current?.querySelector('[data-radix-scroll-area-viewport]'),
    wrapperTarget: wrapperRef,
    itemHeight: 50,
    overscan: 20
  })

  return (
    <ScrollArea ref={containerRef} className="h-[500px]">
      <div ref={wrapperRef}>
        {list.map(ele => (
          <div
            className="h-[49px] px-2 border-0 border-b border-solid border-border flex items-center hover:bg-accent cursor-pointer"
            key={ele.index}
            onClick={() => props.onClick?.(ele.data[1])}
            onKeyDown={() => {}}
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
}

export default StockSelect
