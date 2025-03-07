import { AlarmType } from '@/api'
import { AiAlarm, CapsuleTabs, JknIcon, PriceAlarm, useModal } from '@/components'
import { useState } from 'react'
import AiAlarmForm from '../../components/ai-alarm/ai-alarm-form'
import AlarmList from '../../components/ai-alarm/alarm-list'
import AlarmLog from '../../components/ai-alarm/alarm-log'
import PriceAlarmForm from '../../components/ai-alarm/price-alarm-form'

const AlarmPage = () => {
  const [alarmType, setAlarmType] = useState<AlarmType>(AlarmType.AI)
  const [viewType, setViewKey] = useState('list')
  const [count, setCount] = useState(0)
  const aiForm = useModal({
    content: <AiAlarmForm />,
    title: 'AI报警设置',
    className: 'w-[900px]',
    closeIcon: true,
    footer: false
  })

  const priceForm = useModal({
    content: <PriceAlarmForm />,
    title: '股价报警设置',
    closeIcon: true,
    footer: false,
    className: 'w-[900px]'
  })

  return (
    <div className="h-full bg-muted flex flex-col">
      <div className="border border-solid border-border py-1 flex items-center w-full pr-4 box-border mr-auto">
        <CapsuleTabs activeKey={alarmType.toString()} onChange={v => setAlarmType(+v)}>
          <CapsuleTabs.Tab label="AI报警" value={AlarmType.AI.toString()} />
          <CapsuleTabs.Tab label="股价报警" value={AlarmType.PRICE.toString()} />
          <CapsuleTabs.Tab label="画线报警" value={AlarmType.LINE.toString()} />
        </CapsuleTabs>
        <div className="ml-auto">
          {alarmType === AlarmType.AI ? (
            <AiAlarm>
              <div className="flex items-center cursor-pointer ml-auto text-xs text-secondary space-x-1">
                <JknIcon name="add" className="w-3 h-3" />
                <span>添加报警</span>
              </div>
            </AiAlarm>
          ) : (
            <PriceAlarm>
              <div className="flex items-center cursor-pointer ml-auto text-xs text-secondary space-x-1">
                <JknIcon name="add" className="w-3 h-3" />
                <span>添加报警</span>
              </div>
            </PriceAlarm>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="border-0 border-b border-solid border-border py-1 flex items-center">
          <CapsuleTabs type="text" activeKey={viewType} onChange={setViewKey}>
            <CapsuleTabs.Tab label="报警列表" value="list" />
            <CapsuleTabs.Tab label="已触发报警" value="log" />
          </CapsuleTabs>
          {viewType === 'list' ? <div className="text-xs ml-auto">当前运行报警：{count} 条</div> : null}
        </div>
        <div className="flex-1 overflow-hidden">
          {
            {
              list: <AlarmList type={alarmType} options onUpdateCount={setCount} />,
              log: <AlarmLog type={alarmType} />
            }[viewType]
          }
        </div>
      </div>
      {aiForm.context}
      {priceForm.context}
    </div>
  )
}

export default AlarmPage
