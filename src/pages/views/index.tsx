import { CapsuleTabs } from "@/components"
import { useState } from "react"
import PageTable from "./components/page-table"
import SectorTable from "./components/sector-table"
import SingleTable from "./single-table"
import EtfTable from "./components/etf-table"

/**
 * 视图组件：展示不同类型的股票数据
 */
const Views = () => {
  const [activeKey, setActiveKey] = useState("all")

  return (
    <div className="h-full w-full overflow-hidden flex justify-center bg-black">
      <div className="h-full overflow-hidden flex flex-col w-[1200px] pt-[40px] stock-views">
        <div className="flex items-center flex-shrink-0 pl-2">
          <CapsuleTabs activeKey={activeKey} onChange={setActiveKey}>
            <CapsuleTabs.Tab label="全部美股" value="all" />
            <CapsuleTabs.Tab label="行业板块" value="industry" />
            <CapsuleTabs.Tab label="概念板块" value="concept" />
            <CapsuleTabs.Tab label="ETF" value="etf" />
            <CapsuleTabs.Tab label="中概股" value="china" />
            {/* <CapsuleTabs.Tab label="纳指成份" value="ixic" /> */}
            {/* <CapsuleTabs.Tab label="标普成分" value="spx" /> */}
            {/* <CapsuleTabs.Tab label="道指成分" value="dji" /> */}
            {/* <CapsuleTabs.Tab label="昨日多强榜↑" value="yesterday_bull" /> */}
            {/* <CapsuleTabs.Tab label="昨日空强榜↓" value="yesterday_bear" /> */}
            {/* <CapsuleTabs.Tab label="3日涨幅榜↑" value="short_amp_up" /> */}
            {/* <CapsuleTabs.Tab label="3日跌幅榜↓" value="short_amp_d" /> */}
            {/* <CapsuleTabs.Tab label="跳空涨跌榜" value="gap" /> */}
            {/* <CapsuleTabs.Tab label="昨日放量榜" value="release" /> */}
          </CapsuleTabs>
        </div>
        <div className="flex-1 overflow-hidden">
          {!activeKey ||
            ["all", "ixic", "spx", "dji"].includes(activeKey) ? (
            <PageTable type={activeKey} />
          ) : ["industry", "concept"].includes(activeKey) ? (
            <SectorTable type={activeKey === "industry" ? 1 : 2} />
          ) : activeKey === 'etf' ? (
            <EtfTable type={activeKey} />
          ) : (
            <SingleTable type={activeKey} />
          )}
        </div>
      </div>
      <style jsx global>{`
        .stock-views .rc-table th {
          padding-top: 20px;
          padding-bottom: 20px;
          border: none;
        }
        .stock-views .rc-table td {
          border: none;
          height: 50px;
          padding-top: 0;
          padding-bottom: 0;
        }
      `}
      </style>
    </div>
  )
}

export default Views
