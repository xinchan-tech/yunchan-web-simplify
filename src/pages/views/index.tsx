import { CapsuleTabs, ScrollArea } from "@/components"
import { useState } from "react"
import SingleTable from "./signle-table"
import DoubleTable from "./double-table"

const Views = () => {
  const [activeKey, setActiveKey] = useState('all')

  return (
    <div className="h-full overflow-hidden">
      <div className="h-8 border-border border border-solid flex items-center">
        <CapsuleTabs activeKey={activeKey} onChange={setActiveKey}>
          <CapsuleTabs.Tab label="全部美股" value="all" />
          <CapsuleTabs.Tab label="行业板块" value="industry" />
          <CapsuleTabs.Tab label="概念板块" value="concept" />
          <CapsuleTabs.Tab label="纳指成份" value="nz" />
          <CapsuleTabs.Tab label="标普成分" value="bsp" />
          <CapsuleTabs.Tab label="道指成分" value="dz" />
          <CapsuleTabs.Tab label="ETF" value="etf" />
          <CapsuleTabs.Tab label="中概股" value="cn" />
          <CapsuleTabs.Tab label="昨日多强榜↑" value="nz" />
          <CapsuleTabs.Tab label="昨日空强榜↓" value="nz" />
          <CapsuleTabs.Tab label="3日涨幅榜↑" value="nz" />
          <CapsuleTabs.Tab label="3日跌幅榜↓" value="nz" />
          <CapsuleTabs.Tab label="跳空涨跌榜" value="nz" />
          <CapsuleTabs.Tab label="昨日放量榜" value="nz" />
        </CapsuleTabs>
      </div>
      <ScrollArea className="h-[calc(100%-32px)]">
        {
          ['industry', 'concept'].includes(activeKey) ? <DoubleTable /> : <SingleTable />
        }
      </ScrollArea>
    </div>
  )
}



export default Views