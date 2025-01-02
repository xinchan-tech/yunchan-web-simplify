import { IncreaseTopStatus, getIncreaseTop } from "@/api"
import { CapsuleTabs, HoverCard, HoverCardContent, HoverCardTrigger, JknIcon, JknTable, type JknTableProps, NumSpan, ScrollArea, StockView } from "@/components"
import { useStockQuoteSubscribe } from "@/hooks"
import { useTime } from "@/store"
import { dateToWeek } from "@/utils/date"
import { stockManager, type StockTrading, type StockRecord } from "@/utils/stock"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import Decimal from "decimal.js"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

const tradingToTopStatusMap: Record<StockTrading, IncreaseTopStatus> = {
  intraDay: IncreaseTopStatus.INTRA_DAY,
  preMarket: IncreaseTopStatus.PRE_MARKET,
  afterHours: IncreaseTopStatus.AFTER_HOURS,
  close: IncreaseTopStatus.AFTER_HOURS
}

const TopList = () => {
  const time = useTime()
  const [type, setType] = useState<IncreaseTopStatus>(tradingToTopStatusMap[time.getTrading() as keyof typeof tradingToTopStatusMap])
  const { t } = useTranslation()
  const trading = useTime().getTrading()
  const { isToday } = useTime()

  const query = useQuery({
    queryKey: [getIncreaseTop.cacheKey, type],
    queryFn: () => getIncreaseTop({ open_status: type, extend: ['total_share', 'stock_before', 'stock_after'] }),
    refetchInterval: 30 * 1000
  })

  const queryClient = useQueryClient()

  const onTypeChange = (s: IncreaseTopStatus) => {
    setType(s)
    queryClient.invalidateQueries({ queryKey: [getIncreaseTop.cacheKey, s] })
  }

  const data = useMemo(() => query.data?.map(d => stockManager.toStockRecord(d)[0]!) ?? [], [query.data])

  useStockQuoteSubscribe(data.map(d => d.symbol), (data) => {
    if(tradingToTopStatusMap[time.getTrading() as keyof typeof tradingToTopStatusMap] !== type) return

     queryClient.setQueryData([getIncreaseTop.cacheKey, type], (old: typeof query.data) => {
          if (!old) return old
          const items = old.map((item) => {
            if (item.symbol === data.topic) {
              const newStock = [...item.stock]
              newStock[0] = data.rawRecord[0]
              newStock[2] = data.rawRecord[1]
              newStock[9] = data.rawRecord[2]
              newStock[5] = data.rawRecord[3]
              newStock[6] = data.rawRecord[4]
              return {
                ...item,
                stock: newStock
              }
            }
            return item
          })
    
          return items
        })
  })

  const columns: JknTableProps<StockRecord>['columns'] = [
    {
      header: '名称代码', accessorKey: 'name',
      meta: { width: '26%' },
      cell: ({ row }) => <StockView code={row.original.code} name={row.getValue('name')} />

    },
    {
      header: '盘前价', accessorKey: 'close', meta: { align: 'right', width: '17%' },
      cell: ({ row }) => <NumSpan value={row.getValue('close')} isPositive={row.getValue<number>('percent') >= 0} />
    },
    {
      header: '盘前涨跌幅', accessorKey: 'percent', meta: { align: 'right', width: '19%' },
      cell: ({ row }) => (
        <div className="inline-block">
          <NumSpan block className="py-0.5 w-20" decimal={2} value={`${row.getValue<number>('percent') * 100}`} percent isPositive={row.getValue<number>('percent') >= 0} symbol />
        </div>
      )
    },
    {
      header: '成交额', accessorKey: 'turnover', meta: { align: 'right', width: '19%' },
      cell: ({ row }) => <NumSpan unit decimal={2} value={row.getValue('turnover')} isPositive={row.getValue<number>('percent') >= 0} />
    },
    {
      header: '总市值', accessorKey: 'marketValue', meta: { align: 'right', width: '19%' },
      cell: ({ row }) => Decimal.create(row.getValue('marketValue')).toDecimalPlaces(2).toShortCN()
    },
  ]

  const isShowTips = () => {

    if (!data || data.length === 0) return false

    const firstRecord = data[0]
    if (!firstRecord) return false

    if (isToday(firstRecord.date)) {
      if (type === IncreaseTopStatus.PRE_MARKET && ['preMarket', 'intraDay', 'afterHours'].includes(trading)) {
        return false
      }

      if (type === IncreaseTopStatus.INTRA_DAY && ['intraDay', 'afterHours'].includes(trading)) {
        return false
      }

      if (type === IncreaseTopStatus.AFTER_HOURS && ['afterHours'].includes(trading)) {
        return false
      }

      return true
    }

    return true
  }

  const formatDate = (date: string) => {
    const d = dayjs(date)
    return d.isValid() ? (` ${d.format('MM-DD')} ${dateToWeek(d)} `) : date
  }


  return (
    <div className="w-full h-full flex flex-col">
      <div className="border-style-primary px-1 py-2">
        <CapsuleTabs activeKey={type.toString()} onChange={(v) => onTypeChange(+v as IncreaseTopStatus)}>
          <CapsuleTabs.Tab value={IncreaseTopStatus.PRE_MARKET.toString()}
            label={<span className="flex items-center">{`${t('stockChart.before')}热门`}&nbsp;{
              isShowTips() && (
                <HoverCard>
                  <HoverCardTrigger className="flex items-center">
                    <JknIcon name="ic_tip1" className="w-3 h-3" />
                  </HoverCardTrigger>
                  <HoverCardContent side="top" className="w-fit">
                    {`上一个交易日${formatDate(data[0]?.date)}统计`}
                  </HoverCardContent>
                </HoverCard>
              )
            }
            </span>
            }
          />
          <CapsuleTabs.Tab value={IncreaseTopStatus.INTRA_DAY.toString()}
            label={<span className="flex items-center">{`${t('stockChart.in')}热门`}&nbsp;{
              isShowTips() && (
                <HoverCard>
                  <HoverCardTrigger className="flex items-center">
                    <JknIcon name="ic_tip1" className="w-3 h-3" />
                  </HoverCardTrigger>
                  <HoverCardContent side="top" className="w-fit">
                    {`上一个交易日${formatDate(data[0]?.date)}统计`}
                  </HoverCardContent>
                </HoverCard>
              )
            }</span>}
          />
          <CapsuleTabs.Tab value={IncreaseTopStatus.AFTER_HOURS.toString()}
            label={<span className="flex items-center">{`${t('stockChart.after')}热门`}&nbsp;{
              isShowTips() && (
                <HoverCard>
                  <HoverCardTrigger className="flex items-center">
                    <JknIcon name="ic_tip1" className="w-3 h-3" />
                  </HoverCardTrigger>
                  <HoverCardContent side="top" className="w-fit">
                    {`上一个交易日${formatDate(data[0]?.date)}统计`}
                  </HoverCardContent>
                </HoverCard>
              )
            }</span>}
          />
          <CapsuleTabs.Tab value={IncreaseTopStatus.YESTERDAY.toString()} label={<span>昨日</span>} />
          <CapsuleTabs.Tab value={IncreaseTopStatus.WEEK.toString()} label={<span>本周</span>} />
        </CapsuleTabs>
      </div>
      <div className="flex-1">
        <JknTable rowKey="symbol" columns={columns} data={data} />
      </div>
    </div>
  )
}

export default TopList