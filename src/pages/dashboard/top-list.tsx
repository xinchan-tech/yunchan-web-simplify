import { IncreaseTopStatus, getIncreaseTop } from "@/api"
import { CapsuleTabs, HoverCard, HoverCardContent, HoverCardTrigger, JknIcon, JknRcTable, type JknRcTableProps, NumSpan, StockView } from "@/components"
import { useStockQuoteSubscribe, useTableData } from "@/hooks"
import { useTime } from "@/store"
import { dateToWeek, getTrading } from "@/utils/date"
import { type StockRecord, type StockSubscribeHandler, type StockTrading, stockUtils } from "@/utils/stock"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import Decimal from "decimal.js"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

const tradingToTopStatusMap: Record<StockTrading, IncreaseTopStatus> = {
  intraDay: IncreaseTopStatus.INTRA_DAY,
  preMarket: IncreaseTopStatus.PRE_MARKET,
  afterHours: IncreaseTopStatus.AFTER_HOURS,
  close: IncreaseTopStatus.AFTER_HOURS
}

const TopList = () => {
  const trading = useTime(s => s.getTrading())
  const [type, setType] = useState<IncreaseTopStatus>(tradingToTopStatusMap[trading as keyof typeof tradingToTopStatusMap])
  const { t } = useTranslation()
  const { isToday } = useTime()
  const [list, { setList, onSort, updateList }] = useTableData<StockRecord>([], 'symbol')

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
    const data = query.data?.map(item => stockUtils.toStockRecord(item))
    if (type === IncreaseTopStatus.PRE_MARKET) {
      setList(data?.map(v => v[trading === 'preMarket' ? 1 : 0]))
    } else if (type === IncreaseTopStatus.AFTER_HOURS) {
      setList(data?.map(v => v[trading === 'intraDay' ? 0 : 2]))
    } else {
      setList(data?.map(v => v[0]))
    }
  }, [query.data, setList, type, trading])

  const subscribeHandler: StockSubscribeHandler<'quote'> = useCallback((data) => {
    updateList(s => {
      const items = s.map((item) => {
        if (item.symbol === data.topic) {
          const stock = stockUtils.cloneFrom(item)
          stock.close = data.record.close
          stock.prevClose = data.record.preClose
          stock.percent = (data.record.close - data.record.preClose) / data.record.preClose

          return stock
        }
        return item
      })

      return items
    })
  }, [updateList])

  const onTypeChange = (s: IncreaseTopStatus) => {
    setType(s)
    queryClient.invalidateQueries({ queryKey: [getIncreaseTop.cacheKey, s] })
  }

  useStockQuoteSubscribe(query.data?.map(d => d.symbol) ?? [], subscribeHandler)

  const columns: JknRcTableProps<StockRecord>['columns'] = [
    {
      title: '名称代码', dataIndex: 'name', align: 'left', width: '22%',
      render: (_, row) => <StockView code={row.code} name={row.name} />

    },
    {
      title: `${type === IncreaseTopStatus.PRE_MARKET ? '盘前' : type === IncreaseTopStatus.AFTER_HOURS ? '盘后' : '现'}价`, dataIndex: 'close', align: 'right', sort: true,
      render: (_, row) => <NumSpan blink value={row.close} isPositive={row.isUp} align="right" />
    },
    {
      title: `${type === IncreaseTopStatus.PRE_MARKET ? '盘前' : type === IncreaseTopStatus.AFTER_HOURS ? '盘后' : ''}涨跌幅%`, dataIndex: 'percent', align: 'right', sort: true,
      width: 100,
      render: (_, row) => (
        <div className="inline-block">
          <NumSpan block className="w-20" decimal={2} value={Decimal.create(row.percent).mul(100)} percent isPositive={row.isUp} symbol />
        </div>
      )
    },
    {
      title: '成交额', dataIndex: 'turnover', align: 'right', sort: true,
      render: (_, row) => <NumSpan unit decimal={2} value={row.turnover} isPositive={row.isUp} />
    },
    {
      title: '总市值', dataIndex: 'marketValue', align: 'right', sort: true,
      render: (_, row) => Decimal.create(row.marketValue).toDecimalPlaces(2).toShortCN()
    },
  ]

  const isShowTips = () => {

    if (!list || list.length === 0) return false

    const firstRecord = list[0]
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
                    {`上一个交易日${formatDate(list[0]?.date)}统计`}
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
                    {`上一个交易日${formatDate(list[0]?.date)}统计`}
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
                    {`上一个交易日${formatDate(list[0]?.date)}统计`}
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
        <JknRcTable rowKey="symbol" isLoading={query.isLoading} columns={columns} data={list} onSort={onSort} />
      </div>
    </div>
  )
}

export default TopList