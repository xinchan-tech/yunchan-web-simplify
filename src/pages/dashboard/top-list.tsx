import { IncreaseTopStatus, getIncreaseTop } from "@/api"
import { CapsuleTabs, HoverCard, HoverCardContent, HoverCardTrigger, JknIcon, JknTable, type JknTableProps, NumSpan, ScrollArea, StockView } from "@/components"
import { type StockTrading, useStock, useTime } from "@/store"
import { dateToWeek } from "@/utils/date"
import { priceToCnUnit } from "@/utils/price"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

type TableData = {
  key: string
  code: string
  name: string
  price: number,
  percent: number,
  turnover: number,
  marketValue: number,
  date: string
}

const tradingToTopStatusMap: Record<StockTrading, IncreaseTopStatus> = {
  intraDay: IncreaseTopStatus.INTRA_DAY,
  preMarket: IncreaseTopStatus.PRE_MARKET,
  afterHours: IncreaseTopStatus.AFTER_HOURS,
  close: IncreaseTopStatus.AFTER_HOURS
}

const TopList = () => {
  const time = useTime()
  const [type, setType] = useState<IncreaseTopStatus>(tradingToTopStatusMap[time.getTrading()])
  const { t } = useTranslation()
  const stock = useStock()
  const trading = useTime().getTrading()
  const { isToday } = useTime()

  const query = useQuery({
    queryKey: [getIncreaseTop.cacheKey, type],
    queryFn: () => getIncreaseTop({ open_status: type, extend: ['total_share', 'stock_before', 'stock_after'] }),
    refetchInterval: 30 * 1000
  })

  // useMount(() => {
  //   query.run()
  // })
  const queryClient = useQueryClient()

  const onTypeChange = (s: IncreaseTopStatus) => {
    setType(s)
    queryClient.invalidateQueries({ queryKey: [getIncreaseTop.cacheKey, s] })
  }

  const data = useMemo(() => {
    const d: TableData[] = []

    for (const { symbol, name } of query.data ?? []) {
      let t: StockTrading
      if (type === IncreaseTopStatus.PRE_MARKET) {
        t = 'preMarket'
      } else if (type === IncreaseTopStatus.AFTER_HOURS) {
        t = 'afterHours'
      } else {
        t = 'intraDay'
      }

      const lastData = stock.getLastRecordByTrading(symbol, t)

      d.push({
        key: symbol + type,
        code: symbol,
        name: name,
        price: lastData?.close ?? 0,
        percent: lastData?.percent ?? 0,
        turnover: lastData?.turnover ?? 0,
        marketValue: lastData?.marketValue ?? 0,
        date: lastData?.time ?? '-'
      })
    }
    return d
  }, [stock, query.data, type])

  const columns: JknTableProps<TableData>['columns'] = [
    {
      header: '名称代码', accessorKey: 'name',
      meta: { width: '24%' },
      cell: ({ row }) => <StockView code={row.original.code} name={row.getValue('name')} />

    },
    {
      header: '盘前价', accessorKey: 'price', meta: { align: 'right', width: '17%' },
      cell: ({ row }) => <NumSpan value={row.getValue('price')} isPositive={row.getValue<number>('percent') >= 0} />
    },
    {
      header: '盘前涨跌幅', accessorKey: 'percent', meta: { align: 'right', width: '21%' },
      cell: ({ row }) => <NumSpan block className="py-0.5 w-20"  decimal={2} value={`${row.getValue<number>('percent') * 100}`} percent isPositive={row.getValue<number>('percent') >= 0} symbol />
    },
    {
      header: '成交额', accessorKey: 'turnover', meta: { align: 'right', width: '19%' },
      cell: ({ row }) => <NumSpan unit decimal={2} value={row.getValue('turnover')} isPositive={row.getValue<number>('percent') >= 0} />
    },
    {
      header: '总市值', accessorKey: 'marketValue', meta: { align: 'right', width: '19%' },
      cell: ({ row }) => priceToCnUnit(row.getValue('marketValue'), 2)
    },
  ]
  // console.log(trading)
  // useEffect(() => {
  //   console.log(trading)
  // }, [trading])

  const isShowTips = () => {

    if (!data || data.length === 0) return false

    const firstRecord = data[0]
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
    <div className="w-full h-full">
      <div className="border-style-primary px-1 py-2">
        <CapsuleTabs activeKey={type.toString()} onChange={(v) => onTypeChange(+v as IncreaseTopStatus)}>
          <CapsuleTabs.Tab value={IncreaseTopStatus.PRE_MARKET.toString()}
            label={<span className="flex items-center">{`${t('stockChart.before')}热门`}&nbsp;{
              isShowTips() && (
                <HoverCard>
                  <HoverCardTrigger  className="flex items-center">
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
                  <HoverCardTrigger  className="flex items-center">
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
      <ScrollArea className="h-[calc(100%-38px)]">
        <div>
          <JknTable rowKey="code" columns={columns} data={data} key="code" />
        </div>
      </ScrollArea>
    </div>
  )
}

export default TopList