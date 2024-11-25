import { useBoolean, useMount } from "ahooks"
import JknIcon from "../jkn/jkn-icon"
import { Popover, PopoverAnchor, PopoverContent } from "../ui/popover"
import { useConfig, useTime } from "@/store"
import { dateToWeek, getPrevTradingDay } from "@/utils/date"
import dayjs from "dayjs"
import { useQuery } from "@tanstack/react-query"
import { getAlarmLogs } from "@/api"
import { useEffect, useMemo } from "react"
import JknTable, { type JknTableProps } from "../jkn/jkn-table"
import StockView from "../stock-view"
import { ScrollArea } from "../ui/scroll-area"
import { cn } from "@/utils/style"

export const AiAlarmNotice = () => {
  const [open, { setTrue, setFalse }] = useBoolean(false)
  const time = useTime()
  const config = useConfig()
  const prevDate = getPrevTradingDay(dayjs(time.usTime).tz('America/New_York'))
  const query = useQuery({
    queryKey: [getAlarmLogs.cacheKey, 0, prevDate.format('YYYY-MM-DD')],
    queryFn: () => getAlarmLogs({
      start: prevDate.format('YYYY-MM-DD'),
      page: 1,
      type: 0,
      limit: 2000
    })
  })

  const dataByGroup = (() => {
    return query.data?.items?.reduce((acc, cur) => {
      const group = acc[cur.alarm_time.slice(0, 11)] || []
      group.push(cur)
      acc[cur.alarm_time.slice(0, 11)] = group
      return acc
    }, {} as Record<string, typeof query.data.items>) ?? {}
  })()

  useEffect(() => {
    if(query.isFetched && config.aiAlarmAutoNotice){
      setTrue()
    }
  }, [query.isFetched, config.aiAlarmAutoNotice, setTrue])

  const columns = useMemo<JknTableProps<Awaited<ReturnType<typeof getAlarmLogs>>['items'][0]>['columns']>(() => [
    {
      header: '序号', accessorKey: 'id', enableSorting: false, meta: { align: 'center', width: 40 },
      cell: ({ row }) => (
        <span>{row.index + 1}</span>
      )
    },
    {
      header: '名称代码', accessorKey: 'name', enableSorting: false,
      cell: ({ row }) => (
        <StockView name={row.getValue('name')} code={row.original.symbol} />
      )
    }, {
      header: '周期', accessorKey: 'cycle', enableSorting: false, meta: { align: 'center', width: 60 },
      cell: ({ row }) => (
        <span>{row.original.stock_cycle}分</span>
      )
    }, {
      header: '报警类型', accessorKey: 'type', enableSorting: false, meta: { align: 'center', width: 100 },
      cell: ({ row }) => (
        <span className={cn(row.original.condition.bull === '1' ? 'text-stock-up' : 'text-stock-down', 'flex items-center')}>
          <JknIcon name={row.original.condition.bull === '1' ? 'ic_price_up_green' : 'ic_price_down_red'} />
          {row.original.condition.indicators}
        </span>
      )
    }, {
      header: '底部类型', accessorKey: 'bottom', enableSorting: false, meta: { align: 'center', width: 70 },
      cell: ({ row }) => (
        <span>{row.original.condition.category_hdly_name ?? '-'}</span>
      )
    }, {
      header: '报警时间', accessorKey: 'alarm_time', enableSorting: false, meta: { align: 'center', width: 80 },
      cell: ({ row }) => (
        <span>{row.original.alarm_time.slice(11)}</span>
      )
    }
  ], [])

  return (
    <Popover open={open} onOpenChange={v => !v && setFalse()}>
      <PopoverAnchor>
        <JknIcon className="w-10 h-10" name="ic_alarm" onClick={setTrue} />
      </PopoverAnchor>
      <PopoverContent align="end" side="left" className="w-[512px]" alignOffset={30}>
        <div className="text-sm">
          <div className="relative h-10 border-0 border-b border-solid border-border">
            <JknIcon name="minimize" className="h-4 w-4 absolute left-2 top-3" onClick={setFalse} />
            <div className="flex items-center justify-center w-full h-full space-x-2">
              <JknIcon name="ic_alarm" className="h-6 w-6" />
              <span>已触发报警</span>
              {
                query.data?.items && query.data?.items.length > 0 ? (
                  <span className="bg-stock-down w-4 h-4 rounded-full text-center leading-4">1</span>
                ): null
              }
            </div>
            <div className="absolute right-2 top-2.5 flex items-center">
              {
                config.aiAlarmAutoNotice ? <JknIcon name="checkbox_mult_sel" onClick={() => config.setAiAlarmAutoNotice(false)} /> : <JknIcon name="checkbox_mult_nor" onClick={() => config.setAiAlarmAutoNotice(true)} />
              }
              自动弹出
            </div>
          </div>
          <ScrollArea className="h-[400px]">
            {
              Object.keys(dataByGroup).map(date => (
                <div key={date}>
                  <div className="p-2">
                    {date.slice(5, 10)}
                    &nbsp;
                    {dateToWeek(date)}
                    &nbsp;[美东时间]
                  </div>
                  <div>
                    <JknTable
                      columns={columns}
                      data={dataByGroup[date]}
                      rowKey="id"
                    />
                  </div>
                </div>
              ))
            }
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}