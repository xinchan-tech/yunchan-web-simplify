import { useCollectCates } from "@/store"
import { CapsuleTabs } from "."
import { useMount } from "ahooks"
import { type ComponentProps, useState } from "react"

interface CollectCapsuleTabsProps extends ComponentProps<typeof CapsuleTabs> {
  onChange?: (key: string) => void
}

export const CollectCapsuleTabs = ({onChange, ...props}: CollectCapsuleTabsProps) => {
  const { refresh, collects } = useCollectCates()
  const [activeStock, setActiveStock] = useState<string>('1')

  useMount(() => {
    refresh()
  })

  const _onChange = (key: string) => {
    setActiveStock(key)
    onChange?.(key)
  }

  return (
    <CapsuleTabs activeKey={activeStock} onChange={_onChange} {...props}>
      {
        collects.map((cate) => (
          <CapsuleTabs.Tab
            key={cate.id}
            label={
              <span>{cate.name}({cate.total})</span>
            }
            value={cate.id} />
        ))
      }
    </CapsuleTabs>
  )
}