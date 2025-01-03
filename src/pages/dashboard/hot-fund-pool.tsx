import { getCollectHot } from "@/api"
import { CapsuleTabs, JknRcTable, type JknRcTableProps, NumSpan, StockView } from "@/components"
import { useStockQuoteSubscribe } from "@/hooks"
import { type StockRecord, StockSubscribeHandler, stockManager } from "@/utils/stock"
import { useQuery } from "@tanstack/react-query"
import Decimal from "decimal.js"
import { useCallback, useEffect, useMemo, useState } from "react"


// type 1: 最热关注
const HotType = 0

const TopList = () => {
  const query = useQuery({
    queryKey: [getCollectHot.cacheKey],
    queryFn: () => getCollectHot({ extend: ['total_share'] }),
    refetchInterval: 30 * 1000
  })
  const [list, setList] = useState<(StockRecord & { blink?: 'up' | 'down' })[]>([])

  useEffect(() => {
    setList(query.data?.find(v => v.type === HotType)?.stocks.map(v => stockManager.toStockRecord(v)[0]) ?? [])
  }, [query.data])

  const updateQuoteHandler = useCallback<StockSubscribeHandler<'quote'>>((data) => {
    setList(draft => draft.map(item => {
      if (item.symbol === data.topic) {
        item.blink = data.record.close > item.close! ? 'up' : 'down'
        item.close = data.record.close
        item.percent = (data.record.close - data.record.preClose) / data.record.preClose
        item.volume = data.record.volume
        item.turnover = data.record.turnover
        item.marketValue = item.totalShare ? item.close * item.totalShare : 0
      }
      return item
    }))
  }, [])

  useStockQuoteSubscribe(query.data?.find(v => v.type === HotType)?.stocks.map(v => v.symbol) ?? [], updateQuoteHandler)

  const columns: JknRcTableProps<StockRecord>['columns'] = [
    {
      title: '名称代码', dataIndex: 'name',align: 'left',
      render: (_, row) => <StockView code={row.code} name={row.name} />
    },
    {
      title: '现价', dataIndex: 'close',align: 'right', width: '17%', sort: true,
      render: (_, row) => <NumSpan blink value={Decimal.create(row.close).toFixed(2)} isPositive={row.isUp} align="right" />
    },
    {
      title: '涨跌幅', dataIndex: 'percent',
      align: 'right', width: '20%', sort: true,
      render: (_, row) => (
        <div className="inline-block">
          <NumSpan block className="py-1 w-20" decimal={2} value={Decimal.create(row.percent).mul(100)} percent isPositive={row.isUp} symbol />
        </div>
      )
    },
    {
      title: '成交额', dataIndex: 'turnover',
      align: 'right', width: '20%', sort: true,
      render: (_, row) => <NumSpan unit decimal={2} value={row.turnover} isPositive={row.isUp} />
    },
    {
      title: '总市值', dataIndex: 'marketValue',
      align: 'right', width: '19%', sort: true,
      render: (_, row) => Decimal.create(row.marketValue).toDecimalPlaces(2).toShortCN()
    },
  ]
  return (
    <div className="w-full h-full">
      <div className="border-style-primary px-1 py-2">
        <CapsuleTabs activeKey="hot">
          <CapsuleTabs.Tab value="hot" label={<span>热度金池</span>} />
        </CapsuleTabs>
      </div>
      <div className="h-[calc(100%-38px)] overflow-hidden">
        <JknRcTable isLoading={query.isLoading} rowKey="code" columns={columns} data={data} />
      </div>
    </div>
  )
}

export default TopList