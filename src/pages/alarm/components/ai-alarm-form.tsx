import { CapsuleTabs, Input, Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components"
import { useBoolean, useFocusWithin, useMount } from "ahooks"
import { useRef } from "react"

const AiAlarmForm = () => {
  return (
    <div className="h-[800px] overflow-hidden">
      <div className="p-1 border-0 border-b border-solid border-border">
        <CapsuleTabs activeKey="1">
          <CapsuleTabs.Tab label="报警设置" value="1" />
          <CapsuleTabs.Tab label="报警列表" value="2" />
          <CapsuleTabs.Tab label="已触发报警" value="3" />
        </CapsuleTabs>
      </div>
      <div>
        <StockSelect />
      </div>
    </div>
  )
}

const StockSelect = () => {
  const [open, { setTrue, setFalse }] = useBoolean(false)
  const target = useRef<HTMLInputElement>(null)
  useMount(() => {
    target.current?.focus()
  })

  return (
    <div className="w-32">
      <Popover open={open} onOpenChange={v => !v && setFalse()}>
        <PopoverAnchor asChild>
          <Input size="sm" onClick={() => setTrue()} placeholder="请输入股票代码" />
        </PopoverAnchor>
        <PopoverContent onOpenAutoFocus={e => e.preventDefault()}>

        </PopoverContent>
      </Popover>
    </div>
  )
}

export default AiAlarmForm