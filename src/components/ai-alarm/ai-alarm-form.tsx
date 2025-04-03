import { AlarmType } from '@/api'
import { AiAlarmSetting, CapsuleTabs } from '@/components'
import { useState } from 'react'
import AlarmList from './alarm-list'
import AlarmLog from './alarm-log'

interface AiAlarmFormProps {
  code?: string
}
const AiAlarmForm = (props: AiAlarmFormProps) => {
  const [active, setActive] = useState('1')
  const [count, setCount] = useState(0)

  return (
    <div className="h-[800px]  overflow-hidden w-[900px] flex flex-col">
      <div className="p-1 border-0 border-b border-solid border-border flex items-center">
        <CapsuleTabs activeKey={active} onChange={setActive}>
          <CapsuleTabs.Tab label="警报设置" value="1" />
          <CapsuleTabs.Tab label="警报列表" value="2" />
          <CapsuleTabs.Tab label="已触发警报" value="3" />
        </CapsuleTabs>
        <div className="text-xs ml-auto">当前运行警报：{count} 条</div>
      </div>
      <div className="flex-1">
        {{
          1: <AiAlarmSetting code={props.code} />,
          2: <AlarmList type={AlarmType.AI} onUpdateCount={setCount} />,
          3: <AlarmLog type={AlarmType.AI} />
        }[active] ?? null}
      </div>
    </div>
  )
}

export default AiAlarmForm
