import { AlarmType, PriceAlarmTrigger, clearAlarmLogs, deleteAlarmCondition, deleteAlarmLog, getAlarmConditionsList, getAlarmLogsList } from "@/api"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Input, JknAlert, JknIcon, JknVirtualInfinite, Separator, StockAlarm, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components'
import { useToast } from "@/hooks"
import { dateUtils } from "@/utils/date"
import { stockUtils } from "@/utils/stock"
import { cn } from "@/utils/style"
import { WsV2 } from "@/utils/ws"
import { useInfiniteQuery } from "@tanstack/react-query"
import to from "await-to-js"
import { Fragment, type KeyboardEventHandler, useEffect, useState } from 'react'

const StockAlarmPage = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'log'>('list')
  return (
    <div className="rounded-xs bg-background h-full overflow-hidden ml-1 w-[calc(100%-4px)]">
      <div className="text-center h-full py-5 box-border">
        <Tabs value={activeTab} onValueChange={setActiveTab as any} className="h-full flex flex-col">
          <TabsList variant="flat" className="mx-5">
            <TabsTrigger value={'list'} asChild>
              <span className="w-full">&emsp;警报列表&emsp;</span>
            </TabsTrigger>
            <TabsTrigger value={'log'} asChild>
              <span className="w-full">&emsp;触发日志&emsp;</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="flex-1 overflow-hidden" >
            <StockAlarmList />
          </TabsContent>
          <TabsContent value="log" className="flex-1 overflow-hidden">
            <StockAlarmRecordList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

type AlarmItemType = ArrayItem<Awaited<ReturnType<typeof getAlarmConditionsList>>['items']>

const StockAlarmList = () => {
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [sort, setSort] = useState({ order: '', orderBy: '' })
  const alarmQuery = useInfiniteQuery({
    queryKey: [getAlarmConditionsList.cacheKey, search, sort],
    queryFn: async ({ pageParam = 0 }) => getAlarmConditionsList({ page: pageParam, limit: 20, symbol: search, order: sort.order as any, order_by: sort.orderBy }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _, lastPageParam) => lastPage.total_pages > lastPageParam ? lastPageParam + 1 : undefined,
    getPreviousPageParam: () => undefined,
    select: data => data.pages.flatMap(p => p.items ?? []),
  })

  const { toast } = useToast()

  const onDelete = async (id: string) => {
    const [err] = await to(deleteAlarmCondition([id]))

    if (err) {
      toast({ description: err.message })
      return
    }

    toast({ description: '删除成功' })
    alarmQuery.refetch()
  }

  const onSearch: KeyboardEventHandler<HTMLInputElement> = (e) => {
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

  const onSort: SortButtonProps['onChange'] = (e) => {
    setSort({ order: e.order, orderBy: e.orderBy })
  }


  return (
    <div className="h-full flex flex-col">
      <div className="px-5 flex items-center w-full box-border border-b-primary pb-2">
        <StockAlarm>
          <JknIcon.Svg name="plus" size={16} className="cursor-pointer rounded flex items-center justify-center p-1 hover:bg-accent" />
        </StockAlarm>
        <div className="ml-auto mr-2 flex items-center">
          {
            showSearch ? (
              <Input size="sm" className="transition placeholder:text-tertiary h-[26px] text-foreground" placeholder="输入股票名称搜索" onKeyDown={onSearch} />
            ) : null
          }
          <JknIcon.Svg className={cn(
            'ml-2 cursor-pointer rounded p-1 hover:bg-accent flex-shrink-0',
            showSearch && 'text-primary'
          )} name="search" size={18} onClick={onChangeSearch} />
        </div>
        {/* <StockSelect /> */}
        {/* <JknIcon.Svg className="cursor-pointer" name="sort" size={26} /> */}
        {/* <JknIcon.Svg className="mr-2 cursor-pointer rounded p-1 hover:bg-accent" name="sort" size={18} /> */}
        <SortButton
          list={[
            { label: '代码(A到Z)', order: 'asc', field: 'symbol' },
            { label: '代码(A到Z)', order: 'desc', field: 'symbol' },
            { label: '创建时间(从旧到新)', order: 'asc', field: 'create_time' },
            { label: '创建时间(从新到旧)', order: 'desc', field: 'create_time' }
          ]}
          onChange={onSort}
        />
      </div>
      <JknVirtualInfinite direction="down" className="flex-1" itemHeight={70} rowKey="id" data={alarmQuery.data ?? []}
        hasMore={alarmQuery.hasNextPage}
        fetchMore={alarmQuery.fetchNextPage}
        loading={alarmQuery.isLoading}
        renderItem={(row) => <AlarmItem symbol={row.symbol} data={row} onDelete={onDelete} />}
      />
      {/* <JknVirtualList className="flex-1" itemHeight={70} rowKey="id" data={alarmQuery.data ?? []}
        renderItem={(row) => <AlarmItem symbol={row.symbol} data={row} onDelete={onDelete} />} /> */}
    </div>
  )
}

interface AlarmItemProps {
  symbol: string
  data: AlarmItemType
  onDelete: (id: string) => void
}
const AlarmItem = ({ symbol, data, onDelete }: AlarmItemProps) => {
  const renderTrigger = () => {
    if (data.type === AlarmType.AI) {
      const cyc = stockUtils.intervalToStr(data.stock_cycle)

      return (
        <span>
          <span>{cyc}</span>
          <span data-direction={data.condition.bull === '1' ? 'up' : 'down'}>
            &nbsp;
            {data.condition.category_names.join('·')}
            {
              data.condition.category_hdly_names?.length ? (
                <>
                  ·
                  {data.condition.category_hdly_names.join('·')}
                </>
              ) : null
            }
            &nbsp;
            {
              data.condition.bull === '1' ? '↑' : '↓'
            }
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
          {
            data.condition.trigger === PriceAlarmTrigger.UP ? '↑' : '↓'
          }
        </span>
      )
    }

    return null
  }

  // const navigate = useNavigate()

  const onNav = () => {
    stockUtils.gotoStockPage(symbol, { interval: data.stock_cycle })
  }

  return (
    <div className="alarm-list-item text-foreground px-5 py-3 leading-none text-sm border-b-primary hover:bg-[#1B1B1B]" onClick={onNav} onKeyDown={() => { }}>
      <div className="flex items-center w-full relative">
        <JknIcon.Stock symbol={symbol} className="w-4 h-4 leading-4 mr-1" />
        <span>{symbol}</span>，
        {
          renderTrigger()
        }
        <span className="bg-accent rounded-xs px-1 py-[1px] box-border text-tertiary text-xs ml-1">{data.type === AlarmType.AI ? 'AI' : '股价'}</span>
        <div className="absolute -right-2 -top-1 alarm-list-item-action space-x-1 text-secondary">
          <JknIcon.Svg name="delete" size={16} className="cursor-pointer p-1 rounded hover:bg-accent" onClick={(e) => {
            e.stopPropagation()
            onDelete(data.id)
          }} />
          {/* <JknIcon.Svg name="edit" size={16} className="cursor-pointer p-1 rounded hover:bg-accent" /> */}
        </div>
      </div>
      <div className="text-tertiary text-xs text-left mt-2.5">
        <span>
          添加时间&nbsp;
          {dateUtils.toUsDay(data.create_time).format('MM/DD w HH:mm')}
        </span>
        &emsp;
        <span>
          <span className="text-secondary">频率·</span>
          {
            data.condition.frequency === 1 ? '持续提醒' : '仅提醒一次'
          }
        </span>
      </div>
      {
        data.expire_time ? (
          <div className="text-tertiary text-xs text-left mt-2.5">
            <span>
              到期时间&nbsp;
              {dateUtils.toUsDay(data.expire_time).format('YYYY/MM/DD')}
            </span>
          </div>
        ) : null
      }
      <style jsx>
        {
          `
          .alarm-list-item-action {
            display: none;
          }
          .alarm-list-item:hover .alarm-list-item-action {
            display: block;
          }
        `
        }
      </style>
    </div>
  )
}

type AlarmRecordItemType = ArrayItem<Awaited<ReturnType<typeof getAlarmLogsList>>['items']>

const StockAlarmRecordList = () => {
  const [sort, setSort] = useState({ order: '', orderBy: '' })
  const alarmQuery = useInfiniteQuery({
    queryKey: [getAlarmLogsList.cacheKey, sort],
    queryFn: async ({ pageParam = 0 }) => getAlarmLogsList({ page: pageParam, limit: 20, order: sort.order as any, order_by: sort.orderBy }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _, lastPageParam) => lastPage.total_pages > lastPageParam ? lastPageParam + 1 : undefined,
    getPreviousPageParam: () => undefined,
    select: data => data.pages.flatMap(p => p.items ?? []),
  })

  const { toast } = useToast()
  // const { toast } = useToast()

  const onSort: SortButtonProps['onChange'] = (e) => {
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
      onAction: async (r) => {
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

  useEffect(() => {
    const ws = WsV2.getWs()

    const unSubscribe = ws?.onAlarm(() => {
      alarmQuery.refetch()
    })

    return () => {
      unSubscribe?.()
    }
  }, [alarmQuery.refetch])

  return (
    <div className="h-full flex flex-col">
      <div className="px-5 flex items-center w-full box-border border-b-primary pb-2">
        <JknIcon.Svg name="clean" size={18} className="cursor-pointer rounded flex items-center justify-center p-1 hover:bg-accent" onClick={onClean} />
        <span className="ml-auto">
          <SortButton
            list={[
              { label: '代码(A到Z)', order: 'asc', field: 'symbol' },
              { label: '代码(Z到A)', order: 'desc', field: 'symbol' },
              { label: '创建时间(从旧到新)', order: 'asc', field: 'create_time' },
              { label: '创建时间(从新到旧)', order: 'desc', field: 'create_time' },
              { label: '警报时间(从旧到新)', order: 'asc', field: 'alarm_time' },
              { label: '警报时间(从新到旧)', order: 'desc', field: 'alarm_time' },
            ]}
            onChange={onSort}
          />
        </span>
      </div>
      <JknVirtualInfinite direction="down" className="flex-1" itemHeight={70} rowKey="id" data={alarmQuery.data ?? []}
        hasMore={alarmQuery.hasNextPage}
        fetchMore={alarmQuery.fetchNextPage}
        renderItem={(row) => <AlarmRecordItem symbol={row.symbol} data={row} onDelete={onDelete} />}
      />
    </div>
  )
}

interface AlarmRecordItemProps {
  symbol: string
  data: AlarmRecordItemType
  onDelete: (id: string) => void
}
const AlarmRecordItem = ({ symbol, data, onDelete }: AlarmRecordItemProps) => {

  const onClick = () => {
    stockUtils.gotoStockPage(symbol, { interval: data.stock_cycle })
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
            {
              data.condition.hdly ? (
                <>
                  ·
                  {data.condition.hdly}
                </>
              ) : null
            }
            &nbsp;
            {
              data.condition.bull === '1' ? '↑' : '↓'
            }
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
          {
            data.condition.trigger === PriceAlarmTrigger.UP ? '↑' : '↓'
          }
        </span>
      )
    }

    return null
  }




  return (
    <div className="alarm-list-item text-foreground px-5 py-3 leading-none text-sm border-b-primary hover:bg-[#1B1B1B]" onClick={onClick} onKeyDown={() => { }}>
      <div className="flex items-center w-full relative">
        <JknIcon.Stock symbol={symbol} className="w-4 h-4 leading-4 mr-1" />
        <span>{symbol}</span>，
        {
          renderTrigger()
        }
        <span className="bg-accent rounded-xs px-1 py-[1px] box-border text-tertiary text-xs ml-1">{data.type === AlarmType.AI ? 'AI' : '股价'}</span>
        <div className="absolute -right-2 -top-1 alarm-list-item-action space-x-1 text-secondary">
          <JknIcon.Svg name="delete" size={16} className="cursor-pointer p-1 rounded hover:bg-accent" onClick={(e) => { e.stopPropagation(); onDelete(data.id) }} />
          {/* <JknIcon.Svg name="edit" size={16} className="cursor-pointer p-1 rounded hover:bg-accent" /> */}
        </div>
      </div>
      {
        data.type === AlarmType.AI ? (
          <div className={cn(data.condition.bull === '1' ? 'text-stock-up' : 'text-stock-down', 'flex items-center space-x-1 mt-2.5')}>
            {Array.from({ length: 5 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              <span key={i} className="w-[6px] h-2.5 rounded-[1px]" style={{ background: data.condition.score_total > i ? 'currentColor' : '#2E2E2E' }} />
            ))}
          </div>
        ) : null
      }
      <div className="text-tertiary text-xs text-left mt-2.5">
        {
          data.alarm_time ? <span>触发时间 {dateUtils.toUsDay(data.alarm_time).format('MM/DD w HH:mm')}</span> : null
        }
        &emsp;
        {
          data.condition.frequency === 1 ? '持续提醒' : '仅提醒一次'
        }
      </div>
      <style jsx>
        {
          `
          .alarm-list-item-action {
            display: none;
          }
          .alarm-list-item:hover .alarm-list-item-action {
            display: block;
          }
        `
        }
      </style>
    </div>
  )
}

interface SortButtonProps {
  list: { label: string; order: 'asc' | 'desc', field: string }[]
  onChange: (params: { order: 'asc' | 'desc', orderBy: string }) => void
}

const SortButton = ({ list, onChange }: SortButtonProps) => {
  const [order, setOrder] = useState<{ order: 'asc' | 'desc', orderBy: string }>({ order: 'desc', orderBy: '' })

  const onSort = (item: { order: 'asc' | 'desc', field: string }) => {
    setOrder({ order: item.order, orderBy: item.field })
    onChange({ order: item.order, orderBy: item.field })
  }

  return (
    // <div className="flex items-center">
    //           {/* <JknIcon.Svg className="mr-2 cursor-pointer rounded p-1 hover:bg-accent" name="sort" size={18} />
    //   <JknIcon.Svg name={order === 'asc' ? 'sort-asc' : 'sort'} size={16} className="cursor-pointer rounded flex items-center justify-center p-1 hover:bg-accent" onClick={onClick} />
    //   <span className="text-tertiary text-xs ml-1 cursor-pointer" onClick={onClick}>{selected === 'asc' ? '升序' : '降序'}</span> */}
    // </div>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span className="inline-flex">
          <JknIcon.Svg name={order.order === 'asc' ? 'sort-asc' : 'sort'} className="mr-2 cursor-pointer rounded p-1 hover:bg-accent" size={18} />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {
          list.map((item, index, arr) => (
            <Fragment key={item.field}>
              <DropdownMenuItem data-checked={order.order === item.order && order.orderBy === item.field} key={item.field} onClick={() => onSort(item)} >
                <JknIcon.Svg name={item.order === 'asc' ? 'sort-asc' : 'sort'} size={18} />
                {
                  item.label
                }
              </DropdownMenuItem>
              {
                index !== arr.length - 1 && index !== 0 && index % 2 === 1 ? <Separator /> : null
              }
            </Fragment>
          ))
        }
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default StockAlarmPage
