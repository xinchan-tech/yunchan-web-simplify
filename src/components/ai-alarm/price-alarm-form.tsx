import { AlarmType } from "@/api"
import { CapsuleTabs } from "@/components"
import { useState } from "react"
import AlarmList from "./alarm-list"
import AlarmLog from "./alarm-log"
import { PriceAlarmSetting } from "./price-alarm-setting"

interface PriceAlarmFormProps {
  code?: string
}

const PriceAlarmForm = (props: PriceAlarmFormProps) => {
  const [active, setActive] = useState('1')

  return (
    <div className="h-[800px] overflow-hidden w-[900px]">
      <div className="p-1 border-0 border-b border-solid border-border">
        <CapsuleTabs activeKey={active} onChange={setActive}>
          <CapsuleTabs.Tab label="报警设置" value="1" />
          <CapsuleTabs.Tab label="报警列表" value="2" />
          <CapsuleTabs.Tab label="已触发报警" value="3" />
        </CapsuleTabs>
      </div>
      <div>
        {{
          1: <PriceAlarmSetting code={props.code} />,
          2: <AlarmList type={AlarmType.PRICE} />,
          3: <AlarmLog type={AlarmType.PRICE} />
        }[active] ?? null}
      </div>
    </div>
  )
}



export default PriceAlarmForm