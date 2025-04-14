import { getStockBaseCodeInfo } from "@/api"
import { PopoverTrigger, Input, JknIcon, Popover, PopoverContent, SubscribeSpan } from '@/components'
import { JknVirtualList } from '@/components/jkn/jkn-virtual-list'
import { useStockSearch } from '@/hooks'
import { useStockList } from '@/store'
import { stockUtils } from "@/utils/stock"
import { cn } from '@/utils/style'
import { useQuery } from "@tanstack/react-query"
import { useState } from 'react'

interface AlarmStickPickerProps {
  value?: string
  onChange?: (value: string) => void
}

export const AlarmStockPicker = ({ value, onChange }: AlarmStickPickerProps) => {
  const stockMap = useStockList(s => s.listMap)
  const [search, setSearch] = useState('')
  const [result] = useStockSearch(search)
  const [open, setOpen] = useState(false)

  const query = useQuery({
    queryKey: [getStockBaseCodeInfo.cacheKey, value, ['total_share']],
    queryFn: () => getStockBaseCodeInfo({ symbol: value!, extend: ['total_share'] }),
    enabled: !!value,
    select: data => data ? stockUtils.toStock(data.stock, {
      extend: data.extend,
      symbol: data.symbol,
      name: data.name
    }) : null
  })

  return (
    <Popover modal open={open} onOpenChange={v => !v && setOpen(false)}>
      <PopoverTrigger asChild>
        <div className="flex items-center h-[40px] ml-auto overflow-hidden flex-1">
          <div
            className={cn(
              'flex items-center border border-input border-solid rounded-md px-5 py-1.5 flex-1 overflow-hidden',
              open && 'border-[3px] border-primary'
            )}
            onClick={() => setOpen(true)}
            onKeyDown={() => {}}
          >
            {value ? (
              <>
                <JknIcon.Stock symbol={value} className="w-6 h-6 mr-2" />
                <span>{value}</span>
                <span className="ml-2 text-tertiary text-xs flex-1 overflow-hidden line-clamp-1">
                  {stockMap[value]?.[2]}
                </span>
                {
                  query.data ? (
                    <div className="mr-1">
                      <SubscribeSpan.Price trading="intraDay" symbol={query.data.symbol} initValue={query.data.close} showColor={false}  />&nbsp;
                      <SubscribeSpan.Percent trading="intraDay" symbol={query.data.symbol} initValue={query.data.close} showColor={true} initDirection={query.data.close - query.data.prevClose > 0} />
                    </div>
                  ): null
                }
              </>
            ) : (
              <span className="text-tertiary text-xs">--</span>
            )}
            <JknIcon.Svg name="arrow-down" className="ml-auto text-tertiary" size={10} />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[408px]">
        <div className="w-full">
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
                  className="flex items-center px-2 cursor-pointer hover:bg-accent py-4 overflow-hidden w-[458px] box-border"
                  onClick={() => {
                    onChange?.(symbol)
                    setOpen(false)
                  }}
                  onKeyDown={() => {}}
                >
                  <JknIcon.Stock symbol={symbol} className="w-6 h-6 mr-2 flex-shrink-0" />
                  <span>{symbol}</span>
                  <span className="ml-2 text-tertiary text-xs overflow-hidden text-ellipsis whitespace-nowrap">
                    {name}
                  </span>
                </div>
              )}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
