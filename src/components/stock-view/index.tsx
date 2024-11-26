import { useStockList } from "@/store"
import JknIcon from "../jkn/jkn-icon"

interface StockViewProps {
  code: string
  name: string
}

const StockView = ({ code, name }: StockViewProps) => {
  const stockList = useStockList()

  const stock = stockList.list.find(item => item[1] === code)

  return (
    <div className="overflow-hidden flex items-center">
      <div>
        {
          stock?.[0] ? (
            <JknIcon stock={stock?.[0]} className="h-6 w-6 mr-3" />
          ) : (
            <div className="h-8 w-8 mr-3 leading-8 text-center rounded-full bg-black" >{code.slice(0, 1)}</div>
          )
        }
      </div>
      <div className="flex-1 overflow-hidden ">
        <div className="text-foreground">{code}</div>
        <div className="w-full text-tertiary text-xs whitespace-nowrap text-ellipsis overflow-hidden">{name}</div>
      </div>
    </div>
  )
}

export default StockView