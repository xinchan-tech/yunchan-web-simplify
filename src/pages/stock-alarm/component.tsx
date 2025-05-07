import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, JknIcon, Separator } from "@/components"
import { useState, type ReactNode } from "react"
import { Fragment } from "react/jsx-runtime"

export interface SortButtonProps {
  list: { label: string; order: 'asc' | 'desc'; field: string }[]
  onChange: (params: { order: 'asc' | 'desc'; orderBy: string }) => void
}

export const SortButton = ({ list, onChange }: SortButtonProps) => {
  const [order, setOrder] = useState<{ order: 'asc' | 'desc'; orderBy: string }>({ order: 'desc', orderBy: '' })

  const onSort = (item: { order: 'asc' | 'desc'; field: string }) => {
    setOrder({ order: item.order, orderBy: item.field })
    onChange({ order: item.order, orderBy: item.field })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span className="inline-flex">
          <JknIcon.Svg
            name={order.order === 'asc' ? 'sort-asc' : 'sort'}
            className="mr-2 cursor-pointer rounded p-1 hover:bg-accent"
            size={18}
          />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {list.map((item, index, arr) => (
          <Fragment key={item.field}>
            <DropdownMenuItem
              data-checked={order.order === item.order && order.orderBy === item.field}
              key={item.field}
              onClick={() => onSort(item)}
            >
              <JknIcon.Svg name={item.order === 'asc' ? 'sort-asc' : 'sort'} size={18} />
              {item.label}
            </DropdownMenuItem>
            {index !== arr.length - 1 && index !== 0 && index % 2 === 1 ? <Separator /> : null}
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface GroupAreaProps {
  title: ReactNode
  children: ReactNode
}

export const GroupArea = ({ title, children }: GroupAreaProps) => {
  return (
    <div className="border-0 border-b border-solid border-[#3D3D3D] w-full box-border text-foreground">
      <div className="text-left py-2 pl-5 sticky top-0 bg-[#0F0F0F] " style={{ zIndex: 1 }}>{title}</div>
      <div className="relative" style={{zIndex: 0}}>{children}</div>
    </div>
  )
}
