import { addStockCollectCate } from "@/api"
import { Button, Input, Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components"
import { useToast } from "@/hooks"
import { useCollectCates } from "@/store"
import { useMutation } from "@tanstack/react-query"
import { nanoid } from "nanoid"
import { useState } from "react"

interface AddCollectProps {
  children: React.ReactNode
  sideOffset?: number
  alignOffset?: number
}

export const AddCollect = ({ children, sideOffset, alignOffset }: AddCollectProps) => {
  const { collects, refresh, setCollects } = useCollectCates()
  const [name, setName] = useState<string>()
  const { toast } = useToast()
  const addMutation = useMutation({
    mutationFn: async (name: string) => addStockCollectCate(name),
    onMutate: async (name: string) => {
      const previous = [...collects]

      if (previous) {
        setCollects([...previous, { name, id: nanoid(), create_time: new Date().valueOf().toString(), total: '0', active: 0 }])
      }

      return { previous }
    },
    onError: (err, _, context) => {
      if (context?.previous) {
        setCollects(context.previous)
      }

      if (err) {
        toast({ description: err.message })
      }
    },

    onSettled: () => {
      refresh()
    }
  })

  const onAdd = () => {
    if (!name) return

    addMutation.mutate(name)
  }


  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button reset className="inline">
          {
            children
          }
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