import { AlarmType } from '@/api'
import { AiAlarmSetting, CapsuleTabs } from '@/components'
import { useState } from 'react'
import AlarmList from './alarm-list'
import AlarmLog from './alarm-log'
import { PriceAlarmSetting } from './price-alarm-setting'

interface PriceAlarmFormProps {
  code?: string
}

const PriceAlarmForm = (props: PriceAlarmFormProps) => {
  const [active, setActive] = useState('1')

  return (
    <div className="h-[610px] overflow-hidden w-full flex flex-col">
      <div className="border-0 border-b border-solid border-border flex items-center px-4">
        <CapsuleTabs activeKey={active} onChange={setActive} type="text">
          <CapsuleTabs.Tab label="股价报警" value="1" />
          <CapsuleTabs.Tab label="AI报警" value="2" />
        </CapsuleTabs>
        {/* <div className="text-xs ml-auto">当前运行报警：{count} 条</div> */}
      </div>
      <div className="flex-1 overflow-hidden">
        {{
          1: <PriceAlarmSetting code={props.code} />,
          2: <AiAlarmSetting code={props.code} />,
        }[active] ?? null}
      </div>
    </div>
  )
}

export default PriceAlarmForm
