import { IncreaseTopStatus, getIncreaseTop } from "@/api"
import { CapsuleTabs, HoverCard, HoverCardContent, HoverCardTrigger, JknIcon, JknRcTable, type JknRcTableProps, NumSpanSubscribe, StockView } from "@/components"
import { useStockQuoteSubscribe, useTableData, useTableRowClickToStockTrading } from "@/hooks"
import { useTime } from "@/store"
import { dateToWeek } from "@/utils/date"
import { type StockTrading, stockUtils } from "@/utils/stock"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

const tradingToTopStatusMap: Record<StockTrading, IncreaseTopStatus> = {
  intraDay: IncreaseTopStatus.INTRA_DAY,
  preMarket: IncreaseTopStatus.PRE_MARKET,
  afterHours: IncreaseTopStatus.AFTER_HOURS,
  close: IncreaseTopStatus.AFTER_HOURS
}

type TableDataType = ReturnType<typeof stockUtils.toStockWithExt>

const TopList = () => {
  const trading = useTime(s => s.getTrading())
  const [type, setType] = useState<IncreaseTopStatus>(tradingToTopStatusMap[trading as keyof typeof tradingToTopStatusMap])
  const { t } = useTranslation()
  const { isToday } = useTime()
  const [list, { setList, onSort }] = useTableData<TableDataType>([], 'symbol')

  const query = useQuery({
    queryKey: [getIncreaseTop.cacheKey, type],
    queryFn: () => getIncreaseTop({ open_status: type, extend: ['total_share', 'stock_before', 'stock_after'] }),
    refetchInterval: 30 * 1000
  })

  const queryClient = useQueryClient()

  useEffect(() => {
    if (!query.data) {
      setList([])
      return
    }

    // const data = query.data?.map(item => stockUtils.toStockRecord(item))
    if (type === IncreaseTopStatus.PRE_MARKET) {
      setList(query.data?.map(v => stockUtils.toStockWithExt(trading === 'preMarket' ? v.extend?.stock_before : v.stock, { extend: v.extend, symbol: v.symbol, name: v.name })))
    } else if (type === IncreaseTopStatus.AFTER_HOURS) {
      setList(query.data?.map(v => stockUtils.toStockWithExt(trading === 'intraDay' ? v.stock : v.extend?.stock_after, { extend: v.extend, symbol: v.symbol, name: v.name })))
    } else {
      setList(query.data?.map(v => stockUtils.toStockWithExt(v.stock, { extend: v.extend, symbol: v.symbol, name: v.name })))
    }

  }, [query.data, setList, type, trading])


  const onTypeChange = (s: IncreaseTopStatus) => {
    setType(s)
    queryClient.invalidateQueries({ queryKey: [getIncreaseTop.cacheKey, s] })
  }

  useStockQuoteSubscribe(query.data?.map(d => d.symbol) ?? [])

  const columns: JknRcTableProps<TableDataType>['columns'] = [
    {
      title: '名称代码', dataIndex: 'name', align: 'left', width: '22%', sort: true,
      render: (_, row) => <StockView code={row.symbol} name={row.name} />

    },
    {
      title: `${type === IncreaseTopStatus.PRE_MARKET ? '盘前' : type === IncreaseTopStatus.AFTER_HOURS ? '盘后' : '现'}价`, dataIndex: 'close', align: 'right', sort: true,
      render: (_, row) => <NumSpanSubscribe code={row.symbol} field="close" blink value={row.close} isPositive={stockUtils.isUp(row)} align="right" />
    },
    {
      title: `${type === IncreaseTopStatus.PRE_MARKET ? '盘前' : type === IncreaseTopStatus.AFTER_HOURS ? '盘后' : ''}涨跌幅%`, dataIndex: 'percent', align: 'right', sort: true,
      width: 100,
      render: (percent, row) => (
        <NumSpanSubscribe code={row.symbol} field="percent" blink block className="w-20" decimal={2} value={percent} percent isPositive={stockUtils.isUp(row)} symbol align="right" />
      )
    },
    {
      title: '成交额', dataIndex: 'turnover', align: 'right', sort: true,
      render: (turnover, row) => <NumSpanSubscribe code={row.symbol} field="turnover" blink align="right" unit decimal={2} value={turnover} />
    },
    {
      title: '总市值', dataIndex: 'marketValue', align: 'right', sort: true,
      render: (marketValue, row) => <NumSpanSubscribe code={row.symbol} field={v => stockUtils.getSubscribeMarketValue(row, v)} blink align="right" unit decimal={2} value={marketValue} />
    },
  ]

  const isShowTips = () => {

    if (!list || list.length === 0) return false

    const firstRecord = list[0]
    if (!firstRecord) return false

    if (isToday(firstRecord.timestamp)) {
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

  const formatDate = (date: number) => {
    const d = dayjs(date).tz('America/New_York')
    return d.isValid() ? (` ${d.format('MM-DD')} ${dateToWeek(d)} `) : date
  }

  const onRowClick = useTableRowClickToStockTrading('symbol')
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
                    {`上一个交易日${formatDate(list[0]?.timestamp)}统计`}
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
                    {`上一个交易日${formatDate(list[0]?.timestamp)}统计`}
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
                    {`上一个交易日${formatDate(list[0]?.timestamp)}统计`}
                  </HoverCardContent>
                </HoverCard>
              )
            }</span>}
          />
          <CapsuleTabs.Tab value={IncreaseTopStatus.YESTERDAY.toString()} label={<span>昨日</span>} />
          <CapsuleTabs.Tab value={IncreaseTopStatus.WEEK.toString()} label={<span>本周</span>} />
        </CapsuleTabs>
      </div>
      <div className="flex-1 overflow-hidden">
        <JknRcTable rowKey="symbol" isLoading={query.isLoading} columns={columns} data={list} onSort={onSort} onRow={onRowClick} />
      </div>
    </div>
  )
}

export default TopList