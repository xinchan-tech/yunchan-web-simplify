import { CapsuleTabs } from '@/components'
import { useState } from 'react'
import { FedInterestRateDecision } from './components/fed-interest-rate-decision'
import StockFinancials from './components/financials'
import StockHolidays from './components/holidays'
import { WitchingDay } from './components/witching-day'
import EconomicTimeline from './components/economic-timeline'

const StockCalendar = () => {
  const [active, setActive] = useState('financials')
  return (
    <div className="h-full w-full overflow-hidden flex justify-center bg-black">
      <div className="h-full overflow-hidden flex flex-col w-page-content pt-[40px] stock-views">
        <div className="flex items-center flex-shrink-0 pl-2">
          <CapsuleTabs activeKey={active} onChange={setActive}>
            <CapsuleTabs.Tab value="financials" label="财报个股" />
            <CapsuleTabs.Tab value="timeline" label="财经日历" />
            <CapsuleTabs.Tab value="usd" label="美联储决议" />
            <CapsuleTabs.Tab value="wd" label="巫日" />
            <CapsuleTabs.Tab value="holidays" label="休市" />
          </CapsuleTabs>
        </div>
        <div className="flex-1 overflow-hidden">
          {{
            financials: <StockFinancials />,
            timeline: <EconomicTimeline />,
            usd: <FedInterestRateDecision />,
            wd: <WitchingDay />,
            holidays: <StockHolidays />
          }[active] ?? null}
        </div>
      </div>
    </div>
  )
}

export default StockCalendar
