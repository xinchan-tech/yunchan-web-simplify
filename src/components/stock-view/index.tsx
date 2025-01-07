import { useStockList } from "@/store"
import { JknIcon } from "../jkn/jkn-icon"
import { useNavigate } from "react-router"

interface StockViewProps {
  code: string
  name: string
}



const StockView = ({ code, name }: StockViewProps) => {
  const listMap = useStockList(s => s.listMap)
  const navigate = useNavigate()
  const stock = listMap[code]

  return (
    <div className="overflow-hidden flex items-center w-full" onDoubleClick={() => navigate(`/stock/trading?symbol=${code}`)}>
      <div>
        {
          stock?.[0] ? (
            <JknIcon stock={stock?.[0]} className="h-6 w-6 mr-3" />
          ) : (
            <div className="h-8 w-8 mr-3 leading-8 text-center rounded-full bg-black" >{code?.slice(0, 1)}</div>
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