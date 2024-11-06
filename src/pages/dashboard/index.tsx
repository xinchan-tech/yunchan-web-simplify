import GoldenStockPool from "./golden-stock-pool"
import HotFundPoll from "./hot-fund-pool"
import LargeCap from "./large-cap"
import StockTree from "./stock-tree"
import TopList from "./top-list"

const DashBoardPage = () => {
  return (
    <div className="grid grid-cols-3 grid-rows-2 h-full w-full">
      <div>
        <LargeCap />
      </div>
      <div className="col-span-2">
        <StockTree />
      </div>
      <div>
        <GoldenStockPool />
      </div>
      <div>
        <TopList />
      </div>
      <div>
        <HotFundPoll />
      </div>
    </div>
  )
}

/*       <div>
  <LargeCap />
</div>
<div className="col-span-2">
  <StockTree />
</div>

<div>
  <GoldenStockPool />
</div>
<div>
  <TopList />
</div>
<div>
  <HotFundPoll />
</div>
 */

export default DashBoardPage