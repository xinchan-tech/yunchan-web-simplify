
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
    <div className="h-full flex flex-nowrap bg-muted overflow-hidden">
      <div id="stock-trading-left-container" className="order w-[300px] data-[width=half]:w-[150px] data-[width=none]:hidden h-full flex-shrink-0">
        <CollectList onCollectChange={s => setQueryParams({ symbol: s })} />
      </div>
      <div className="flex-1 order-1 h-full">
        {
          params.type && !['finance'].includes(params.type) ? (
            <KChart />
          ): <Finance />
        }
      </div>
      {
        params.type && !['finance'].includes(params.type) && (
          <div id="stock-trading-right-container" className="order-2 w-[300px] data-[width=half]:w-[150px] data-[width=none]:hidden h-full flex-shrink-0">
            <StockInfo />
          </div>
        )
      }
    </div>
  )
}


export default StockPage