import { CapsuleTabs } from '@/components'
import { useState } from 'react'
import StockEconomic from './components/economic'
import StockEvent from './components/event'
import { FedInterestRateDecision } from './components/fed-interest-rate-decision'
import StockFinancials from './components/financials'
import StockHolidays from './components/holidays'
import { WitchingDay } from './components/witching-day'

const StockCalendar = () => {
  const [active, setActive] = useState('financials')
  return (
    <div className="h-full bg-muted flex flex-col">
      <div className="border-style-primary py-1">
        <CapsuleTabs activeKey={active} onChange={setActive}>
          <CapsuleTabs.Tab value="financials" label="财报个股" />
          <CapsuleTabs.Tab value="economic" label="经济数据" />
          <CapsuleTabs.Tab value="event" label="重大事件" />
          <CapsuleTabs.Tab value="usd" label="美联储决议" />
          <CapsuleTabs.Tab value="wd" label="巫日" />
          <CapsuleTabs.Tab value="holidays" label="休市" />
        </CapsuleTabs>
      </div>
      <div className="flex-1 overflow-hidden">
        {{
          financials: <StockFinancials />,
          economic: <StockEconomic />,
          event: <StockEvent />,
          usd: <FedInterestRateDecision />,
          wd: <WitchingDay />,
          holidays: <StockHolidays />
        }[active] ?? null}
      </div>
    </div>
  )
}

export default StockCalendar
