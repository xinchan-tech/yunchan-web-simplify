import { CapsuleTabs } from '@/components'
import { useState } from 'react'
import PageTable from './components/page-table'
import DoubleTable from './double-table'
import SingleTable from './single-table'

const Views = () => {
  const [activeKey, setActiveKey] = useState('all')

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="h-8 flex-shrink-0 border-border border border-solid flex items-center">
        <CapsuleTabs activeKey={activeKey} onChange={setActiveKey}>
          <CapsuleTabs.Tab label="全部美股" value="all" />
          <CapsuleTabs.Tab label="行业板块" value="industry" />
          <CapsuleTabs.Tab label="概念板块" value="concept" />
          <CapsuleTabs.Tab label="纳指成份" value="ixic" />
          <CapsuleTabs.Tab label="标普成分" value="spx" />
          <CapsuleTabs.Tab label="道指成分" value="dji" />
          <CapsuleTabs.Tab label="ETF" value="etf" />
          <CapsuleTabs.Tab label="中概股" value="china" />
          <CapsuleTabs.Tab label="昨日多强榜↑" value="yesterday_bull" />
          <CapsuleTabs.Tab label="昨日空强榜↓" value="yesterday_bear" />
          <CapsuleTabs.Tab label="3日涨幅榜↑" value="short_amp_up" />
          <CapsuleTabs.Tab label="3日跌幅榜↓" value="short_amp_d" />
          <CapsuleTabs.Tab label="跳空涨跌榜" value="gap" />
          <CapsuleTabs.Tab label="昨日放量榜" value="release" />
        </CapsuleTabs>
      </div>
      <div className="flex-1 overflow-hidden">
        {!activeKey || ['all', 'ixic', 'spx', 'dji', 'etf'].includes(activeKey) ? (
          <PageTable type={activeKey} />
        ) : ['industry', 'concept'].includes(activeKey) ? (
          <DoubleTable type={activeKey === 'industry' ? 1 : 2} />
        ) : (
          <SingleTable type={activeKey} />
        )}
      </div>
    </div>
  )
}

export default Views
