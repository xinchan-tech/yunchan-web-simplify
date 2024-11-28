import { useQueryParams } from "@/hooks"
import { CollectList } from "./collect-list"
import { StockInfo } from "./stock-info"

const StockPage = () => {
  const queryParams = useQueryParams()
  const code = queryParams.get('symbol') ?? 'QQQ'

  return (
    <div className="grid  h-full grid-cols-[300px_1fr_300px] bg-muted">
      <CollectList />
      <div>
        23
      </div>
      <StockInfo />
    </div>
  )
}


export default StockPage