import { AlarmType, PriceAlarmTrigger, deleteAlarmCondition, getAlarmConditionsList, getAlarmLogsList } from "@/api"
import { JknIcon, JknVirtualInfinite, StockAlarm, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components'
import { useCheckboxGroup, useToast } from "@/hooks"
import { stockUtils } from "@/utils/stock"
import { cn } from "@/utils/style"
import { useInfiniteQuery } from "@tanstack/react-query"
import to from "await-to-js"
import { useState } from 'react'
import { useNavigate } from "react-router"

const StockAlarmPage = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'log'>('list')
  return (
    <div className="rounded-xs bg-background h-full overflow-hidden ml-1 w-[calc(100%-4px)]">
      <div className="text-center h-full py-5 box-border">
        <Tabs value={activeTab} onValueChange={setActiveTab as any} className="h-full flex flex-col">
          <TabsList variant="flat" className="mx-5">
            <TabsTrigger value={'list'} asChild>
              <span className="w-full">&emsp;报警列表&emsp;</span>
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
  const alarmQuery = useInfiniteQuery({
    queryKey: [getAlarmConditionsList.cacheKey],
    queryFn: async ({ pageParam = 0 }) => getAlarmConditionsList({ page: pageParam, limit: 20 }),
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



  return (
    <div className="h-full flex flex-col">
      <div className="px-5 flex items-center w-full box-border border-b-primary pb-2">
        <StockAlarm>
          <JknIcon.Svg name="plus" size={16} className="cursor-pointer rounded flex items-center justify-center p-1 hover:bg-accent" />
        </StockAlarm>

        <JknIcon.Svg className="ml-auto mr-2 cursor-pointer rounded p-1 hover:bg-accent" name="search" size={18} />
        {/* <StockSelect /> */}
        {/* <JknIcon.Svg className="cursor-pointer" name="sort" size={26} /> */}
        <JknIcon.Svg className="mr-2 cursor-pointer rounded p-1 hover:bg-accent" name="sort" size={18} />
      </div>
      <JknVirtualInfinite direction="down" className="flex-1" itemHeight={70} rowKey="id" data={alarmQuery.data ?? []}
        hasMore={alarmQuery.hasNextPage}
        fetchMore={alarmQuery.fetchNextPage}
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
          <span>
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

  const navigate = useNavigate()

  return (
    <div className="alarm-list-item px-5 py-3 leading-none text-sm border-b-primary hover:bg-[#1B1B1B]" onClick={() => navigate(`/stock?symbol=${symbol}`)} onKeyDown={() => { }}>
      <div className="flex items-center w-full relative">
        <JknIcon.Stock symbol={symbol} className="w-4 h-4 leading-4" />
        <span>{symbol}</span>，
        {
          renderTrigger()
        }
        <span className="bg-accent rounded-xs px-1 py-[1px] box-border text-tertiary text-xs ml-1">{data.type === AlarmType.AI ? 'AI' : '股价'}</span>
        <div className="absolute -right-2 -top-1 alarm-list-item-action space-x-1 text-secondary">
          <JknIcon.Svg name="delete" size={16} className="cursor-pointer p-1 rounded hover:bg-accent" onClick={() => onDelete(data.id)} />
          {/* <JknIcon.Svg name="edit" size={16} className="cursor-pointer p-1 rounded hover:bg-accent" /> */}
        </div>
      </div>
      <div className="text-tertiary text-xs text-left mt-2.5">
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

type AlarmRecordItemType = ArrayItem<Awaited<ReturnType<typeof getAlarmLogsList>>['items']>

const StockAlarmRecordList = () => {
  const { checked, toggle } = useCheckboxGroup([])
  const alarmQuery = useInfiniteQuery({
    queryKey: [getAlarmLogsList.cacheKey],
    queryFn: async ({ pageParam = 0 }) => getAlarmLogsList({ page: pageParam, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _, lastPageParam) => lastPage.total_pages > lastPageParam ? lastPageParam + 1 : undefined,
    getPreviousPageParam: () => undefined,
    select: data => data.pages.flatMap(p => p.items ?? []),
  })

  // const { toast } = useToast()

  const onDelete = async (_id: string) => {

  }



  return (
    <div className="h-full flex flex-col">
      <div className="px-5 flex items-center w-full box-border border-b-primary pb-2">
        <JknIcon.Svg name="clean" size={18} className="cursor-pointer rounded flex items-center justify-center p-1 hover:bg-accent" />
        <JknIcon.Svg className="ml-auto mr-2 cursor-pointer rounded flex items-center justify-center p-1 hover:bg-accent" name="sort" size={18} />
      </div>
      <JknVirtualInfinite direction="down" className="flex-1" itemHeight={70} rowKey="id" data={alarmQuery.data ?? []}
        hasMore={alarmQuery.hasNextPage}
        fetchMore={alarmQuery.fetchNextPage}
        renderItem={(row) => <AlarmRecordItem symbol={row.symbol} data={row} onDelete={onDelete} checked={checked.some(item => item === row.id)} onClick={() => toggle(row.id)} />}
      />
    </div>
  )
}

interface AlarmRecordItemProps {
  symbol: string
  data: AlarmRecordItemType
  onDelete: (id: string) => void
  onClick: () => void
  checked: boolean
}
const AlarmRecordItem = ({ symbol, data, onDelete, checked, onClick }: AlarmRecordItemProps) => {
  const renderTrigger = () => {
    if (data.type === AlarmType.AI) {
      const cyc = stockUtils.intervalToStr(data.stock_cycle)

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
    <div className="alarm-list-item px-5 py-3 leading-none text-sm border-b-primary hover:bg-[#1B1B1B]" style={{ background: checked ? 'rgba(41, 98, 255, 0.3)' : undefined }} onClick={onClick} onKeyDown={() => { }}>
      <div className="flex items-center w-full relative">
        <JknIcon.Stock symbol={symbol} className="w-4 h-4 leading-4" />
        <span>{symbol}</span>，
        {
          renderTrigger()
        }
        <span className="bg-accent rounded-xs px-1 py-[1px] box-border text-tertiary text-xs ml-1">{data.type === AlarmType.AI ? 'AI' : '股价'}</span>
        <div className="absolute -right-2 -top-1 alarm-list-item-action space-x-1 text-secondary">
          <JknIcon.Svg name="delete" size={16} className="cursor-pointer p-1 rounded hover:bg-accent" onClick={() => onDelete(data.id)} />
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
          data.condition.frequency === 1 ? '持续提醒' : '仅提醒一次'
        }
        {/* {
          data.alarm_time
        } */}
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

export default StockAlarmPage
