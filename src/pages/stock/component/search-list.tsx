import { Input, JknIcon, Label, RadioGroup, RadioGroupItem, ScrollArea } from "@/components"
import { useToast } from "@/hooks"
import { useState, type ReactNode } from "react"

interface BaseSearchListProps {
  data: { label: string, value: string, extra: NormalizedRecord, notAuthorized?: boolean }[]
  name: string
  search?: boolean
  children?: (value: string, item: { label: string, value: string }) => ReactNode
}

interface SingleSearchListProps extends BaseSearchListProps {
  type: 'single'
  value?: string
  onChange?: (value: string, data: ArrayItem<BaseSearchListProps['data']>, name: string) => void
}

interface MultiSearchListProps extends BaseSearchListProps {
  type: 'multi'
  value?: string[]
  onChange?: (value: string[], data: ArrayItem<BaseSearchListProps['data']>, name: string) => void
}

type SearchListProps<T extends 'single' | 'multi'> = T extends 'single'
  ? SingleSearchListProps
  : MultiSearchListProps

export const SearchList = <T extends 'single' | 'multi'>(props: SearchListProps<T>) => {
  const { data, value, onChange, name, children } = props
  const [searchKey, setSearchKey] = useState('')
  const { toast } = useToast()

  const _onChange = (v: string, data: ArrayItem<BaseSearchListProps['data']>, event: React.ChangeEvent<any>) => {
    event.stopPropagation()
    event.preventDefault()

    if (data.notAuthorized) {
      toast({
        description: '暂无相关权限，请联系客服'
      })
      return
    }

    if (props.type === 'single') {
      onChange?.(v === value ? '' : v as any, data as any, data.label)
    } else {
      onChange?.(v === value ? '' : v as any, data as any, data.label)
    }
  }

  const list = searchKey ? data.filter(item => item.label.includes(searchKey)) : [...data]

  const checked = (v: string) => {
    if (props.type === 'single') {
      return v === value
    }
    return value?.includes(v)
  }

  return (
    <div className="text-sm">
      {
        props.search !== false ? (
          <Input placeholder="搜索指标" className="border-none placeholder:text-tertiary" value={searchKey} onChange={(e) => setSearchKey(e.target.value)} />
        ) : null
      }
      <div className="border-0 border-b border-t border-solid border-border text-center py-1 bg-background">{name}</div>
      <ScrollArea className="h-[300px]">
        <RadioGroup>
          {list.map((ele) => (
            <div
              className="hover:bg-primary cursor-pointer px-2 flex items-center w-full"
              key={ele.value}
              onClick={(e) => _onChange(ele.value, ele, e)}
              onKeyDown={() => { }}
            >
              <RadioGroupItem value={ele.value} checked={checked(ele.value)} id={`stock-indicator-${ele.value}`} />
              <Label className="ml-2 flex-1 py-3" htmlFor={`stock-indicator-${ele.value}`}>
                {
                  children ? children(value as string, ele) : ele.label
                }
                {
                  ele.notAuthorized ? (
                    <JknIcon name="ic_lock" className="w-3 h-3 ml-1 rounded-none" />
                  ) : null
                }
              </Label>
            </div>
          ))}

        </RadioGroup>
      </ScrollArea>
    </div>
  )
} 