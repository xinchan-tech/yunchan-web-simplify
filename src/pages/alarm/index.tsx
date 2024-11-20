import { CapsuleTabs, JknIcon, useModal } from "@/components"
import { useState } from "react"
import AlarmList from "./components/alarm-list"
import AiAlarmForm from "./components/ai-alarm-form"
import { useMount } from "ahooks"
import PriceAlarmForm from "./components/price-alarm-form"
import AlarmLog from "./components/alarm-log"
import { AlarmType } from "@/api"

const AlarmPage = () => {
  const [alarmType, setAlarmType] = useState<AlarmType>(AlarmType.AI)
  const [viewType, setViewKey] = useState('list')
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
    className: 'w-[900px]',
  })


  useMount(() => {
    // priceForm.modal.open()
  })

  const onOpenSetting = () => {
    if (alarmType === AlarmType.AI) {
      aiForm.modal.open()
    } else {
      priceForm.modal.open()
    }
  }

  return (
    <div className="h-full bg-muted flex flex-col">
      <div className="border border-solid border-border py-1 flex items-center w-full pr-4 box-border">
        <CapsuleTabs activeKey={alarmType.toString()} onChange={v => setAlarmType(+v)}>
          <CapsuleTabs.Tab label="AI报警" value={AlarmType.AI.toString()} />
          <CapsuleTabs.Tab label="股价报警" value={AlarmType.PRICE.toString()} />
          <CapsuleTabs.Tab label="画线报警" value={AlarmType.LINE.toString()} />
        </CapsuleTabs>
        <div onClick={onOpenSetting} onKeyDown={() => { }} className="flex items-center cursor-pointer ml-auto text-xs text-secondary space-x-1">
          <JknIcon name="add" className="w-3 h-3" />
          <span>添加报警</span>
        </div>
      </div>
      <div className="flex-1 ">
        <div className="border-0 border-b border-solid border-border py-1">
          <CapsuleTabs type="text" activeKey={viewType} onChange={setViewKey}>
            <CapsuleTabs.Tab label="报警列表" value="list" />
            <CapsuleTabs.Tab label="已触发报警" value="log" />
          </CapsuleTabs>
        </div>
        {{
          list: <AlarmList type={alarmType} options />,
          log: <AlarmLog type={alarmType} />
        }[viewType]}
      </div>
      {
        aiForm.context
      }
      {
        priceForm.context
      }
    </div>
  )
}




export default AlarmPage