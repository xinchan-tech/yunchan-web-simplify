import { getAlarmLogsList, deleteAlarmLog, clearAlarmLogs, AlarmType, PriceAlarmTrigger, markAlarmLogRead, getAlarmLogUnreadCount } from "@/api"
import { JknAlert, JknIcon, JknInfiniteArea, Separator, Star } from "@/components"
import { useToast } from "@/hooks"
import { StockChartInterval, useConfig } from "@/store"
import { dateUtils } from "@/utils/date"
import { useAppEvent } from "@/utils/event"
import { stockUtils } from "@/utils/stock"
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import to from "await-to-js"
import Decimal from "decimal.js"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { type SortButtonProps, GroupArea, SortButton } from "./component"
import { group, listify } from "radash"
import { cn } from "@/utils/style"

type AlarmRecordItemType = ArrayItem<Awaited<ReturnType<typeof getAlarmLogsList>>['items']>

export const StockAlarmRecordList = () => {
  const [sort, setSort] = useState({ order: '', orderBy: '' })
  const total = useRef(0)
  const queryClient = useQueryClient()
  const alarmQuery = useInfiniteQuery({
    queryKey: [getAlarmLogsList.cacheKey, sort],
    queryFn: async ({ pageParam = 0 }) =>
      getAlarmLogsList({ page: pageParam, limit: 20, order: sort.order as any, order_by: sort.orderBy }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _, lastPageParam) =>
      lastPage.total_pages > lastPageParam ? lastPageParam + 1 : undefined,
    getPreviousPageParam: () => undefined,
    select: data => {
      let index = 0
      total.current = data.pages[0]?.total_items ?? 0
      return data.pages.flatMap(p => p.items?.map(item => ({ ...item, index: index++ })) ?? [])
    }
  })

  const { toast } = useToast()

  const dataGroupBy = useMemo(() => {
    const groupBy = group(alarmQuery.data ?? [], item => {
      return dateUtils.toUsDay(item.alarm_time).format('YYYY-MM-DD')
    })

    return listify(groupBy, (k, v) => ({ list: v, key: k }))
  }, [alarmQuery.data])

  useEffect(() => {
    const unRead = alarmQuery.data?.filter(item => item.is_read === 0).map(item => item.id) ?? []

    if (unRead.length > 0) {
      markAlarmLogRead(unRead).then(() => {
        queryClient.refetchQueries({
          queryKey: [getAlarmLogUnreadCount.cacheKey]
        })
      })
    }
  }, [alarmQuery.data, queryClient])

  const onSort: SortButtonProps['onChange'] = e => {
    setSort({ order: e.order, orderBy: e.orderBy })
  }

  const onDelete = async (id: string) => {
    const [err] = await to(deleteAlarmLog([id]))

    if (err) {
      toast({ description: err.message })
      return
    }

    toast({ description: '删除成功' })
    alarmQuery.refetch()
  }

  const onClean = async () => {
    JknAlert.confirm({
      content: '是否清空所有警报记录？',
      okBtnText: '清空',
      okBtnVariant: 'destructive',
      onAction: async r => {
        if (r === 'confirm') {
          const [err] = await to(clearAlarmLogs())

          if (err) {
            toast({ description: err.message })
            return
          }

          toast({ description: '清空成功' })
          alarmQuery.refetch()
        }
      }
    })
  }

  useAppEvent('alarm', useCallback(() => {
    alarmQuery.refetch()
  }, [alarmQuery.refetch]))

  return (
    <div className="h-full flex flex-col">
      <div className="px-5 flex items-center w-full box-border border-b-primary pb-2">
        <JknIcon.Svg
          name="clean"
          size={18}
          className="cursor-pointer rounded flex items-center justify-center p-1 hover:bg-accent"
          onClick={onClean}
        />
        <span className="ml-auto h-[26px]">
          <SortButton
            list={[
              { label: '代码(A到Z)', order: 'asc', field: 'symbol' },
              { label: '代码(Z到A)', order: 'desc', field: 'symbol' },
              // { label: '创建时间(从旧到新)', order: 'asc', field: 'create_time' },
              // { label: '创建时间(从新到旧)', order: 'desc', field: 'create_time' },
              { label: '警报时间(从旧到新)', order: 'asc', field: 'alarm_time' },
              { label: '警报时间(从新到旧)', order: 'desc', field: 'alarm_time' }
            ]}
            onChange={onSort}
          />
        </span>
      </div>
      <JknInfiniteArea direction="down" className="flex-1" hasMore={alarmQuery.hasNextPage} fetchMore={() => !alarmQuery.isFetchingNextPage && alarmQuery.fetchNextPage()}>
        {
          dataGroupBy.map((item) => (
            <GroupArea key={item.key}
              title={
                <span>
                  {item.key.slice(5)}&nbsp;&nbsp;
                  <JknIcon name="ic_us" className="inline-block ml-1 size-3" />
                  &nbsp;
                  <span className="text-tertiary text-sm">
                    美东时间
                  </span>
                </span>
              }
            >
              {item.list?.map((row) => (
                <AlarmRecordItem
                  key={row.id}
                  isRead={row.is_read === 1}
                  index={total.current - row.index}
                  symbol={row.symbol}
                  data={row}
                  onDelete={onDelete}
                />
              ))}
            </GroupArea>
          ))
        }
      </JknInfiniteArea>
    </div>
  )
}

