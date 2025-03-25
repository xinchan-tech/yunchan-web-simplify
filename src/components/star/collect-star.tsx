import { addStockCollectBatch, getStockCollectCates } from '@/api'
import { usePropValue, useToast } from '@/hooks'
import type { HoverCardContentProps } from '@radix-ui/react-hover-card'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useBoolean, useMemoizedFn } from 'ahooks'
import { produce } from 'immer'
import { memo } from 'react'
import { AddCollect, Checkbox, ScrollArea } from '..'
import { HoverCard, HoverCardContent, HoverCardPortal, HoverCardTrigger } from '../ui/hover-card'
import { CollectStarBatch } from './collect-star-batch'
import Star from './index'

interface CollectStarProps
  extends Partial<Pick<HoverCardContentProps, 'sideOffset' | 'alignOffset' | 'side' | 'align'>> {
  checked: boolean
  code: string
  onUpdate?: (checked: boolean) => void
}

const _CollectStar = memo((props: CollectStarProps) => {
  const [render, { setTrue, setFalse }] = useBoolean()
  const [checked, setChecked] = usePropValue(props.checked)

  const _onUpdate = useMemoizedFn((checked: boolean) => {
    setChecked(checked)
    props.onUpdate?.(checked)
  })

  return (
    <HoverCard onOpenChange={open => (open ? setTrue() : setFalse())} openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className="flex justify-center items-center">
          <Star checked={checked} />
        </div>
      </HoverCardTrigger>
      <HoverCardPortal>
        <HoverCardContent
          sideOffset={props.sideOffset ?? 10}
          alignOffset={props.alignOffset ?? -50}
          align={props.align ?? 'start'}
          side={props.side ?? 'left'}
          className="p-0 w-48 bg-muted border-dialog-border border border-solid"
        >
          {render ? <CollectList code={props.code} onUpdate={_onUpdate} /> : null}
        </HoverCardContent>
      </HoverCardPortal>
    </HoverCard>
  )
})

interface CollectListProps {
  code: string
  onUpdate?: (checked: boolean) => void
}

const CollectList = (props: CollectListProps) => {
  const queryClient = useQueryClient()
  const cateQuery = useQuery({
    queryKey: [getStockCollectCates.cacheKey, props.code],
    queryFn: () => getStockCollectCates(props.code),
    initialData: [{ id: '1', name: '股票金池', create_time: '', active: 0, total: '0' }]
  })

  const updateCollectMutation = useMutation({
    mutationFn: (cates: number[]) => {
      props.onUpdate?.(cates.length > 0)

      return addStockCollectBatch({
        symbol: props.code,
        cate_ids: cates
      })
    },
    onMutate: async (cates: number[]) => {
      await queryClient.cancelQueries({ queryKey: [getStockCollectCates.cacheKey, props.code] })

      const previous = queryClient.getQueryData([getStockCollectCates.cacheKey, props.code])

      if (previous) {
        queryClient.setQueryData([getStockCollectCates.cacheKey, props.code], (s: typeof cateQuery.data) => {
          return s?.map(
            produce(draft => {
              draft.active = cates.includes(+draft.id) ? 1 : 0
            })
          )
        })
      }

      return { previous }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [getStockCollectCates.cacheKey, props.code] })
    },
    onError: (err, _, context) => {
      toast({ description: err.message })
      if (context?.previous) {
        queryClient.setQueryData([getStockCollectCates.cacheKey, props.code], context.previous)
        props.onUpdate?.((context.previous as any).some((item: any) => item.active === 1))
      }
    }
  })

  const { toast } = useToast()

  const onCheck = async (cate: (typeof cateQuery)['data'][0]) => {
    const cates = cateQuery.data?.filter(item => item.active === 1).map(item => +item.id) ?? []
    if (cates.includes(+cate.id)) {
      cates.splice(cates.indexOf(+cate.id), 1)
    } else {
      cates.push(+cate.id)
    }

    updateCollectMutation.mutate(cates)
  }

  return (
    <>
      <div className="bg-background py-2 text-center">加入金池</div>
      <ScrollArea className="h-[240px] space-y-2 ">
        {cateQuery.data?.map(item => (
          <div
            key={item.id}
            onClick={() => onCheck(item)}
            onKeyDown={() => {}}
            className="flex cursor-pointer items-center pl-4 space-x-4 hover:bg-primary py-1"
          >
            {<Checkbox checked={item.active === 1} />}
            <span>{item.name}</span>
          </div>
        ))}
      </ScrollArea>
      <div className="w-full">
        <AddCollect sideOffset={-100}>
          <div className="rounded-none w-48 bg-primary h-10 leading-10">新建金池</div>
        </AddCollect>
      </div>
    </>
  )
}

const CollectStar = _CollectStar as typeof _CollectStar & {
  Batch: typeof CollectStarBatch
}

CollectStar.Batch = CollectStarBatch

export default CollectStar
