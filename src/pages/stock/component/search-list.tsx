import { Input, Label, RadioGroup, RadioGroupItem, ScrollArea } from "@/components"
import { useState, type ReactNode } from "react"
import { useKChartContext } from "../lib"

interface SearchListProps<T extends 'single' | 'multi' = 'single'> {
  data: { label: string, value: string }[]
  value?: T extends 'single' ? string : string[]
  onChange?: (value: string | string[]) => void
  name: string
  type: T
  children?: (value: string, item: { label: string, value: string }) => ReactNode
}

export const SearchList = (props: SearchListProps) => {
  const {activeChartIndex, setState, state} = useKChartContext()
  const { data, value, onChange, name, children } = props
  const [searchKey, setSearchKey] = useState('')
  const _onChange = (v: string) => {
    if (props.type === 'single') {
      onChange?.(v === value ? '' : v)
    } else {
      if (!value) onChange?.([v])
      const _value = v as unknown as string[]

      if (!_value.find(vl => vl === v)) {
        onChange?.([..._value, v])
      } else {
        onChange?.(_value.filter(vl => vl !== v))
      }
    }
  }

  const activeState = state[activeChartIndex - 1]

  const list = searchKey ? data.filter(item => item.label.includes(searchKey)) : [...data]

  return (
    <div className="text-sm">
      <Input placeholder="搜索指标" className="border-none placeholder:text-tertiary" value={searchKey} onChange={(e) => setSearchKey(e.target.value)} />
      <div className="border-0 border-b border-t border-solid border-border text-center py-1 bg-background">{name}</div>
      <ScrollArea className="h-[300px]">
        <RadioGroup value={activeState.system} onValueChange={(v) => setState(d => {d.state[activeChartIndex - 1].system = v})}>
          {list.map((ele) => (
            <div
              className="hover:bg-primary cursor-pointer px-2 flex items-center w-full"
              key={ele.value}
              onClick={() => _onChange?.(ele.value)}
              onKeyDown={() => {}}
            >
              <RadioGroupItem value={ele.value} id={`stock-indicator-${ele.value}`} />
              <Label className="ml-2 flex-1 py-3" htmlFor={`stock-indicator-${ele.value}`}>
                {
                  children ? children(value as string, ele) : ele.label
                }
              </Label>
            </div>
          ))}

        </RadioGroup>
      </ScrollArea>
    </div>
  )
} 