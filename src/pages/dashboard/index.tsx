import GoldenStockPool from "./golden-stock-pool"
import LargeCap from "./large-cap"
import StockTree from "./stock-tree"
import TopList from "./top-list"

const DashBoardPage = () => {
  return (
    <div className="flex justify-stretch h-full w-full overflow-hidden">
      <div className="w-[66%] flex flex-col overflow-hidden">
        <div className="h-1/2">
          <LargeCap />
        </div>
        <div className="h-1/2 flex justify-stretch">
          <div className="w-1/2">
            <TopList />

          </div>
          <div className="w-1/2">
            <GoldenStockPool />
          </div>
        </div>
      </div>
      <div className="w-[34%]">
        <div className="h-2/3">
          <StockTree />
        </div>
        <div className="h-1/3">
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