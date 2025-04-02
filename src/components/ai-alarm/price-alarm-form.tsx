import { AiAlarmSetting, CapsuleTabs, Tabs, TabsList, TabsTrigger } from '@/components'
import { useState } from 'react'
import { PriceAlarmSetting } from './price-alarm-setting'
import { PercentageAlarmSetting } from "./percent-alarm-setting"

interface PriceAlarmFormProps {
  code?: string
  onClose?: () => void
}

const PriceAlarmForm = (props: PriceAlarmFormProps) => {
  const [active, setActive] = useState('1')

  return (
    <div className="h-[700px] overflow-hidden w-full flex flex-col">
      <div className="flex items-center px-4 relative">
        <div className="absolute left-4 bottom-0 right-4 h-1 bg-[#575757] -z-0 rounded" />
        <Tabs value={active} onValueChange={setActive}>
          <TabsList variant="line" className="w-full">
            <TabsTrigger value="1" asChild>
              <span className="!text-base !text-foreground !leading-5">AI报警</span>
            </TabsTrigger>
            <TabsTrigger value="2" asChild>
              <span className="!text-base !text-foreground !leading-5">浮动报警</span>
            </TabsTrigger>

            <TabsTrigger value="3" asChild>
              <span className="!text-base !text-foreground !leading-5">价格报警</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="flex-1 overflow-hidden">
        {{
          3: <PriceAlarmSetting code={props.code} onClose={props.onClose} />,
          2: <PercentageAlarmSetting code={props.code} onClose={props.onClose} />,
          1: <AiAlarmSetting code={props.code} onClose={props.onClose} />,
        }[active] ?? null}
      </div>
    </div>
  )
}

export default PriceAlarmForm
