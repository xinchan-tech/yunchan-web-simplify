import { AddCollect, Button, JknCheckbox, Popover, PopoverAnchor, PopoverContent } from ".."
import { addStockCollect, getStockCollectCates } from "@/api"
import to from "await-to-js"
import { useToast } from "@/hooks"
import { useRef, type PropsWithChildren } from "react"
import type { CheckboxProps } from "@radix-ui/react-checkbox"
import { useQuery } from "@tanstack/react-query"
import { useBoolean } from "ahooks"

interface CollectStarBatchProps {
  checked: string[]
  onCheckChange: CheckboxProps['onCheckedChange']
  onUpdate?: (checked: boolean) => void
}

export const CollectStarBatch = (props: CollectStarBatchProps) => {
  return (
    <CollectStarBatchPopover open={props.checked.length > 0} onCheckChange={props.onCheckChange}>
      <CollectStarBatchContent checked={props.checked} onUpdate={props.onUpdate} />
    </CollectStarBatchPopover>
  )
}

const CollectStarBatchPopover = (props: PropsWithChildren<{ open: boolean, onCheckChange: CheckboxProps['onCheckedChange'] }>) => {
  return (
    <Popover open={props.open}>
      <PopoverAnchor asChild>
        <div className="inline-flex items-center justify-center h-full">
          <JknCheckbox
            className="w-[15px] h-[15px]"
            checked={props.open}
            onCheckedChange={props.onCheckChange}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent className="w-60" align="start" side="left">
        {
          props.children
        }
      </PopoverContent>
    </Popover>
  )
}

interface CollectStarBatchContentProps {
  checked: string[]
  onUpdate?: (checked: boolean) => void
}

const CollectStarBatchContent = (props: CollectStarBatchContentProps) => {
  const [confirmModalOpen, confirmAction] = useBoolean(false)
  const selectCollect = useRef<number | undefined>()
  const collects = useQuery({
    queryKey: [getStockCollectCates.cacheKey],
    queryFn: () => getStockCollectCates(),
  })

  const { toast } = useToast()

  const updateCollectMutation = async (cates: number[]) => {
    // props.onUpdate?.(cates.length > 0)

    const [err] = await to(addStockCollect({
      symbols: props.checked,
      cate_ids: cates
    }))

    if (err) {

      toast({
        description: err.message,
      })
      return
    }
    props.onUpdate?.(false)
    confirmAction.setFalse()
    toast({
      description: '添加成功',
    })

    return
  }

  const handleSelectCollect = (cateId: number) => {
    selectCollect.current = cateId
    confirmAction.setTrue()
  }

  return (
    <div className="rounded relative">
      <div className="bg-background text-center py-2">批量操作 {props.checked.length} 项</div>
      <div className="text-center px-4 py-4 space-y-4 min-h-24 max-h-48 overflow-y-auto">
        {
          collects.data?.map((cate) => (
            <div key={cate.id} className="flex space-x-2 items-center justify-between">
              <div>{cate.name}</div>
              <div onClick={() => handleSelectCollect(+cate.id)} onKeyDown={() => { }}>
                <Button size="mini">添加</Button>
              </div>
            </div>
          ))
        }
      </div>
      {
        confirmModalOpen ? (
          <div className="absolute bottom-0 left-0 top-0 right-0 bg-background/60">
            <div className="text-center flex flex-col justify-center h-full space-y-4">
              <div>确定操作?</div>
              <div className="flex justify-center space-x-4">
                <Button size="mini" onClick={() => selectCollect.current && updateCollectMutation([selectCollect.current])}>确定</Button>
                <Button size="mini" variant="text" onClick={confirmAction.setFalse}>取消</Button>
              </div>
            </div>
          </div>
        ) : null
      }
    </div>
  )
}