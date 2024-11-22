import { AlarmType } from "@/api"
import { AiAlarmSetting, CapsuleTabs } from "@/components"
import { useState } from "react"
import AlarmList from "./alarm-list"
import AlarmLog from "./alarm-log"

interface AiAlarmFormProps {
  code?: string
}
const AiAlarmForm = (props: AiAlarmFormProps) => {
  const [active, setActive] = useState('1')

  return (
    <div className="h-[800px] overflow-hidden">
      <div className="p-1 border-0 border-b border-solid border-border">
        <CapsuleTabs activeKey={active} onChange={setActive}>
          <CapsuleTabs.Tab label="报警设置" value="1" />
          <CapsuleTabs.Tab label="报警列表" value="2" />
          <CapsuleTabs.Tab label="已触发报警" value="3" />
        </CapsuleTabs>
      </div>
      <div>
        {{
          1: <AiAlarmSetting code={props.code} />,
          2: <AlarmList type={AlarmType.AI} />,
          3: <AlarmLog type={AlarmType.AI} />
        }[active] ?? null}
      </div>
    </div>
  )
}




export default AiAlarmForm