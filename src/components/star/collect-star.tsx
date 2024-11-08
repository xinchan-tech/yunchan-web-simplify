import { Checkbox } from "@radix-ui/react-checkbox"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@radix-ui/react-hover-card"
import { Button } from "../ui/button"
import Star from "./index"
import { useCollectCates } from "@/store"
import { useRequest } from "ahooks"
import { getStockCollectCates } from "@/api"


interface CollectStarProps {
  checked: boolean
  code: string
}

const CollectStar = (props: CollectStarProps) => {
  const collects = useCollectCates(s => s.collects)
  const cateQuery = useRequest(getStockCollectCates, {
    cacheKey: getStockCollectCates.cacheKey,
    manual: true,
    defaultParams: [props.code],
  })

  return (
    <HoverCard
      onOpenChange={open => open && cateQuery.run(props.code)}
      openDelay={100}
    >
      <HoverCardTrigger asChild>
        <div><Star checked={props.checked} /></div>
      </HoverCardTrigger>
      <HoverCardContent align="center" side="left" sideOffset={-10}
        className="p-0 w-32"
      >
        <div className="bg-background py-2">加入金池</div>
        <div className="min-h-32 space-y-2">
          {
            collects.map(item => (
              <div key={item.id} className="flex cursor-pointer items-center justify-center space-x-4 hover:bg-primary py-1">
                <Checkbox />
                <span>{item.name}</span>
              </div>
            ))
          }
        </div>
        <div>
          <Button block className="rounded-none">确认</Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}