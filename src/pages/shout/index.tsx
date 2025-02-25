import { getShoutOrders, getTeacherGrades } from "@/api"
import { Avatar, AvatarImage, JknIcon, JknInfiniteArea } from "@/components"
import { useUser } from "@/store"
import { dateToWeek } from "@/utils/date"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { type ComponentRef, useEffect, useMemo, useRef } from "react"

const Shout = () => {
  const userGrades = useUser(s => s.user?.user_grade)
  const teacher = useQuery({
    queryKey: [getTeacherGrades.cacheKey],
    queryFn: () => getTeacherGrades('5')
  })

  const grade = useMemo(() => {
    if(!teacher.data) return
    if(!userGrades?.length) return

    const grades = teacher.data.filter((grade) => grade.type === '5')

    if(!grades.length) return

    const grade = grades.find((grade) => userGrades.includes(grade.id))?.id

    return grade
  }, [teacher.data, userGrades])

  const orders = useInfiniteQuery({
    queryKey: [getShoutOrders.cacheKey],
    queryFn: (params) => {
      if(params.pageParam !== 1){
        console.log(params)
      }
      return getShoutOrders({ grade_id: grade!, page: params.pageParam, limit: 100, direction: 'up' })
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage,_,lastPageParam) => {
      return lastPage.total_pages >= lastPageParam ? lastPageParam + 1 : undefined
    },
    getPreviousPageParam: () => undefined,
    enabled: !!grade,
    select: (data) => {
      return {
        items: data.pages.flatMap((page) => {
          const r = page.items
          r.reverse()
          return r
        })
      }
    }
  })

  const scroll = useRef<ComponentRef<typeof JknInfiniteArea>>(null)
  const scrollCount = useRef(0)
  
  useEffect(() => {
    if(orders.data?.items.length && !scrollCount.current){
      setTimeout(() => {
        scroll.current?.scrollToBottom()
      })

      scrollCount.current++
    }
 
  }, [orders.data])

  return (
    <div className="h-full">
      <JknInfiniteArea className="h-full mx-auto w-[900px] border-0 border-x border-solid border-border overflow-x-hidden" ref={scroll}>
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
      </JknInfiniteArea>
    </div>
  )
}

export default Shout