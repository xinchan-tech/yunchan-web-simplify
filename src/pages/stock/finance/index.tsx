import { CapsuleTabs } from "@/components"
import { useState } from "react"
import { FinanceCore } from "./finance-core"
import { FinanceValuation } from "./finance-valuation"

export const Finance = () => {
  const [activeTab, setActiveTab] = useState('core')
  return (
    <div className="flex h-full overflow-hidden flex-col">
      <div className="border border-solid border-border py-1 px-2">
        <CapsuleTabs activeKey={activeTab} onChange={setActiveTab}>
          <CapsuleTabs.Tab label="核心财务" value="core" />
          <CapsuleTabs.Tab label="估值泡沫" value="valuation" />
          <CapsuleTabs.Tab label="财报统计" value="cb" />
          <CapsuleTabs.Tab label="同行对比" value="th" />
          <CapsuleTabs.Tab label="财务PK" value="pk" />
        </CapsuleTabs>
      </div>
      <div className="flex-1">
        {
          {
            core: <FinanceCore />,
            valuation: <FinanceValuation />,
          }[activeTab] ?? null
        }
      </div>
    </div>
  )
}