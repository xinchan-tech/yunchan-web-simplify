import { Button, Checkbox, JknCheckbox, Popover, PopoverAnchor, PopoverContent } from ".."
import { useCollectCates } from "@/store"
import { addStockCollect } from "@/api"
import to from "await-to-js"
import { useToast } from "@/hooks"
import type { PropsWithChildren } from "react"
import type { CheckboxProps } from "@radix-ui/react-checkbox"

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
        <Button reset className="w-auto h-auto">
          <JknCheckbox
            className="w-[17px] h-[17px]"
            checked={props.open}
            onCheckedChange={props.onCheckChange}
          />
        </Button>
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
  const { collects } = useCollectCates()

  const { toast } = useToast()
  const updateCollectMutation = async (cates: number[]) => {
    props.onUpdate?.(cates.length > 0)

    const [err] = await to(addStockCollect({
      symbols: props.checked,
      cate_ids: cates
    }))

    if (err) {
      props.onUpdate?.(false)
      toast({
        description: err.message,
      })
      return
    }

    return
  }

  return (
    <div className="rounded">
      <div className="bg-background px-16 py-2">批量操作 {props.checked.length} 项</div>
      <div className="text-center px-12 py-4 space-y-4">
        {
          collects.map((cate) => (
            <div key={cate.id} className="flex space-x-2 items-center">
              <div>{cate.name}</div>
              <div onClick={() => updateCollectMutation([+cate.id])} onKeyDown={() => { }}>
                <Button className="text-tertiary" size="mini" variant="outline">添加</Button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}