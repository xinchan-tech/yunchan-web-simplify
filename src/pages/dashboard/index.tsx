import GoldenStockPool from "./golden-stock-pool"
import LargeCap from "./large-cap"
import StockTree from "./stock-tree"
import TopList from "./top-list"

const DashBoardPage = () => {
  return (
    <div className="flex justify-stretch h-full w-full overflow-hidden bg-accent box-border p-1 space-x-1">
      <div className="w-[66%] flex flex-col overflow-hidden space-y-1">
        <div className="h-1/2 overflow-hidden bg-background rounded-xs">
          <LargeCap />
        </div>
        <div className="h-1/2 flex justify-stretch overflow-hidden ">
          <div className="w-1/2 overflow-hidden flex-shrink-0 rounded-xs bg-background box-border mr-0.5">
            <TopList />
          </div>
          <div className="w-1/2 overflow-hidden flex-shrink-0 rounded-xs bg-background box-border ml-0.5">
            <GoldenStockPool />
          </div>
        </div>
      </div>
      <div className="w-[34%] space-y-1 pb-1">
        <div className="h-2/3 bg-background rounded-xs">
          <StockTree />
        </div>
        <div className="h-1/3 bg-background rounded-xs">
          热力排行
        </div>
      </div>
    </div>
    // <div className="grid grid-cols-3 grid-rows-2 h-full w-full">
    //   <div>
    //     <LargeCap />
    //   </div>
    //   <div className="col-span-2">
    //     <StockTree />
    //   </div>
    //   <div>
    //     <GoldenStockPool />
    //   </div>
    //   <div>
    //     <TopList />
    //   </div>
    //   <div>
    //     <HotFundPoll />
    //   </div>
    // </div>
  )
}

export default DashBoardPage