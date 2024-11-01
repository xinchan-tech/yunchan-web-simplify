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
      {
        false && (
          <>
            <div className="col-span-2">
              <StockTree />
            </div>
            <div>
              {/* 股票金池 */}
              <GoldenStockPool />
            </div>
            <div>
              <TopList />
            </div>
            <div>
              <HotFundPoll />
            </div>
          </>
        )
      }
    </div>
  )
}

export default DashBoardPage