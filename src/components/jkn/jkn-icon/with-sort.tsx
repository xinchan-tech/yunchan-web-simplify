import type { ComponentType } from "react"
import { JknIcon } from "."

type SortProps = {
  sort?: 'asc' | 'desc'
  /**
   * 排序字段
   */
  field: string
  /**
   * 点击事件
   */
  onSort: (field: string, sort: 'asc' | 'desc' | undefined) => void
}

const SortUp = () => <JknIcon name="ic_btn_up" className="w-1.5 h-3 align-middle" />
const SortDown = () => <JknIcon name="ic_btn_down" className="w-1.5 h-3 align-middle" />
const SortNone = () => <JknIcon name="ic_btn_nor" className="w-1.5 h-3 align-middle" />

export const withSort = <T = any>(Component: ComponentType<T>) => {
  return ({ field, onSort, sort, ...props }: SortProps & T) => {

    const onClick = () => {
      if (sort === 'asc') {
        onSort(field, 'desc')
      } else if (sort === 'desc') {
        onSort(field, undefined)
      } else {
        onSort(field, 'asc')
      }
    }

    return (
      <div className="block items-center" onClick={onClick} onKeyDown={() => { }}>
        <Component {...(props as any)} />
        <span className="ml-1 align-top box-border"  >
          {sort ? ({
            asc: <SortUp />,
            desc: <SortDown />,
          }[sort]) : <SortNone />
          }
        </span>
      </div>
    )
  }
}
