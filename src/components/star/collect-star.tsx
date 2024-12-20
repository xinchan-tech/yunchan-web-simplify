
import { HoverCard, HoverCardTrigger, HoverCardContent, HoverCardPortal } from "../ui/hover-card"
import { Button } from "../ui/button"
import Star from "./index"
import { useCollectCates } from "@/store"
import { addStockCollectBatch, addStockCollectCate, getStockCollectCates, updateStockCollectCate } from "@/api"
import { AddCollect, Checkbox, ScrollArea, useFormModal } from ".."
import to from "await-to-js"
import { useToast } from "@/hooks"
import { z } from "zod"
import { useZForm } from "@/hooks"
import { GoldenPoolForm } from "@/pages/golden-pool/components/golden-pool-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"


interface CollectStarProps {
  checked: boolean
  code: string
  onUpdate?: (checked: boolean) => void
}

const poolSchema = z.object({
  id: z.string(),
  name: z.string()
})

const CollectStar = (props: CollectStarProps) => {
  const { collects, setCollects } = useCollectCates()
  const queryClient = useQueryClient()
  const cateQuery = useQuery({
    queryKey: [getStockCollectCates.cacheKey, props.code],
    queryFn: () => getStockCollectCates(props.code),
    enabled: false
  })

  const updateCollectMutation = useMutation({
    mutationFn: async (cates: number[]) => {
      props.onUpdate?.(cates.length > 0)

      const [err] = await to(addStockCollectBatch({
        symbol: props.code,
        cate_ids: cates
      }))

      if (err) {
        toast({ description: err.message })
        return
      }
    },
    onMutate: async (cates: number[]) => {
      queryClient.setQueryData([getStockCollectCates.cacheKey, props.code], (s: typeof cateQuery.data) => {
        return s?.map(item => {
          item.active = cates.includes(+item.id) ? 1 : 0
          return item
        })
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [getStockCollectCates.cacheKey, props.code] })
    },
  })

  const { toast } = useToast()

  const onCheck = async (cate: typeof collects[0]) => {
    const cates = cateQuery.data?.filter(item => item.active === 1).map(item => +item.id) ?? []
    if (cates.includes(+cate.id)) {
      cates.splice(cates.indexOf(+cate.id), 1)
    } else {
      cates.push(+cate.id)
    }

    updateCollectMutation.mutate(cates)



    // cateQuery.refresh()

  }

  const form = useZForm(poolSchema, {
    id: '',
    name: ''
  })

  const edit = useFormModal<typeof poolSchema>({
    content: <GoldenPoolForm />,
    title: '新建金池',
    form,
    onOk: async (values) => {
      const [err] = await to(values.id ? updateStockCollectCate(values) : addStockCollectCate(values.name))

      if (err) {
        toast({ description: err.message })
        return
      }
      edit.close()
      getStockCollectCates().then(r => setCollects(r))
    },
    onOpen: () => {
    }
  })

  return (
    <div className="">
      <HoverCard
        onOpenChange={open => open && cateQuery.refetch()}
        openDelay={100}
        closeDelay={0}
      >
        <HoverCardTrigger asChild>
          <div className="flex justify-center items-center"><Star checked={props.checked} /></div>
        </HoverCardTrigger>
        <HoverCardPortal>
          <HoverCardContent align="center" side="left" sideOffset={-10}
            className="p-0 w-48 bg-muted z-20 border-dialog-border border border-solid"
          >
            <div className="bg-background py-2 text-center">加入金池</div>
            <ScrollArea className="h-[240px] space-y-2 ">
              {
                collects.map(item => (
                  <div key={item.id} onClick={() => onCheck(item)} onKeyDown={() => { }} className="flex cursor-pointer items-center pl-4 space-x-4 hover:bg-primary py-1">
                    {
                      <Checkbox checked={cateQuery.data?.some(cate => cate.id === item.id && cate.active === 1)} />
                    }
                    <span>{item.name}</span>
                  </div>
                ))
              }
            </ScrollArea>
            <div className="w-full">
              <AddCollect sideOffset={-100}>
                <Button block className="rounded-none w-48">
                  新建金池
                </Button>
              </AddCollect>

            </div>
          </HoverCardContent>
        </HoverCardPortal>
      </HoverCard>
    </div>
  )
}

export default CollectStar