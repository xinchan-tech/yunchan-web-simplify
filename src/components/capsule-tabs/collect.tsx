import { useQuery, useQueryClient } from "@tanstack/react-query"
import { CapsuleTabs } from "."
import { type ComponentProps, memo, useCallback, useEffect, useState } from "react"
import { getStockCollectCates } from "@/api"
import { useToken } from "@/store"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { JknIcon } from "../jkn/jkn-icon"

interface CollectCapsuleTabsProps extends ComponentProps<typeof CapsuleTabs> {
  onChange?: (key: string) => void
}

const useCollectSelect = (onChange?: (key: string) => void) => {
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


  const _onChange = useCallback((key: string) => {
    setActiveStock(key)
    onChange?.(key)
  }, [onChange])

  return { activeStock, collects, _onChange }

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

interface CollectDropdownMenuProps {
  onChange?: (key: string) => void
  activeKey?: string
}

export const CollectDropdownMenu = memo(({ onChange, ...props }: CollectDropdownMenuProps) => {
  const { collects, _onChange } = useCollectSelect(onChange)

  const activeCollect = collects.data?.find(cate => cate.id === props.activeKey)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center space-x-2">
          <span>{activeCollect?.name ?? '-'}({activeCollect?.total ?? 0})</span>
          <JknIcon.Svg name="arrow-down" size={12} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {
          collects.data?.map((cate) => (
            <DropdownMenuItem key={cate.id} onClick={() => _onChange(cate.id)}>{cate.name}({cate.total})</DropdownMenuItem>
          ))
        }
      </DropdownMenuContent>
    </DropdownMenu>
  )
})