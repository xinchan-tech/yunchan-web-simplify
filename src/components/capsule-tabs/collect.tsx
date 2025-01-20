import { useQuery, useQueryClient } from "@tanstack/react-query"
import { CapsuleTabs } from "."
import { type ComponentProps, useEffect, useState } from "react"
import { getStockCollectCates } from "@/api"
import { useToken } from "@/store"

interface CollectCapsuleTabsProps extends ComponentProps<typeof CapsuleTabs> {
  onChange?: (key: string) => void
}

export const CollectCapsuleTabs = ({ onChange, ...props }: CollectCapsuleTabsProps) => {
  const [activeStock, setActiveStock] = useState<string>('1')
  const token = useToken(s => s.token)
  const collects = useQuery({
    queryKey: [getStockCollectCates.cacheKey],
    queryFn: () => getStockCollectCates(),
    initialData: [{ id: '1', name: '股票金池', create_time: '', active: 1, total: '0' }],
    enabled: !!token
  })
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!token) {
      queryClient.setQueryData([getStockCollectCates.cacheKey], [{ id: '1', name: '股票金池', create_time: '', active: 1, total: '0' }])
    }
  }, [token, queryClient.setQueryData])




  const _onChange = (key: string) => {
    setActiveStock(key)
    onChange?.(key)
  }

  return (
    <CapsuleTabs activeKey={activeStock} onChange={_onChange} {...props}>
      {
        collects.data?.map((cate) => (
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