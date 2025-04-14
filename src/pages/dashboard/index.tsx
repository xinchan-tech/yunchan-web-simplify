import GoldenStockPool from './golden-stock-pool'
import { HotTop } from './hot-top'
import LargeCap from './large-cap'
import StockTree from './stock-tree'
import TopList from './top-list'

const DashBoardPage = () => {
  return (
    <div className="flex justify-stretch h-full w-full overflow-hidden bg-accent box-border space-x-1">
      <div className="w-[66%] flex flex-col overflow-hidden space-y-1">
        <div className="flex-1 overflow-hidden bg-background rounded-xs">
          <LargeCap />
        </div>
        <div className="flex-1 flex justify-stretch overflow-hidden ">
          <div className="flex-1 overflow-hidden flex-shrink-0 rounded-xs bg-background box-border mr-0.5">
            <GoldenStockPool />
          </div>
          <div className="flex-1 overflow-hidden flex-shrink-0 rounded-xs bg-background box-border ml-0.5">
            <TopList />
          </div>
        </div>
      </div>
      <div className="w-[34%] space-y-1">
        <div className="h-2/3 bg-background rounded-xs">
          <StockTree />
        </div>
        <div className="h-1/3 bg-background rounded-xs">
          <HotTop />
        </div>
      </div>
    </div>
  )
}

export default DashBoardPage
