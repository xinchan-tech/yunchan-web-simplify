import { CollectList } from "./collect-list"
import { StockInfo } from "./stock-info"
import { KChart } from "./k-chart"

const StockPage = () => {
  return (
    <div className="grid  h-full grid-cols-[300px_1fr_300px] bg-muted">
      <CollectList />
      <KChart />
      <StockInfo />
    </div>
  )
}


export default StockPage