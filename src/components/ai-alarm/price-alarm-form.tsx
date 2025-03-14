import { AiAlarmSetting, CapsuleTabs, Tabs, TabsList, TabsTrigger } from '@/components'
import { useState } from 'react'
import { PriceAlarmSetting } from './price-alarm-setting'

interface PriceAlarmFormProps {
  code?: string
  onClose?: () => void
}

const PriceAlarmForm = (props: PriceAlarmFormProps) => {
  const [active, setActive] = useState('1')

  return (
    <div className="h-[640px] overflow-hidden w-full flex flex-col">
      <div className="border-0 border-b border-solid border-border flex items-center px-4">
        <Tabs value={active} onValueChange={setActive} >
          <TabsList variant="line">
            <TabsTrigger value="1" asChild>
              <span>价格报警</span>
            </TabsTrigger>
            <TabsTrigger value="2" asChild>
              <span>AI报警</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="flex-1 overflow-hidden">
        {{
          1: <PriceAlarmSetting code={props.code} onClose={props.onClose} />,
          2: <AiAlarmSetting code={props.code} onClose={props.onClose} />,
        }[active] ?? null}
      </div>
    </div>
  )
}

export default PriceAlarmForm