interface AlarmRecordItemProps {
  symbol: string
  data: AlarmRecordItemType
  index: number
  isRead: boolean
  onDelete: (id: string) => void
}
const AlarmRecordItem = ({ symbol, data, onDelete, index, isRead }: AlarmRecordItemProps) => {
  const onClick = () => {
    if (data.type === AlarmType.AI) {
      stockUtils.gotoStockPage(symbol, { interval: data.condition.coiling.param.stock_cycle, alarm: true })
    } else {
      stockUtils.gotoStockPage(symbol, { interval: StockChartInterval.DAY, alarm: true })
    }
  }

  const renderTrigger = () => {
    if (data.type === AlarmType.AI) {
      const cyc = stockUtils.intervalToStr(data.condition.coiling.param.stock_cycle)

      return (
        <span>
          <span>{cyc}</span>
          <span data-direction={data.condition.bull === '1' ? 'up' : 'down'}>
            &nbsp;
            {data.condition.indicators}
            {data.condition.hdly ? <>·{data.condition.hdly}</> : null}
            &nbsp;
            {data.condition.bull === '1' ? '↑' : '↓'}
          </span>
        </span>
      )
    }
    if (data.type === AlarmType.PRICE) {
      const triggerStr = data.condition.trigger === PriceAlarmTrigger.DOWN ? '下跌' : '上涨'

      return (
        <span data-direction={data.condition.trigger === PriceAlarmTrigger.UP ? 'up' : 'down'}>
          {triggerStr}
          {data.condition.price}
          {data.condition.trigger === PriceAlarmTrigger.UP ? '↑' : '↓'}
        </span>
      )
    }

    if (data.type === AlarmType.PERCENT) {
      const value = data.condition.data.pnl_percent
      return (
        <span data-direction={value <= 0 ? 'up' : 'down'}>
          {
            value <= 0 ? (
              <span>
                上涨追踪 ↑ {data.condition.data.trigger_type === 1 ? '按回撤比例' : '按回撤金额'}
              </span>
            ) : (
              <span>
                下跌追踪 ↓ {data.condition.data.trigger_type === 1 ? '按反弹比例' : '按反弹金额'}
              </span>
            )
          }
          &nbsp;{data.condition.data.trigger_type === 1 ? `${(Math.abs(data.condition.data.pnl_percent * 100)).toFixed(2)}%` : Math.abs(data.condition.data.pnl_price).toFixed(3)}
        </span>
      )
    }

    return null
  }

  return (
    <div
      className="alarm-list-item text-foreground px-5 py-3 leading-none text-sm hover:bg-[#1B1B1B]"
      onClick={onClick}
      onKeyDown={() => { }}
    >
      <div className="flex items-center w-full relative whitespace-nowrap">
        <div className="h-4 min-w-4 flex-shrink-0 bg-[#2E2E2E] rounded-full text-xs leading-4 px-1 text-center box-border mr-2.5">
          {index}
        </div>
        <JknIcon.Stock symbol={symbol} className="w-4 h-4 leading-4 mr-1" />
        <span className="whitespace-nowrap text-ellipsis overflow-hidden text-left"><span>{symbol}</span>，{renderTrigger()}</span>
        <span className={cn(
          'rounded-xs px-1 py-[1px] box-border text-xs ml-1 text-white bg-primary relative',
          isRead && 'text-primary bg-primary/20'
        )}>
          {data.type === AlarmType.AI ? 'AI' : data.type === AlarmType.PERCENT ? '浮动' : '股价'}
          {
            !isRead ? (
              <span className="absolute -right-3 top-0 size-1.5 rounded-full bg-[#D61B5F]" />
            ) : null
          }
        </span>
        <div className="absolute -right-2 -top-1 alarm-list-item-action space-x-1 text-secondary">
          <JknIcon.Svg
            name="delete"
            size={16}
            className="cursor-pointer p-1 rounded hover:bg-accent"
            onClick={e => {
              e.stopPropagation()
              onDelete(data.id)
            }}
          />
        </div>
      </div>
      <div className="flex w-full">
        <div className="min-w-4 flex-shrink-0 text-transparent rounded-full text-xs leading-1 px-1 text-center box-border mr-2.5 self-stretch flex flex-col items-center">
          <span className="-mt-1.5">
            {index}
          </span>
          <Separator orientation="vertical" className="flex-1 border-[#575757]" />
        </div>
        <div className="flex-1">
          {data.type === AlarmType.AI ? (
            <div className="text-left mt-1">
              <Star.Rect
                total={5}
                className="w-[6px] h-2.5 rounded-[1px] !mr-[1px]"
                activeColor={
                  data.condition.bull === '1'
                    ? useConfig.getState().getStockColor(true, 'hex')
                    : useConfig.getState().getStockColor(false, 'hex')
                }
                count={data.condition.score_total}
              />
            </div>
          ) : null}
          <div className="text-tertiary text-xs text-left mt-1.5 leading-5">
            {data.type === AlarmType.PERCENT ? (
              <span className="leading-7" data-direction={data.condition.data.trigger_price - data.condition.data.base_price > 0 ? 'up' : 'down'}>
                报警触发价&nbsp;
                {(data.condition.data.pnl_price + data.condition.data.base_price).toFixed(3)}&nbsp;
                {data.condition.data.trigger_type === 1 ? '盈亏比例' : '盈亏金额'}
                {data.condition.data.trigger_type === 1 ? (
                  <span>{Decimal.create(data.condition.data.trigger_price).minus(data.condition.data.base_price).div(data.condition.data.base_price).mul(100).toFixed(2)}%</span>
                ) : (
                  <span>{(data.condition.data.trigger_price - data.condition.data.base_price).toFixed(3)}</span>
                )}
                <br />
              </span>
            ) : null}
            {data.alarm_time ? <span>触发时间&nbsp;{dateUtils.toUsDay(data.alarm_time).format('HH:mm:ss')}</span> : null}
            &emsp;
            {/* {data.condition.frequency === 1 ? '持续提醒' : '仅提醒一次'} */}
          </div>
        </div>
      </div>
      <style jsx>
        {`
          .alarm-list-item-action {
            display: none;
          }
          .alarm-list-item:hover .alarm-list-item-action {
            display: block;
          }
        `}
      </style>
    </div>
  )
}
