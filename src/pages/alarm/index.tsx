import { CapsuleTabs, JknIcon, useModal } from "@/components"
import { useState } from "react"
import AlarmList from "./components/alarm-list"
import AiAlarmForm from "./components/ai-alarm-form"
import { useMount } from "ahooks"

const AlarmPage = () => {
  const [alarmType, setAlarmType] = useState('0')
  const [viewType, setViewKey] = useState('list')
  const aiForm = useModal({
    content: <AiAlarmForm />,
    title: 'AI报警设置',
    className: 'w-[900px]',
    closeIcon: true,
    footer: false
  })


  useMount(() => {

  })

  return (
    <div className="h-full bg-muted flex flex-col">
      <div className="border border-solid border-border py-1 flex items-center w-full pr-4 box-border">
        <CapsuleTabs activeKey={alarmType} onChange={setAlarmType}>
          <CapsuleTabs.Tab label="AI报警" value="0" />
          <CapsuleTabs.Tab label="股价报警" value="2" />
          <CapsuleTabs.Tab label="画线报警" value="3" />
        </CapsuleTabs>
        <div onClick={aiForm.modal.open} onKeyDown={() => { }} className="flex items-center cursor-pointer ml-auto text-xs text-secondary space-x-1">
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
        <AlarmList type={alarmType} options />
      </div>
      {
        aiForm.context
      }
    </div>
  )
}




export default AlarmPage