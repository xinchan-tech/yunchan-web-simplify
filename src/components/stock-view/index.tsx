import { useStockList } from "@/store"
import { JknIcon } from "../jkn/jkn-icon"
import { router } from "@/router"

interface StockViewProps {
  code: string
  name: string
  showName?: boolean
}


const StockView = ({ code, name, showName = false }: StockViewProps) => {
  const listMap = useStockList(s => s.listMap)
  const stock = listMap[code]

  return (
    <div className="overflow-hidden flex items-center w-full" onDoubleClick={() => router.navigate(`/stock/trading?symbol=${code}`)}>
      <div>
        {
          stock?.[0] ? (
            <JknIcon stock={stock?.[0]} className="h-6 w-6 mr-3" />
          ) : (
            <div className="h-6 w-6 mr-3 leading-6 text-center rounded-full bg-black" >{code?.slice(0, 1)}</div>
          )
        }
      </div>
      <div className="flex-1 overflow-hidden ">
        <div className="text-foreground">{code}</div>
        {
          showName ? (
            <div className="w-full text-tertiary text-xs whitespace-nowrap text-ellipsis overflow-hidden">{name || '--'}</div>
          ) : null
        }
      </div>
    </div>
  )
}

export default StockView