import { AlarmType, PriceAlarmTrigger, getAlarmLogs } from '@/api'
import { useConfig, useTime, useToken } from '@/store'
import { dateToWeek, getLatestTradingDay } from '@/utils/date'
import { cn } from '@/utils/style'
import { type EventResult, wsManager } from '@/utils/ws'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useBoolean } from 'ahooks'
import dayjs from 'dayjs'
import { uid } from 'radash'
import { useEffect, useMemo, useRef } from 'react'
import { JknIcon } from '../jkn/jkn-icon'
import { JknRcTable, type JknRcTableProps } from '../jkn/jkn-rc-table'
import StockView from '../stock-view'
import { Popover, PopoverAnchor, PopoverContent } from '../ui/popover'

export const AiAlarmNotice = () => {
  const [open, { setTrue, setFalse }] = useBoolean(false)
  const getCurrentUsTime = useTime(s => s.getCurrentUsTime)
  const aiAlarmAutoNotice = useConfig(s => s.aiAlarmAutoNotice)
  const setAiAlarmAutoNotice = useConfig(s => s.setAiAlarmAutoNotice)
  const token = useToken(s => s.token)
  const prevDate = getLatestTradingDay(dayjs(getCurrentUsTime()).tz('America/New_York'))
  const lastData = useRef<any[]>([])
  const startData = useMemo(() => prevDate.hour(4).minute(0).second(0).format('YYYY-MM-DD HH:mm:ss'), [prevDate])
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: [getAlarmLogs.cacheKey, 0, startData],
    refetchInterval: 1000 * 60,
    queryFn: () =>
      getAlarmLogs({
        start: startData,
        page: 1,
        limit: 2000
      }),
    enabled: !!token
  })

  useEffect(() => {
    const handler = (e: EventResult<'alarm'>) => {
      const r: ArrayItem<Awaited<ReturnType<typeof getAlarmLogs>>['items']> = {
        alarm_time: e.data.content.alarm_time,
        id: uid(6),
        stock_cycle: `${e.data.content.stock_cycle}`,
        symbol: e.data.content.symbol,
        type: AlarmType.AI,
        condition: {
          ...e.data.content
        }
      }
      queryClient.setQueryData(
        [getAlarmLogs.cacheKey, 0, startData],
        (data: Awaited<ReturnType<typeof getAlarmLogs>>) => {
          return {
            ...data,
            items: [r, ...data.items]
          }
        }
      )
    }

    const unSubscribe = wsManager.on('alarm', handler)

    return () => {
      unSubscribe()
    }
  }, [queryClient, startData])

  const dataByGroup = useMemo(() => {
    return (
      query.data?.items?.reduce(
        (acc, cur) => {
          const group = acc[cur.alarm_time.slice(0, 11)] || []
          group.push(cur)
          acc[cur.alarm_time.slice(0, 11)] = group
          return acc
        },
        {} as Record<string, typeof query.data.items>
      ) ?? {}
    )
  }, [query.data])

  useEffect(() => {
    if (query.isFetched && aiAlarmAutoNotice && query.data?.items?.length) {
      if (lastData.current.length === 0) {
        lastData.current = query.data.items
        setTrue()
      } else {
        const newItems = query.data.items.filter(item => !lastData.current.some(lastItem => lastItem.id === item.id))
        if (newItems.length > 0) {
          lastData.current = query.data.items
          setTrue()
        }
      }
    }
  }, [query.isFetched, aiAlarmAutoNotice, setTrue, query.data?.items])

  const columns = useMemo<JknRcTableProps<Awaited<ReturnType<typeof getAlarmLogs>>['items'][0]>['columns']>(
    () => [
      {
        title: '序号',
        dataIndex: 'id',
        enableSorting: false,
        align: 'center',
        width: 40,
        render: (_, __, index) => <span>{index + 1}</span>
      },
      {
        title: '名称代码',
        dataIndex: 'name',
        render: (_, row) => <StockView name={row.symbol} code={row.symbol} />
      },
      {
        title: '周期',
        dataIndex: 'cycle',
        align: 'center',
        width: 60,
        render: (_, row) => <span>{row.stock_cycle}分</span>
      },
      {
        title: '警报类型',
        dataIndex: 'type',
        align: 'center',
        width: 120,
        render: (_, row) =>
          +row.type === AlarmType.AI ? (
            <span className={cn(row.condition.bull === '1' ? 'text-stock-up' : 'text-stock-down', 'flex items-center')}>
              <JknIcon name={row.condition.bull === '1' ? 'ic_price_up_green' : 'ic_price_down_red'} />
              {row.condition.indicators}
            </span>
          ) : (
            <span
              className={cn(
                row.condition.trigger === PriceAlarmTrigger.UP ? 'text-stock-up' : 'text-stock-down',
                'flex items-center'
              )}
            >
              <JknIcon
                name={row.condition.trigger === PriceAlarmTrigger.UP ? 'ic_price_up_green' : 'ic_price_down_red'}
              />
              <span>{row.condition.trigger === PriceAlarmTrigger.UP ? '涨到' : '跌到'}</span>
              {row.condition.price}
            </span>
          )
      },
      {
        title: '底部类型',
        dataIndex: 'bottom',
        align: 'center',
        width: 70,
        render: (_, row) => <span>{row.condition.category_hdly_name ?? '-'}</span>
      },
      {
        title: '警报时间',
        dataIndex: 'alarm_time',
        align: 'center',
        width: 80,
        render: (_, row) => <span>{row.alarm_time.slice(11)}</span>
      }
    ],
    []
  )

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
              <span>已触发警报</span>
              {query.data?.items && query.data?.items.length > 0 ? (
                <span className="bg-stock-down w-4 h-4 rounded-full text-center leading-4">
                  {query.data.items.length}
                </span>
              ) : null}
            </div>
            <div className="absolute right-2 top-2.5 flex items-center">
              {aiAlarmAutoNotice ? (
                <JknIcon name="checkbox_mult_sel" onClick={() => setAiAlarmAutoNotice(false)} />
              ) : (
                <JknIcon name="checkbox_mult_nor" onClick={() => setAiAlarmAutoNotice(true)} />
              )}
              自动弹出
            </div>
          </div>
          <div className="h-[400px] overflow-y-auto">
            {Object.keys(dataByGroup).map(date => (
              <div key={date}>
                <div className="p-2">
                  {date.slice(5, 10)}
                  &nbsp;
                  {dateToWeek(date)}
                  &nbsp;[美东时间]
                </div>
                <div>
                  <JknRcTable scroll={{ y: 'auto' }} columns={columns} data={dataByGroup[date]} rowKey="id" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
