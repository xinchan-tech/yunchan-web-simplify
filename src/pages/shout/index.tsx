import { getShoutOrders } from "@/api"
import { ScrollArea } from "@/components"
import { useQuery } from "@tanstack/react-query"

const Shout = () => {
  const orders = useQuery({
    queryKey: [getShoutOrders.cacheKey],
    queryFn: () => getShoutOrders({
      grade_id: '24',
      limit: 1,
      id: 659,
      direction: 'up'
    })
  })
  return (
    <div className="h-full">
      <ScrollArea className="h-full mx-auto w-[900px] border-0 border-x border-solid border-border">
      </ScrollArea>
    </div>
  )
}

export default Shout