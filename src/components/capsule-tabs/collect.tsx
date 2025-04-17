import { getStockCollectCates } from '@/api'
import { useToken } from '@/store'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { type ComponentProps, memo, useCallback, useEffect, useState } from 'react'
import { CapsuleTabs } from '.'
import { JknIcon } from '../jkn/jkn-icon'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { ScrollArea } from '../ui/scroll-area'

interface CollectCapsuleTabsProps extends ComponentProps<typeof CapsuleTabs> {
  onChange?: (key: string) => void
}

const useCollectSelect = (onChange?: (key: string) => void) => {
  const [activeStock, setActiveStock] = useState<Nullable<string>>('-1')
  const token = useToken(s => s.token)
  const collects = useQuery({
    queryKey: [getStockCollectCates.cacheKey],
    queryFn: () => getStockCollectCates(),
    initialData: [
      {
        id: '-1',
        name: '我的自选',
        create_time: '',
        active: 0,
        total: '0',
        is_default: true,
        sort: 0
      }
    ],
    enabled: !!token
  })
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!token) {
      queryClient.setQueryData(
        [getStockCollectCates.cacheKey],
        [
          {
            id: '-1',
            name: '我的自选',
            create_time: '',
            active: 0,
            total: '0',
            is_default: true,
            sort: 0
          }
        ]
      )
      setActiveStock('-1')
    }
  }, [token, queryClient.setQueryData])

  useEffect(() => {
    if (collects.data?.length && activeStock === '-1') {
      let defaultCate = collects.data.find(cate => cate.is_default)
      if (!defaultCate) {
        defaultCate = collects.data[0]
      }
      setActiveStock(defaultCate.id)
      onChange?.(defaultCate.id)
    }
  }, [collects.data, onChange, activeStock])

  const _onChange = useCallback(
    (key: string) => {
      setActiveStock(key)
      onChange?.(key)
    },
    [onChange]
  )

  return { activeStock, collects, _onChange }
}

export const CollectCapsuleTabs = ({ onChange, ...props }: CollectCapsuleTabsProps) => {
  const { activeStock, collects, _onChange } = useCollectSelect(onChange)
  return (
    <CapsuleTabs activeKey={activeStock ?? ''} onChange={_onChange} {...props}>
      {collects.data?.map(cate => (
        <CapsuleTabs.Tab
          key={cate.id}
          label={
            <span>
              {cate.name}({cate.total})
            </span>
          }
          value={cate.id}
        />
      ))}
    </CapsuleTabs>
  )
}

interface CollectDropdownMenuProps {
  onChange?: (key: string) => void
  activeKey?: string
  count?: number
}

export const CollectDropdownMenu = memo(({ onChange, count, ...props }: CollectDropdownMenuProps) => {
  const { collects, _onChange } = useCollectSelect(onChange)

  const activeCollect = collects.data?.find(cate => cate.id === props.activeKey)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center space-x-2 px-3 py-2.5 text-lg font-bold font-pingfang">
          <span>
            {activeCollect?.name ?? '-'}({count ?? activeCollect?.total ?? 0})
          </span>
          <JknIcon.Svg name="arrow-down" size={12} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <ScrollArea style={{ height: collects.data?.length > 9 ? 320 : 'auto' }}>
          {collects.data?.map(cate => (
            <DropdownMenuItem key={cate.id} onClick={() => _onChange(cate.id)}>
              {cate.name}({cate.total})
            </DropdownMenuItem>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
