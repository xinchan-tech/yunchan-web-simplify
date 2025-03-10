import { router } from '@/router'
import { useStockList } from '@/store'
import { JknIcon } from '../jkn/jkn-icon'
import { cn } from "@/utils/style"

interface StockViewProps {
  code: string
  name?: string
  showName?: boolean
  iconSize?: number
  className?: string
}

const StockView = ({ code, name, showName = false, iconSize = 24, className }: StockViewProps) => {
  const listMap = useStockList(s => s.listMap)
  const stock = listMap[code]

  return (
    <div
      className={cn('overflow-hidden flex items-center w-full', className)}
      onDoubleClick={() => router.navigate(`/stock/trading?symbol=${code}`)}
    >
      <div>
        {stock?.[0] ? (
          <JknIcon stock={stock?.[0]} className="mr-3" style={{ width: iconSize, height: iconSize }} />
        ) : (
          <div className="mr-3 leading-6 text-center rounded-full bg-black" style={{ width: iconSize, height: iconSize }}>{code?.slice(0, 1)}</div>
        )}
      </div>
      <div className="flex-1 overflow-hidden ">
        <div className="text-foreground">{code}</div>
        {showName ? (
          <div className="w-full text-tertiary text-xs whitespace-nowrap text-ellipsis overflow-hidden">
            {name || '--'}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default StockView
