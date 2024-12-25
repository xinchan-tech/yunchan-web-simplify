import { getShoutOrders } from "@/api"
import { Avatar, AvatarImage, JknIcon, ScrollArea } from "@/components"
import { useUser } from "@/store"
import { dateToWeek } from "@/utils/date"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"

const Shout = () => {
  const { user } = useUser()
  const orders = useQuery({
    queryKey: [getShoutOrders.cacheKey],
    queryFn: () => getShoutOrders({
      grade_id: '24',
      limit: 10
    })
  })

  return (
    <div className="h-full">
      <ScrollArea className="h-full mx-auto w-[900px] border-0 border-x border-solid border-border overflow-x-hidden">
        <div className="px-4 w-full">
          {
            orders.data?.items.map((order: any) => (
              <div key={order.id}>
                <div className="text-center text-xs flex items-center justify-center text-tertiary">
                  <div className="w-1/5 h-0 border-0 border-b border-solid border-b-border mr-2" />
                  <JknIcon name="ic_us" className="mr-2 w-3 h-3" />
                  美东时间&nbsp;
                  {dayjs(order.create_time * 1000).tz('America/New_York').format('MM-DD')}&nbsp;
                  {dateToWeek(dayjs(+order.create_time * 1000).tz('America/New_York'))}&nbsp;
                  {dayjs(+order.create_time * 1000).tz('America/New_York').format('HH:mm')}
                  <div className="w-1/5 h-0 border-0 border-b border-solid border-b-border ml-2" />
                </div>
                <div className="flex mt-4 mb-8 w-full">
                  <Avatar className="w-8 h-8 mr-4">
                    <AvatarImage src={order.teacher.avatar} alt={order.teacher.name} />
                  </Avatar>
                  <div className="bg-[#00b44c] p-4 max-w-[760px] text-black rounded flex-1 relative">
                    <pre className="w-full break-all whitespace-pre-wrap text-base">
                      {order.content}
                    </pre>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </ScrollArea>
    </div>
  )
}

export default Shout