import { addStockCollectCate, getStockCollectCates } from "@/api"
import { Button, Input, Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components"
import { useAuthorized, useToast } from "@/hooks"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { nanoid } from "nanoid"
import { type MouseEventHandler, useState } from "react"

interface AddCollectProps {
  children: React.ReactNode
  sideOffset?: number
  alignOffset?: number
}

export const AddCollect = ({ children, sideOffset, alignOffset }: AddCollectProps) => {
  const [name, setName] = useState<string>()
  const { toast } = useToast()
  const collects = useQuery({
    queryKey: [getStockCollectCates.cacheKey],
    queryFn: () => getStockCollectCates(),

  })
  const queryClient = useQueryClient()
  const addMutation = useMutation({
    mutationFn: async (name: string) => addStockCollectCate(name),
    onMutate: async (name: string) => {
      const previous = collects.data

      if (previous) {
        queryClient.setQueryData([getStockCollectCates.cacheKey], (old: any) => {
          return [
            ...old,
            {
              id: nanoid(),
              name,
              create_time: '',
              active: 1,
              total: '0'
            }
          ]
        })
      }

      return { previous }
    },
    onError: (err, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData([getStockCollectCates.cacheKey], context.previous)
      }

      if (err) {
        toast({ description: err.message })
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [getStockCollectCates.cacheKey]
      })
    }
  })

  const onAdd = () => {
    if (!name) return

    addMutation.mutate(name)
  }

  const [auth, toastNotAuth] = useAuthorized('stockPoolNum')

  const _onClick: MouseEventHandler<HTMLDivElement> = (e) => {
    const max = auth()
    if (!max || max <= (collects.data?.length ?? 0)) {
      toastNotAuth()
      e.preventDefault()
      e.stopPropagation()
      return
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button reset className="inline">
          <div onClick={_onClick} onKeyDown={() => { }}>
            {
              children
            }
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 text-center" sideOffset={sideOffset} alignOffset={alignOffset}>
        <div className="bg-background text-center py-2">新建金池</div>
        <div className="px-4">
          <Input size="sm" placeholder="输入金池名称" onChange={e => setName(e.target.value)} />
          <PopoverClose asChild>
            <Button size="sm" className="w-16 my-4" onClick={onAdd}>确定</Button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  )
}