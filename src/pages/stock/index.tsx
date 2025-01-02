
import { StockInfo } from "./chart/stock-info"
import { KChart } from "./chart/k-chart"
import { CollectList } from "@/components"
import { useQueryParams } from "@/hooks"
import { useParams } from "react-router"
import { Finance } from "./finance"


/**
 * TODO 分时图X轴需要单独处理
 */
const StockPage = () => {
  const [_, setQueryParams] = useQueryParams()
  const params = useParams<{ type: string }>()


  return (
    <div className="grid  h-full grid-cols-[300px_1fr_300px] bg-muted">
      <CollectList onCollectChange={s => setQueryParams({ symbol: s })} />
      {
        params.type && !['finance'].includes(params.type) ? (
          <>
            <KChart />
            <StockInfo />
          </>
        ): <div className="col-span-2"><Finance /></div>
      }
    </div>
  )
}


export default StockPage