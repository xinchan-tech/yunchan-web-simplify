import { getAlarmConditionsList, deleteAlarmCondition, cleanAllAlarmConditions, AlarmType, PriceAlarmTrigger } from "@/api"
import { JknAlert, JknIcon, Input, JknVirtualInfinite, StockAlarm, Separator, JknInfiniteArea } from "@/components"
import { useQueryParams } from "@/hooks"
import { StockChartInterval } from "@/store"
import { dateUtils } from "@/utils/date"
import { stockUtils } from "@/utils/stock"
import { cn } from "@/utils/style"
import { useInfiniteQuery } from "@tanstack/react-query"
import to from "await-to-js"
import dayjs from "dayjs"
import { useState, useRef, type KeyboardEventHandler, useMemo } from "react"
import { GroupArea, SortButton, type SortButtonProps } from "./component"
import { group, listify } from "radash"

type AlarmItemType = ArrayItem<Awaited<ReturnType<typeof getAlarmConditionsList>>['items']>

export const StockAlarmList = () => {
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [sort, setSort] = useState({ order: '', orderBy: '' })
  const [query] = useQueryParams<{ symbol?: string }>()
  const total = useRef(0)
  const alarmQuery = useInfiniteQuery({
    queryKey: [getAlarmConditionsList.cacheKey, search, sort],
    queryFn: async ({ pageParam = 0 }) =>
      getAlarmConditionsList({
        page: pageParam,
        limit: 20,
        symbol: search,
        order: sort.order as any,
        order_by: sort.orderBy
      }),
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

  const dataGroupBy = useMemo(() => {
    const groupBy = group(alarmQuery.data ?? [], item => {
      if (sort.orderBy === 'symbol') {
        return item.symbol.slice(0, 1)
      }

      return dateUtils.toUsDay(item.create_time).format('YYYY-MM-DD')
    })

    return listify(groupBy, (k, v) => ({ list: v, key: k }))
  }, [alarmQuery.data, sort.orderBy])

  const onDelete = async (id: string) => {
    const [err] = await to(deleteAlarmCondition([id]))

    if (err) {
      JknAlert.error(err.message)
      return
    }

    JknAlert.success('删除成功')
    alarmQuery.refetch()
  }

  const onClean = async () => {
    JknAlert.confirm({
      content: '是否清空所有警报条件？',
      okBtnText: '清空',
      okBtnVariant: 'destructive',
      onAction: async r => {
        if (r === 'confirm') {
          const [err] = await to(cleanAllAlarmConditions())

          if (err) {
            JknAlert.error(err.message)
            return
          }

          JknAlert.success('清空成功')
          alarmQuery.refetch()
        }
      }
    })
  }

  const onSearch: KeyboardEventHandler<HTMLInputElement> = e => {
    if (e.key === 'Enter') {
      setSearch((e.target as HTMLInputElement).value)
    }
  }

  const onChangeSearch = () => {
    if (showSearch) {
      setShowSearch(false)
      setSearch('')
    } else {
      setShowSearch(true)
    }
  }

  const onSort: SortButtonProps['onChange'] = e => {
    setSort({ order: e.order, orderBy: e.orderBy })
  }



  return (
    <div className="h-full flex flex-col">
      <div className="px-5 flex items-center w-full box-border border-b-primary pb-2">
        <JknIcon.Svg
          name="clean"
          size={18}
          className="cursor-pointer rounded flex items-center justify-center p-1 hover:bg-accent"
          onClick={onClean}
        />
        <StockAlarm code={query.symbol}>
          <JknIcon.Svg
            name="plus"
            size={16}
            className="cursor-pointer rounded flex items-center justify-center p-1 hover:bg-accent"
          />
        </StockAlarm>
        <div className="ml-auto mr-2 flex items-center">
          {showSearch ? (
            <Input
              size="sm"
              className="transition placeholder:text-tertiary h-[26px] text-foreground"
              placeholder="输入股票名称搜索"
              onKeyDown={onSearch}
            />
          ) : null}
          <JknIcon.Svg
            className={cn(
              'ml-2 cursor-pointer rounded p-1 hover:bg-accent flex-shrink-0',
              showSearch && 'text-primary'
            )}
            name="search"
            size={18}
            onClick={onChangeSearch}
          />
        </div>
        <SortButton
          list={[
            { label: '代码(A到Z)', order: 'asc', field: 'symbol' },
            { label: '代码(Z到A)', order: 'desc', field: 'symbol' },
            { label: '创建时间(从旧到新)', order: 'asc', field: 'create_time' },
            { label: '创建时间(从新到旧)', order: 'desc', field: 'create_time' }
          ]}
          onChange={onSort}
        />
      </div>
      <JknInfiniteArea direction="down" autoContainer={true} className="flex-1" hasMore={alarmQuery.hasNextPage} fetchMore={() => !alarmQuery.isFetchingNextPage && alarmQuery.fetchNextPage()}>
        {
          dataGroupBy.map((item) => (
            <GroupArea key={item.key}
              title={
                sort.orderBy === 'symbol' ? item.key : (
                  <span>
                    {item.key.slice(5)}&nbsp;&nbsp;
                    <JknIcon name="ic_us" className="inline-block ml-1 size-3" />
                    &nbsp;
                    <span className="text-tertiary text-sm">
                      美东时间
                    </span>
                  </span>
                )
              }
            >
              {item.list?.map((row) => (
                <AlarmItem
                  key={row.id}
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

interface AlarmItemProps {
  symbol: string
  data: AlarmItemType
  index: number
  onDelete: (id: string) => void
}
const AlarmItem = ({ symbol, data, index, onDelete }: AlarmItemProps) => {
  const renderTrigger = () => {
    if (data.type === AlarmType.AI) {
      const cyc = stockUtils.intervalToStr(data.stock_cycle)

      return (
        <span>
          <span>{cyc}</span>
          <span data-direction={data.condition.bull === '1' ? 'up' : 'down'}>
            &nbsp;
            {data.condition.category_names.join('·')}
            {data.condition.category_hdly_names?.length ? <>·{data.condition.category_hdly_names.join('·')}</> : null}
            &nbsp;
            {data.condition.bull === '1' ? '↑' : '↓'}
          </span>
        </span>
      )
    }

    if (data.type === AlarmType.PERCENT) {
      const triggerStr = data.condition.float_param.type === 1 ? '盈亏比例' : '盈亏金额'
      const value = data.condition.float_param.change_value
      const triggerValue =
        triggerStr === '盈亏比例'
          ? `${Math.abs((value * 100)).toFixed(2)}%`
          : (Math.abs(value)).toFixed(2)
      return (
        <span data-direction={value < 0 ? 'up' : 'down'}>
          {
            value < 0 ? (
              <span>
                上涨追踪 ↑ {data.condition.float_param.type === 1 ? '按回撤比例' : '按回撤金额'}
              </span>
            ) : (
              <span>
                下跌追踪 ↓ {data.condition.float_param.type === 1 ? '按反弹比例' : '按反弹金额'}
              </span>
            )
          }
          &nbsp;
          {triggerValue}&nbsp;
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

    return null
  }

  const onNav = () => {
    if (data.stock_cycle) {
      stockUtils.gotoStockPage(symbol, { interval: data.stock_cycle, alarm: true })
    } else {
      stockUtils.gotoStockPage(symbol, { interval: StockChartInterval.DAY, alarm: true })
    }
  }

  return (
    <div
      className="alarm-list-item text-foreground px-5 py-3 leading-none text-sm hover:bg-[#1B1B1B]"
      onClick={onNav}
      onKeyDown={() => { }}
    >
      <div className="flex items-center w-full relative whitespace-nowrap">
        <div className="h-4 min-w-4 flex-shrink-0 bg-[#2E2E2E] rounded-full text-xs leading-4 px-1 text-center box-border mr-2.5">
          {index}
        </div>
        <JknIcon.Stock symbol={symbol} className="w-4 h-4 leading-4 mr-1" />
        <span className="whitespace-nowrap text-ellipsis overflow-hidden text-left"><span>{symbol}</span>，{renderTrigger()}</span>
        <span className="bg-accent rounded-xs px-1 py-[1px] box-border text-tertiary text-xs ml-1">
          {data.type === AlarmType.AI ? 'AI' : data.type === AlarmType.PERCENT ? '浮动' : '股价'}
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
      <div className="flex w-full ">
        <div className="min-w-4 flex-shrink-0 text-transparent rounded-full text-xs leading-1 px-1 text-center box-border mr-2.5 self-stretch flex flex-col items-center">
          <span className="-mt-1.5">
            {index}
          </span>
          <Separator orientation="vertical" className="flex-1 border-[#575757]" />
        </div>
        <div className="flex-1">
          {data.type === AlarmType.PERCENT ? (
            <div className="text-left mt-2.5 text-foreground">
              起始价格{data.condition.float_param.price}&nbsp;&nbsp;
              <span>
                止损起始点
                {data.condition.float_param.type === 1 ? (data.condition.float_param.price * (1 + data.condition.float_param.change_value)).toFixed(2)
                  : (data.condition.float_param.change_value + data.condition.float_param.price).toFixed(2)}
              </span>
            </div>
          ) : null}
          <div className="text-tertiary text-xs text-left mt-2.5">
            <span>
              添加时间&nbsp;
              {dayjs(+data.create_time * 1000).format('MM/DD w HH:mm')}
            </span>
            &emsp;
            {data.type !== AlarmType.PERCENT ? (
              <span>
                <span className="text-secondary">频率·</span>
                {data.condition.frequency === 1 ? '持续提醒' : '仅提醒一次'}
              </span>
            ) : (
              null
            )}
          </div>
          {data.expire_time ? (
            <div className="text-tertiary text-xs text-left mt-2.5">
              <span>
                到期时间&nbsp;
                {dateUtils.toUsDay(data.expire_time).format('YYYY/MM/DD')}
              </span>
            </div>
          ) : null}
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