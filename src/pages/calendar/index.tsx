import { CapsuleTabs } from "@/components"
import StockFinancials from "./components/financials"
import { useState } from "react"
import StockEconomic from "./components/economic"
import StockEvent from "./components/event"

const StockCalendar = () => {
  const [active, setActive] = useState('financials')
  return (
    <div className="bg-muted ">
      <div className="border-style-primary py-1">
        <CapsuleTabs activeKey={active} onChange={setActive}>
          <CapsuleTabs.Tab value="financials" label="财报个股" />
          <CapsuleTabs.Tab value="economic" label="经济数据" />
          <CapsuleTabs.Tab value="event" label="重大事件" />
          <CapsuleTabs.Tab value="holidays" label="休市" />
        </CapsuleTabs>
      </div>
      <div>
        {{
          financials: <StockFinancials />,
          economic: <StockEconomic />,
          event: <StockEvent />
        }[active] ?? null}
      </div>
    </div>
  )
}

export default StockCalendar